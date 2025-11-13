// <file_info: tools_catalog_environment.js>
/* 
- Project: Sampo-MCP
- File: src/tool_catalogs/tools_catalog_environment.js
- Version Detection Tools
- Tools for detecting installed software on the system.
- These tools execute version commands and parse the output.
*/
// </file_info: tools_catalog_environment.js>


// <block: imports>
import { missingManual } from "../logger.js";
// </block: imports>


// <block: tool_definitions_version_detection>
export const environmentTools = {


	// <block: get_dotnet_version>
	get_dotnet_version: {
		schema: "SchemaSingle",
		impl: { type: "environment", commands: ["dotnet --info"] },
		description: "Detect .NET SDK and runtime versions.",
		tags: ["environment", "version", "dotnet", "framework", "sdk"],
		examples: [
			{ "tool": "get_dotnet_version", "args": {} },
			missingManual("get_dotnet_version")
		]
	},
	// </block: get_dotnet_version>


	// <block: get_freebasic_version>
	get_freebasic_version: {
		schema: "SchemaSingle",
		impl: { type: "environment", commands: ["fbc64 -version", "fbc32 -version"] },
		description: "Detect FreeBASIC compiler version.",
		tags: ["environment", "version", "freebasic", "compiler", "basic"],
		examples: [
			{ "tool": "get_freebasic_version", "args": {} },
			missingManual("get_freebasic_version")
		]
	},
	// </block: get_freebasic_version>


	// <block: get_git_version>
	get_git_version: {
		schema: "SchemaSingle",
		impl: { type: "environment", commands: ["git --version"] },
		description: "Detect Git version control system version.",
		tags: ["environment", "version", "git", "vcs", "source control"],
		examples: [
			{ "tool": "get_git_version", "args": {} },
			missingManual("get_git_version")
		]
	},
	// </block: get_git_version>


	// <block: get_node_version>
	get_node_version: {
		schema: "SchemaSingle",
		impl: { type: "environment", commands: ["node --version"] },
		description: "Detect Node.js runtime version.",
		tags: ["environment", "version", "node", "nodejs", "javascript", "runtime"],
		examples: [
			{ "tool": "get_node_version", "args": {} },
			missingManual("get_node_version")
		]
	},
	// </block: get_node_version>


	// <block: get_npm_global_packages>
	get_npm_global_packages: {
		schema: "SchemaSingle",
		impl: { type: "environment", commands: ["npm list -g --depth=0"] },
		description: "List globally installed npm packages with versions.",
		tags: ["environment", "version", "npm", "packages", "global", "list", "dependencies"],
		examples: [
			{ "tool": "get_npm_global_packages", "args": {} },
			missingManual("get_npm_global_packages")
		]
	},
	// </block: get_npm_global_packages>


	// <block: get_npm_project_packages>
	get_npm_project_packages: {
		schema: "SchemaSingle",
		impl: { type: "environment", commands: ["npm list --depth=0"] },
		description: "List npm packages in current project directory.",
		tags: ["environment", "version", "npm", "packages", "project", "local", "dependencies"],
		examples: [
			{ "tool": "get_npm_project_packages", "args": {} },
			missingManual("get_npm_project_packages")
		]
	},
	// </block: get_npm_project_packages>


	// <block: get_npm_version>
	get_npm_version: {
		schema: "SchemaSingle",
		impl: { type: "environment", commands: ["npm --version"] },
		description: "Detect npm package manager version.",
		tags: ["environment", "version", "npm", "package manager", "node"],
		examples: [
			{ "tool": "get_npm_version", "args": {} },
			missingManual("get_npm_version")
		]
	},
	// </block: get_npm_version>


	// <block: get_pip_packages>
	get_pip_packages: {
		schema: "SchemaSingle",
		impl: { type: "environment", commands: ["pip list"] },
		description: "List Python packages installed via pip.",
		tags: ["environment", "version", "pip", "python", "packages", "list"],
		examples: [
			{ "tool": "get_pip_packages", "args": {} },
			missingManual("get_pip_packages")
		]
	},
	// </block: get_pip_packages>


	// <block: get_pip_version>
	get_pip_version: {
		schema: "SchemaSingle",
		impl: { type: "environment", commands: ["pip --version"] },
		description: "Detect pip package manager version and Python location.",
		tags: ["environment", "version", "pip", "python", "package-manager"],
		examples: [
			{ "tool": "get_pip_version", "args": {} },
			missingManual("get_pip_version")
		]
	},
	// </block: get_pip_version>


	// <block: get_python_version>
	get_python_version: {
		schema: "SchemaSingle",
		impl: { type: "environment", commands: ["py --version", "python --version", "python3 --version"] },
		description: "Detect Python interpreter version.",
		tags: ["environment", "version", "python", "interpreter"],
		examples: [
			{ "tool": "get_python_version", "args": {} },
			missingManual("get_python_version")
		]
	},
	// </block: get_python_version>


	// <block: get_sqlite3_version>
	get_sqlite3_version: {
		schema: "SchemaSingle",
		impl: { type: "environment", commands: ["sqlite3 --version"] },
		description: "Detect SQLite3 database engine version.",
		tags: ["environment", "version", "sqlite", "sqlite3", "database"],
		examples: [
			{ "tool": "get_sqlite3_version", "args": {} },
			missingManual("get_sqlite3_version")
		]
	},
	// </block: get_sqlite3_version>

};
// </block: tool_definitions_version_detection>