// <file_info: tools_catalog_npm.js>
/* 
- Project: Sampo-MCP
- File: src/tool_catalogs/tool_catalog_npm.js
- NPM Package Management Tools
- Tools for safe npm package management with security restrictions.
*/
// </file_info: tools_catalog_npm.js>


// <block: imports>
import { serverMessageHandler, missingManual } from "../logger.js";
// </block: imports>


// <block: tool_definitions_npm_package_management>
export const npmTools = {


	// <block: npm_command>
	npm_command: {
		schema: "SchemaNpmCommand",
		impl: { type: "npm", commands: ["npm_command"] },
		description: "Run safe npm commands. Whitelisted commands: install, update, list, outdated, audit.",
		tags: ["npm", "package", "management", "node", "dependencies", "install", "update"],
		examples: [
			{ "tool": "npm_command", "args": { "command": "list" } },
			missingManual("npm_command")
		]
	},
	// </block: npm_command>


	// <block: npm_install>
	npm_install: {
		schema: "SchemaNpmInstall",
		impl: { type: "npm", commands: ["npm_install"] },
		description: "Install npm packages from package.json or specific packages. Supports dev dependencies and dry-run.",
		tags: ["npm", "install", "package", "dependencies", "node_modules"],
		examples: [
			{ "tool": "npm_install", "args": {} },
			missingManual("npm_install")
		]
	},
	// </block: npm_install>


	// <block: npm_update>
	npm_update: {
		schema: "SchemaNpmUpdate",
		impl: { type: "npm", commands: ["npm_update"] },
		description: "Update npm packages to latest compatible versions. Supports dry-run to preview changes.",
		tags: ["npm", "update", "upgrade", "package", "dependencies", "version"],
		examples: [
			{ "tool": "npm_update", "args": {} },
			missingManual("npm_update")
		]
	}
	// </block: npm_update>

};

// </block: tool_definitions_npm_package_management>