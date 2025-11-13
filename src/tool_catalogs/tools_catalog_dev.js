// <file_info: tools_catalog_dev.js>
/* 
- Project: Sampo-MCP
- File: src/tool_catalogs/tools_catalog_dev.js
- Development Tools
- Tools for development, debugging, server management, and code exploration.
- Created: 2025-11-03 - Consolidation of dev tools from various catalogs
*/
// </file_info: tools_catalog_dev.js>


// <block: imports>
import { missingManual } from "../logger.js";
// </block: imports>


// <block: tool_definitions_dev>
export const devTools = {

	// ==============================================
	// From system_tools catalog
	// ==============================================

	// <block: add_log_entry>
	add_log_entry: {
		schema: "SchemaAddLogEntry",
		impl: { type: "dev", commands: ["add_log_entry"] },
		description: "Add timestamped entry to development log file (Dev-docs/log.txt). Author name is automatically detected from API key (for HTTP) or client name (for stdio). Max 512 chars per entry. Auto-cleanup at 200 entries (keeps last 100).",
		tags: ["dev", "development", "system", "logging", "notes", "debug"],
		examples: [
			{ "tool": "add_log_entry", "args": { "content": "Fixed bug in file mapper integration" } },
			{ "tool": "add_log_entry", "args": { "content": "Added OAuth authentication to HTTP API" } },
			missingManual("add_log_entry")
		]
	},
	// </block: add_log_entry>
	

	
	
	// <block: get_sampo_package>
	get_sampo_package: {
		schema: "SchemaSingle",
		impl: { type: "dev", commands: ["get_sampo_package"] },
		description: "Get complete package.json contents including all metadata, dependencies, configuration, and custom fields.",
		tags: ["dev", "development", "system", "server", "metadata", "package", "config"],
		examples: [
			{ "tool": "get_sampo_package", "args": {} },
			missingManual("get_sampo_package")
		]
	},
	// </block: get_sampo_package>

	
	// <block: sampo_close>
	sampo_close: {
		schema: "SchemaSingle",
		impl: { type: "dev", commands: ["sampo_close"] },
		description: "Gracefully shut down the Sampo-MCP server. Server will exit cleanly with status code 0.",
		tags: ["dev", "development", "system", "server", "control", "shutdown"],
		examples: [
			{ "tool": "sampo_close", "args": {} },
			missingManual("sampo_close")
		]
	},
	// </block: sampo_close>


	// <block: sampo_restart>
	sampo_restart: {
		schema: "SchemaSingle",
		impl: { type: "dev", commands: ["sampo_restart"] },
		description: "Restart the Sampo-MCP server. Requires running under restart-wrapper.js. Server exits with code 42, wrapper automatically restarts it after 1 second.",
		tags: ["dev", "development", "system", "server", "control", "restart", "reload"],
		examples: [
			{ "tool": "sampo_restart", "args": {} },
			missingManual("sampo_restart")
		]
	},
	// </block: sampo_restart>

	// ==============================================
	// From search_tools catalog
	// ==============================================

	// <block: get_block_list>
	get_block_list: {
		schema: "SchemaGetBlockList",
		impl: { type: "dev", commands: ["get_block_list"] },
		description: "Get alphabetical list of all unique block names in source files.",
		devOnly: true,
		tags: ["dev", "development", "search", "block", "code", "list", "names", "discovery", "developer"],
		examples: [
			{ "tool": "get_block_list", "args": {} },
			missingManual("get_block_list")
		]
	},
	// </block: get_block_list>

	// ==============================================
	// From file_tools catalog
	// ==============================================


	// <block: export_folder_tree>
	export_folder_tree: {
		schema: "SchemaSingle",
		impl: { type: "dev", commands: ["export_folder_tree"] },
		description: "Export complete workspace directory structure as nested JSON showing all folders/subfolders.",
		tags: ["dev", "development", "file", "folder", "directory", "export", "tree", "structure", "metadata"],
		examples: [
			{ "tool": "export_folder_tree", "args": {} },
			missingManual("export_folder_tree")
		]
	},
	// </block: export_folder_tree>


	// <block: export_tools_catalog>
	export_tools_catalog: {
		schema: "SchemaSingle",
		impl: { type: "dev", commands: ["export_tools_catalog"] },
		description: "Export complete catalog of all Sampo-MCP tools as yaml.",
		tags: ["dev", "development", "file", "tools", "export", "catalog", "metadata", "documentation"],
		examples: [
			{ "tool": "export_tools_catalog", "args": {} },
			missingManual("export_tools_catalog")
		]
	},
	// </block: export_tools_catalog>

};
// </block: tool_definitions_dev>