const express = require("express");
const dns = require("dns").promises;
const net = require("net");
const http = require("http");
const https = require("https");
const { URL } = require("url");

const MAX_URL_LENGTH = 2048;
const MAX_HTML_SIZE = 2 * 1024 * 1024;
const REQUEST_TIMEOUT = 12000;
const MAX_REDIRECTS = 3;

function isPrivateIPv4(ip) {
    const parts = String(ip)
        .split(".")
        .map(Number);

    if (
        parts.length !== 4 ||
        parts.some(
            value => Number.isNaN(value)
        )
    ) {
        return true;
    }

    const [a, b] = parts;

    return (
        a === 0 ||
        a === 10 ||
        a === 127 ||
        a >= 224 ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168)
    );
}

function isPrivateIPv6(ip) {
    const value =
        String(ip).toLowerCase();

    return (
        value === "::" ||
        value === "::1" ||
        value.startsWith("fc") ||
        value.startsWith("fd") ||
        value.startsWith("fe80:")
    );
}

function isPrivateAddress(ip) {
    const version =
        net.isIP(ip);

    if (version === 4) {
        return isPrivateIPv4(ip);
    }

    if (version === 6) {
        return isPrivateIPv6(ip);
    }

    return true;
}

async function validateHostname(hostname) {
    const host =
        String(hostname)
            .toLowerCase()
            .trim();

    if (
        host === "localhost" ||
        host.endsWith(".localhost") ||
        host.endsWith(".local") ||
        host.endsWith(".internal")
    ) {
        throw new Error(
            "Host lokal/private tidak diperbolehkan."
        );
    }

    const addresses =
        await dns.lookup(
            host,
            {
                all: true
            }
        );

    if (!addresses.length) {
        throw new Error(
            "Hostname tidak dapat di-resolve."
        );
    }

    for (
        const item of addresses
    ) {

        if (
            isPrivateAddress(
                item.address
            )
        ) {
            throw new Error(
                "Website mengarah ke alamat jaringan private."
            );
        }
    }
}

function stripComments(source) {
    return String(source)
        .replace(
            /\/\*[\s\S]*?\*\//g,
            ""
        )
        .replace(
            /(^|[^:])\/\/.*$/gm,
            "$1"
        );
}

function stripStrings(source) {

    return String(source)
        .replace(
            /"(?:\\.|[^"\\])*"/g,
            '""'
        )
        .replace(
            /'(?:\\.|[^'\\])*'/g,
            "''"
        )
        .replace(
            /`(?:\\.|[^`\\])*`/g,
            "``"
        );
}

function getCodeOnly(source) {

    return stripStrings(
        stripComments(source)
    );
}

function scanHtml(source) {

    const issues = [];

    const images =
        source.match(
            /<img\b[^>]*>/gi
        ) || [];

    let missingAlt = 0;

    for (
        const image of images
    ) {

        if (
            !/\balt\s*=/i.test(
                image
            )
        ) {
            missingAlt++;
        }
    }

    if (
        missingAlt > 0
    ) {

        issues.push({
            severity: "warning",

            message:
                `${missingAlt} elemen <img> tidak memiliki atribut alt.`
        });
    }

    const ids = [];

    const idRegex =
        /\bid\s*=\s*["']([^"']+)["']/gi;

    let match;

    while (
        (match =
            idRegex.exec(source))
    ) {

        ids.push(
            match[1]
        );
    }

    const duplicates = [
        ...new Set(
            ids.filter(
                (id, index) =>
                    ids.indexOf(id) !== index
            )
        )
    ];

    if (
        duplicates.length > 0
    ) {

        issues.push({
            severity: "warning",

            message:
                "Duplicate HTML ID: " +
                duplicates.join(", ")
        });
    }

    return issues;
}

function scanSource(
    source,
    filename
) {

    const issues = [];

    const text =
        String(source);

    const code =
        getCodeOnly(text);

    const lower =
        filename
            .toLowerCase();

    /*
     * Dangerous JavaScript execution.
     *
     * Pemeriksaan memakai `code`
     * supaya string/comment tidak dianggap
     * sebagai eksekusi.
     */

    if (
        /\beval\s*\(/i.test(code)
    ) {

        issues.push({
            severity: "critical",
            message:
                "Ditemukan penggunaan eval()."
        });
    }

    if (
        /\bnew\s+Function\s*\(/i.test(code)
    ) {

        issues.push({
            severity: "critical",
            message:
                "Ditemukan penggunaan new Function()."
        });
    }

    /*
     * Node.js process APIs
     */

    const childProcessImport =
        /require\s*\(\s*["']child_process["']\s*\)/i.test(
            text
        );

    const childProcessFrom =
        /from\s+["']child_process["']/i.test(
            text
        );

    const processCall =
        /\b(?:execSync|spawnSync|execFileSync)\s*\(/i.test(
            code
        );

    if (
        childProcessImport ||
        childProcessFrom ||
        processCall
    ) {

        issues.push({
            severity: "critical",
            message:
                "Ditemukan penggunaan API proses sistem Node.js."
        });
    }

    /*
     * Private key
     */

    if (
        /-----BEGIN\s+(RSA|OPENSSH|EC|DSA|PRIVATE)\s+KEY-----/i.test(
            text
        )
    ) {

        issues.push({
            severity: "critical",
            message:
                "Ditemukan pola private key."
        });
    }

    /*
     * Google API key
     */

    if (
        /AIza[0-9A-Za-z_-]{20,}/.test(
            text
        )
    ) {

        issues.push({
            severity: "critical",
            message:
                "Ditemukan pola Google API key."
        });
    }

    /*
     * Hardcoded secret.
     */

    const secretPattern =
        /\b(api[_-]?key|secret[_-]?key|password|passwd|token|access[_-]?token|client[_-]?secret)\b\s*[:=]\s*["'][^"'\r\n]{8,}["']/i;

    if (
        secretPattern.test(text)
    ) {

        issues.push({
            severity: "critical",
            message:
                "Ditemukan kemungkinan hardcoded secret/password/token/API key."
        });
    }

    /*
     * TODO / FIXME
     */

    if (
        /\bTODO\b/i.test(text) ||
        /\bFIXME\b/i.test(text)
    ) {

        issues.push({
            severity: "notice",
            message:
                "Terdapat komentar TODO/FIXME."
        });
    }

    /*
     * Console logging
     */

    if (
        /\bconsole\.(log|debug|info|warn|error)\s*\(/i.test(
            code
        )
    ) {

        issues.push({
            severity: "notice",
            message:
                "Ditemukan console logging."
        });
    }

    /*
     * HTTP
     */

    if (
        /\bhttp:\/\//i.test(text)
    ) {

        issues.push({
            severity: "warning",
            message:
                "Ditemukan referensi HTTP yang tidak terenkripsi."
        });
    }

    /*
     * JSON
     */

    if (
        lower.endsWith(".json")
    ) {

        try {

            JSON.parse(text);

        } catch {

            issues.push({
                severity: "critical",
                message:
                    "JSON tidak valid."
            });
        }
    }

    /*
     * CSS
     */

    if (
        lower.endsWith(".css") ||
        lower.endsWith(".scss") ||
        lower.endsWith(".less")
    ) {

        const open =
            (
                text.match(
                    /\{/g
                ) || []
            ).length;

        const close =
            (
                text.match(
                    /\}/g
                ) || []
            ).length;

        if (
            open !== close
        ) {

            issues.push({
                severity: "critical",
                message:
                    "Jumlah tanda { dan } pada stylesheet tidak seimbang."
            });
        }
    }

    /*
     * HTML
     */

    if (
        lower.endsWith(".html") ||
        lower.endsWith(".htm") ||
        lower.endsWith(".php") ||
        lower.endsWith(".vue") ||
        lower.endsWith(".svelte")
    ) {

        issues.push(
            ...scanHtml(text)
        );
    }

    return issues;
}

function fetchUrl(
    targetUrl,
    redirectsLeft = MAX_REDIRECTS
) {

    return new Promise(
        async (
            resolve,
            reject
        ) => {

            let parsed;

            try {

                parsed =
                    new URL(targetUrl);

            } catch {

                reject(
                    new Error(
                        "URL tidak valid."
                    )
                );

                return;
            }

            if (
                parsed.protocol !==
                    "http:" &&
                parsed.protocol !==
                    "https:"
            ) {

                reject(
                    new Error(
                        "Hanya HTTP dan HTTPS yang diperbolehkan."
                    )
                );

                return;
            }

            if (
                parsed.username ||
                parsed.password
            ) {

                reject(
                    new Error(
                        "URL dengan username/password tidak diperbolehkan."
                    )
                );

                return;
            }

            try {

                await validateHostname(
                    parsed.hostname
                );

            } catch (error) {

                reject(error);

                return;
            }

            const transport =
                parsed.protocol === "https:"
                    ? https
                    : http;

            const request =
                transport.request(
                    parsed,
                    {
                        method: "GET",

                        headers: {
                            "User-Agent":
                                "WebToolsKita-CodeGuard-V2/1.0",

                            "Accept":
                                "text/html,text/plain,application/json,*/*"
                        },

                        timeout:
                            REQUEST_TIMEOUT
                    },

                    response => {

                        const status =
                            response.statusCode || 0;

                        if (
                            status >= 300 &&
                            status < 400 &&
                            response.headers.location
                        ) {

                            if (
                                redirectsLeft <= 0
                            ) {

                                response.resume();

                                reject(
                                    new Error(
                                        "Terlalu banyak redirect."
                                    )
                                );

                                return;
                            }

                            const nextUrl =
                                new URL(
                                    response.headers.location,
                                    parsed
                                ).toString();

                            response.resume();

                            fetchUrl(
                                nextUrl,
                                redirectsLeft - 1
                            )
                                .then(resolve)
                                .catch(reject);

                            return;
                        }

                        const chunks = [];

                        let size = 0;

                        response.on(
                            "data",
                            chunk => {

                                size +=
                                    chunk.length;

                                if (
                                    size >
                                    MAX_HTML_SIZE
                                ) {

                                    response.destroy(
                                        new Error(
                                            "Ukuran halaman melebihi batas 2 MB."
                                        )
                                    );

                                    return;
                                }

                                chunks.push(
                                    chunk
                                );
                            }
                        );

                        response.on(
                            "end",
                            () => {

                                resolve({
                                    url:
                                        parsed.toString(),

                                    status,

                                    headers:
                                        response.headers,

                                    body:
                                        Buffer
                                            .concat(
                                                chunks
                                            )
                                            .toString(
                                                "utf8"
                                            )
                                });
                            }
                        );
                    }
                );

            request.on(
                "timeout",
                () => {

                    request.destroy(
                        new Error(
                            "Request timeout."
                        )
                    );
                }
            );

            request.on(
                "error",
                reject
            );

            request.end();
        }
    );
}

function createCodeGuardRouter(
    options = {}
) {

    const router =
        express.Router();

    const requireAuth =
        options.requireAuth ||
        (
            (req, res, next) => {
                next();
            }
        );

    router.post(
        "/api/codeguard/website",
        requireAuth,
        async (
            req,
            res
        ) => {

            try {

                const target =
                    String(
                        req.body &&
                        req.body.url
                            ? req.body.url
                            : ""
                    ).trim();

                if (!target) {

                    return res.status(
                        400
                    ).json({
                        success: false,
                        message:
                            "URL wajib diisi."
                    });
                }

                if (
                    target.length >
                    MAX_URL_LENGTH
                ) {

                    return res.status(
                        400
                    ).json({
                        success: false,
                        message:
                            "URL terlalu panjang."
                    });
                }

                const result =
                    await fetchUrl(
                        target
                    );

                const issues =
                    scanSource(
                        result.body,
                        "index.html"
                    );

                return res.json({
                    success: true,

                    url:
                        result.url,

                    status:
                        result.status,

                    filesScanned: 1,

                    issues
                });

            } catch (error) {

                console.error(
                    "[CodeGuard V2]",
                    error.message
                );

                return res.status(
                    400
                ).json({
                    success: false,
                    message:
                        error.message ||
                        "Website scan gagal."
                });
            }
        }
    );

    return router;
}

module.exports = {
    createCodeGuardRouter
};