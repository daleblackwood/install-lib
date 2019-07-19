const ArgumentParser = require("argparse").ArgumentParser;
const path = require("path");
const fs = require("fs-extra");
const spawn = require("child_process").spawn;
const packageJson = require("./package.json");

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
            console.log("\n - - - - - -\n Starting process " + name + (cwd ? " in " + cwd : "") + "...\n - - - - - -\n");
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
                console.log("Process " + name + " closed (" + code + ")\n - - - - - -\n");
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

function printHelp() {
	console.log("to run: npx libr [npm path] [module name]\n" + 
		"  npm path: 				the npm package to install\n" +
		"  module name: (optional) 	the filesystem package name\n" +
		"							(defaults to last of npm path)\n");
}

async function run() {
    const parser = new ArgumentParser({
        version: packageJson.version,
        addHelp: true,
        description: packageJson.description
    });
    parser.addArgument("package", {
        description: "the npm package to install"
    });
    parser.addArgument(["--name", "-n"], {
        description: "the local package name",
        defaultValue: ""
    });
    parser.addArgument(["--out", "-o"], {
        description: "the folder to write to",
        defaultValue: "node_libs"
    });
    const args = parser.parseArgs();

	const package = args.package;
	if (typeof package !== "string" || package.length < 1) {
		console.error("Couldn't understand package.");
		printHelp();
		process.exit(1);
	}

	const requireName = args.name || package;

	const tempDir = path.join(__dirname, "_libs");
	if ((await fs.exists(tempDir)) === false) {
		await fs.mkdir(tempDir);
    }
    const outName = args.out || "node_libs";
	const outDirParent = path.join(process.cwd(), outName);
	if ((await fs.exists(outDirParent)) === false) {
		await fs.mkdir(outDirParent);
	}
	const outDir = path.join(outDirParent, path.basename(requireName));
	await runProcess( 
		"Make package placeholder", 
		"npm", ["init", "-y"], 
		{ cwd: tempDir }
	);
	await runProcess(
		"Install package", 
		"npm", ["i", package], 
		{ cwd: tempDir }
	);
	await runProcess(
		"Package package", 
		"npx", [
			"@zeit/ncc", "build", 
			"node_modules/" + requireName, 
			"-o", outDir
		], 
		{ cwd: tempDir }
	);

	await fs.emptyDir(tempDir);
}

run();
