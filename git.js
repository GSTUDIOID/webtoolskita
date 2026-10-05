const { execFile } = require("child_process");

const REPOSITORY_PATH = "D:\\webtoolskita";


function runGit(args) {
    return new Promise((resolve, reject) => {

        execFile(
            "git",
            args,
            {
                cwd: REPOSITORY_PATH,
                windowsHide: true,
                maxBuffer: 10 * 1024 * 1024
            },
            (error, stdout, stderr) => {

                const result = {
                    success: !error,
                    code: error ? error.code : 0,
                    stdout: stdout || "",
                    stderr: stderr || ""
                };

                if (error) {
                    resolve(result);
                    return;
                }

                resolve(result);
            }
        );

    });
}


async function gitStatus() {

    return await runGit([
        "status",
        "--short",
        "--branch"
    ]);

}


async function gitBranch() {

    return await runGit([
        "branch",
        "--show-current"
    ]);

}


async function gitRemote() {

    return await runGit([
        "remote",
        "-v"
    ]);

}


async function gitAdd() {

    return await runGit([
        "add",
        "-A"
    ]);

}


async function gitCommit(message) {

    if (
        typeof message !== "string" ||
        !message.trim()
    ) {

        return {
            success: false,
            code: 1,
            stdout: "",
            stderr: "Commit message wajib diisi."
        };

    }


    return await runGit([
        "commit",
        "-m",
        message.trim()
    ]);

}


async function gitPush() {

    return await runGit([
        "push"
    ]);

}


async function gitSync(message) {

    if (
        typeof message !== "string" ||
        !message.trim()
    ) {

        return {
            success: false,
            code: 1,
            stdout: "",
            stderr: "Commit message wajib diisi."
        };

    }


    const addResult = await gitAdd();

    if (!addResult.success) {

        return {
            success: false,
            step: "add",
            add: addResult
        };

    }


    const commitResult =
        await gitCommit(message);

    if (!commitResult.success) {

        return {
            success: false,
            step: "commit",
            add: addResult,
            commit: commitResult
        };

    }


    const pushResult =
        await gitPush();


    return {
        success: pushResult.success,
        step: "push",
        add: addResult,
        commit: commitResult,
        push: pushResult
    };

}


module.exports = {
    REPOSITORY_PATH,
    runGit,
    gitStatus,
    gitBranch,
    gitRemote,
    gitAdd,
    gitCommit,
    gitPush,
    gitSync
};