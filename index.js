#!/usr/bin/env node

const path = require("path");
const fs = require("fs-extra");
const spawn = require("child_process").spawn;

function runProcess(name, command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
        let cwd = options.cwd;
        if (cwd) {
            if (fs.existsSync(cwd) === false) {
                return reject("path " + cwd + " path doesn't exist");
            }
            const stat = fs.statSync(cwd);
            if (stat.isDirectory() === false) {
                return reject("path " + cwd + " is not a directory");
            }
        }
        
        const onLog = options.onLog || console.log;
        function handleLog(str, options) {
            str = str.trim();
            if (str) {
                onLog(str, options);
            }
        }

        if (options.mute !== true) {
            console.log("Running " + name + "...");
            console.log(" > " + command + " " + args.join(" "));
        }
        const ls = spawn(command, args || [], {
            cwd,
            env: process.env
        });
        ls.stdout.on("data", data => {
            handleLog(data.toString(), options);
        });
        ls.stderr.on("data", data => {
            handleLog(data.toString(), options);
        });
        ls.on("close", code => {
            if (options.mute !== true) {
                console.log("Completed " + name + " (" + code + ")");
            }
            if (options.onExit) {
                options.onExit();
            }
            else {
                resolve(code);
            }
        });
    });
}

async function jsonRead(path) {
    let json = null;
    if (await fs.exists(path)) {
        const jsonStr = await fs.readFile(path, { encoding: "utf-8" });
        try {
            json = JSON.parse(jsonStr);
        }
        catch (e) {}
    }
    return json;
}

async function installPackage(package) {
    console.log("Installing package " + package + "...");
	if (typeof package !== "string" || package.length < 1) {
		console.error("Couldn't understand package.", HELP);
		process.exit(1);
	}

	const tempDir = path.join(__dirname, "_libs");
	if ((await fs.exists(tempDir)) === false) {
		await fs.mkdir(tempDir);
    }
    const outName = "node_modules";
	const outDirParent = path.join(process.cwd(), outName);
	if ((await fs.exists(outDirParent)) === false) {
		await fs.mkdir(outDirParent);
	}
	await runProcess( 
		"Make package placeholder", 
		"npm", ["init", "-y"], 
		{ cwd: tempDir, onLog: () => {}, mute: true }
	);
	await runProcess(
		"Install package " + package, 
		"npm", ["i", package, "--save"], 
		{ cwd: tempDir, onLog: () => {}, mute: true }
    );
    const libJson = require(path.join(tempDir, "package.json"));
    const requireName = Object.keys(libJson.dependencies)[0];
	const outDir = path.join(outDirParent, path.basename(requireName));
	await runProcess(
		"Package package " + package, 
		"npx", [
			"@zeit/ncc", "build", 
			"node_modules/" + requireName, 
			"-o", outDir
		], 
		{ cwd: tempDir, onLog: () => {}, mute: true }
    );
    
    const outJsonPath = path.join(process.cwd(), "package.json");
    const outJson = require(outJsonPath);
    outJson.libs = outJson.libs || [];
    if (outJson.libs.includes(package) === false) {
        outJson.libs.push(package);
    }
    await fs.writeFile(outJsonPath, JSON.stringify(outJson, null, "  "), { encoding: "utf-8" });

    await fs.emptyDir(tempDir);

    console.log("Installed " + package + " to " + path.relative(process.cwd(), outDir));
}

const HELP = "lib-install\n" +
    "  to install a package : npx install-lib [lib] ...[additional libs]...\n";
    "  to install from package.json : npx install-lib\n";

async function run() {
    let packages = process.argv.slice(2);
    if (packages.length < 1) {
        // attempt package.json install
        const localJsonPath = path.join(process.cwd(), "package.json");
        const localJson = await jsonRead(localJsonPath);
        if (localJson && localJson.libs && localJson.libs.length > 0) {
            packages = localJson.libs;
        }
        else {
            // nothing to do
            console.log(HELP);
            process.exit(1);
            return;
        }
    }

    for (const package of packages) {
        try {
            installPackage(package, package);
        } catch (e) {
            console.error("\nFailed to install package '" + package + "'\n", e);
        }
    }
}

run();
