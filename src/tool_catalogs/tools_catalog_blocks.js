// <file_info: tools_catalog_blocks.js>
/* 
- Project: Sampo-MCP
- File: src/tool_catalogs/tool_catalog_blocks.js
- Block Manipulation Tools
- Revolutionary semantic code editing system that works with named code blocks.
*/
// </file_info: tools_catalog_blocks.js>


// <block: imports>
import { serverMessageHandler, missingManual } from "../logger.js";
// </block: imports>


// <block: tool_definitions_block_manipulation>
export const blockTools = {

	// <block: extract_block>
	read_block: {
		schema: "SchemaReadBlock",
		impl: { type: "block", commands: ["read_block"] }, 
		description: "Extract named code block content from a file, excluding markers.",
		devOnly: true,
		tags: ["block", "extract", "get", "content", "code", "read", "developer"],
		examples: [
			{ "tool": "extract_block", "args": { "path": "tool_system.js", "block": "get_cpu_info" } },
			missingManual("extract_block")
		]
	},
	// </block: extract_block>


	// <block: replace_block>
	replace_block: {
		schema: "SchemaUpdateBlock",
		impl: { type: "block", commands: ["update_block"] },
		description: "Replace block content in place. Preserves markers, updates content. Creates backup by default.",
		devOnly: true,
		tags: ["block", "replace", "update", "refactor", "modify", "edit", "developer"],
		examples: [
			{ "tool": "replace_block", "args": { "path": "server.js", "block": "health_check", "content": "app.get('/api/health', (req, res) => {\n\tres.json({ status: 'healthy', uptime: process.uptime() });\n});" } },
			missingManual("replace_block")
		]
	},
	// </block: replace_block>


	// <block: delete_block>
	delete_block: {
		schema: "SchemaDeleteBlock",
		impl: { type: "block", commands: ["delete_block"] },
		description: "Delete entire code block including markers. Creates backup by default.",
		devOnly: true,
		tags: ["block", "delete", "remove", "cleanup", "drop", "developer"],
		examples: [
			{ "tool": "delete_block", "args": { "path": "old_features.js", "block": "deprecated_function" } },
			missingManual("delete_block")
		]
	},
	// </block: delete_block>


	// <block: duplicate_block>
	duplicate_block: {
		schema: "SchemaDuplicateBlock",
		impl: { type: "block", commands: ["duplicate_block"] },
		description: "Duplicate block with new name. Creates identical copy with different markers.",
		devOnly: true,
		tags: ["block", "duplicate", "copy", "clone", "template", "developer"],
		examples: [
			{ "tool": "duplicate_block", "args": { "path": "handlers.js", "block": "get_user", "new_name": "get_admin" } },
			missingManual("duplicate_block")
		]
	},
	// </block: duplicate_block>


	// <block: insert_block>
	add_block: {
		schema: "SchemaAddBlock",
		impl: { type: "block", commands: ["add_block"] },
		description: "Add new block at specified position: start, end, specific line, or relative to another block.",
		devOnly: true,
		tags: ["block", "insert", "add", "create", "new", "developer"],
		examples: [
			{ "tool": "insert_block", "args": { "path": "server.js", "block": "new_endpoint", "content": "app.get('/api/new', (req, res) => res.json({ ok: true }));" } },
			missingManual("insert_block")
		]
	},
	// </block: insert_block>


	// <block: move_block>
	move_block: {
		schema: "SchemaMoveBlock",
		impl: { type: "block", commands: ["move_block"] },
		description: "Move block from one file to another. Creates backups of both files by default.",
		devOnly: true,
		tags: ["block", "move", "relocate", "refactor", "organize", "transfer", "developer"],
		examples: [
			{ "tool": "move_block", "args": { "from_file": "utils.js", "to_file": "helpers.js", "block": "formatDate" } },
			missingManual("move_block")
		]
	},
	// </block: move_block>


	// <block: rename_block>
	rename_block: {
		schema: "SchemaRenameBlock",
		impl: { type: "block", commands: ["rename_block"] },
		description: "Rename block without modifying content. Protected blocks (file_info_*, imports) cannot be renamed.",
		devOnly: true,
		tags: ["block", "rename", "refactor", "reorganize", "developer"],
		examples: [
			{ "tool": "rename_block", "args": { "path": "handlers.js", "old_name": "get_user_handler", "new_name": "fetch_user_data" } },
			missingManual("rename_block")
		]
	},
	// </block: rename_block>


	// <block: search_blocks>
	search_blocks: {
		schema: "SchemaSearchBlocks",
		impl: { type: "block", commands: ["search_blocks"] },
		description: "Search and map code blocks in source files. Generates JSON with file locations and line numbers.",
		devOnly: true,
		tags: ["search", "block", "code", "navigation", "map", "discovery", "find", "developer"],
		examples: [
			{ "tool": "search_blocks", "args": {} },
			missingManual("search_blocks")
		]
	}
	// </block: search_blocks>

};
// </block: tool_definitions_block_manipulation>