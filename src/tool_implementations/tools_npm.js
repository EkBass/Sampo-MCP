// <file_info: tools_npm.js>
/* 
- Project: Sampo-MCP
- File: src/tool_implementations/tool_npm.js
- Safe npm operations for package management
*/
// </file_info: tools_npm.js>


// <block: imports>
import { validateWorkspacePath } from "../inits.js";
import { exec, createError, createResponse } from "../utils.js";
// </block: imports>


// <block: constants_and_helpers>
const NPM_ALIASES = {
	i: "install",
	ls: "list",
	info: "view",
};

const ALLOWED_NPM_COMMANDS = Array.from(new Set([
	"install", "update", "outdated", "list", "view",
	"search", "audit", "doctor", "ci", "fund",
	"explain", "dedupe", "prune",
	"i", "ls", "info",
]));
	
const DRY_RUN_CAPABLE = new Set(["install", "update"]);

const isArgSafe = (s) => typeof s === "string" && !/[;&|><]/.test(s);

function normalizeCommand(cmd) {
	if (!cmd) return null;
	const lower = String(cmd).toLowerCase();
	return NPM_ALIASES[lower] ?? lower;
}

function buildNpmCommand({ npmCommand, args = [], packages = [], saveDev = false, dryRun = false }) {
	let parts = ["npm", npmCommand];

	if (packages.length > 0) {
		const safePkgs = packages.filter(isArgSafe);
		if (safePkgs.length !== packages.length) {
			throw new Error("Unsafe package name detected.");
		}
		parts.push(...safePkgs);
	}

	if (args.length > 0) {
		const safeArgs = args.filter(isArgSafe);
		if (safeArgs.length !== args.length) {
			throw new Error("Unsafe argument detected.");
		}
		parts.push(...safeArgs);
	}

	if (saveDev) parts.push("--save-dev");
	if (dryRun && DRY_RUN_CAPABLE.has(npmCommand)) parts.push("--dry-run");

	return parts.join(" ");
}

async function runNpm({ fullCommand, cwd, clientReturn, logInfo, logError, title, meta = {} }) {
	try {
		logInfo(`Running npm: ${fullCommand} (cwd: ${cwd})`);

		const { stdout, stderr } = await exec(fullCommand, {
			cwd,
			maxBuffer: 10 * 1024 * 1024, // 10MB
			// maybe timeout utils.exec
		});

		return clientReturn(
			createResponse(title, {
				command: fullCommand,
				path: cwd,
				stdout: String(stdout || "").trim(),
				stderr: String(stderr || "").trim(),
				timestamp: new Date().toISOString(),
				...meta,
			})
		);
	} catch (err) {
		logError(`npm failed: ${err.message}`);
		return clientReturn(
			createError("NPM_COMMAND_FAILED", err.message, {
				command: fullCommand,
				stdout: err.stdout || "",
				stderr: err.stderr || "",
				...meta,
			})
		);
	}
}
// </block: constants_and_helpers>


// <block: tool_factory_npm>
export const makeNpmTool = (commands) => async (_args, ctx) => {
	const { clientReturn, logInfo, logError } = ctx;
	const cmd = commands[0];

	switch (cmd) {
		// <block: case_npm_command>
		case "npm_command": {
			const rawCmd = _args?.command;
			const npmCommand = normalizeCommand(rawCmd);
			const targetPath = _args?.path || ".";
			const args = Array.isArray(_args?.args) ? _args.args : [];
			const dryRun = Boolean(_args?.dry_run);

			if (!npmCommand) {
				return clientReturn(createError("MISSING_COMMAND", "npm command is required"));
			}
			if (!ALLOWED_NPM_COMMANDS.includes(rawCmd)) {
				// Salli aliaksen tarkistus kanoniseen – jos käyttäjä antoi aliaksen, sekin on sallittu listassa
				return clientReturn(
					createError(
						"COMMAND_NOT_ALLOWED",
						`Command '${rawCmd}' is not allowed. Allowed: ${ALLOWED_NPM_COMMANDS.join(", ")}`
					)
				);
			}

			try {
				const validatedPath = validateWorkspacePath(targetPath);
				const fullCommand = buildNpmCommand({ npmCommand, args, dryRun });
				return await runNpm({
					fullCommand,
					cwd: validatedPath,
					clientReturn,
					logInfo,
					logError,
					title: `npm ${npmCommand} completed${dryRun ? " (dry run)" : ""}`,
					meta: { dry_run: dryRun },
				});
			} catch (err) {
				logError(`npm command failed: ${err.message}`);
				return clientReturn(createError("NPM_COMMAND_FAILED", err.message));
			}
		}
		// </block: case_npm_command>
	
	
		// <block: case_npm_install>
		case "npm_install": {
			const targetPath = _args?.path || ".";
			const packages = Array.isArray(_args?.packages) ? _args.packages : [];
			const saveDev = Boolean(_args?.save_dev);
			const dryRun = Boolean(_args?.dry_run);

			try {
				const validatedPath = validateWorkspacePath(targetPath);
				const npmCommand = "install";
				const fullCommand = buildNpmCommand({ npmCommand, packages, saveDev, dryRun });

				return await runNpm({
					fullCommand,
					cwd: validatedPath,
					clientReturn,
					logInfo,
					logError,
					title: `Package installation completed${dryRun ? " (dry run)" : ""}`,
					meta: {
						packages: packages.length > 0 ? packages : "all from package.json",
						save_dev: saveDev,
						dry_run: dryRun,
					},
				});
			} catch (err) {
				logError(`npm install failed: ${err.message}`);
				return clientReturn(createError("INSTALL_FAILED", err.message));
			}
		}
		// </block: case_npm_install>
		
	
		// <block: case_npm_update>
		case "npm_update": {
			const targetPath = _args?.path || ".";
			const packages = Array.isArray(_args?.packages) ? _args.packages : [];
			const dryRun = Boolean(_args?.dry_run);

			try {
				const validatedPath = validateWorkspacePath(targetPath);
				const npmCommand = "update";
				const fullCommand = buildNpmCommand({ npmCommand, packages, dryRun });

				return await runNpm({
					fullCommand,
					cwd: validatedPath,
					clientReturn,
					logInfo,
					logError,
					title: `Package update completed${dryRun ? " (dry run)" : ""}`,
					meta: {
						packages: packages.length > 0 ? packages : "all packages",
						dry_run: dryRun,
					},
				});
			} catch (err) {
				logError(`npm update failed: ${err.message}`);
				return clientReturn(createError("UPDATE_FAILED", err.message));
			}
		}
		// </block: case_npm_update>
	
		default:
			return clientReturn(createError("UNKNOWN_NPM_TOOL", `Unknown npm tool: ${cmd}`));
	}
};
// </block: tool_factory_npm>