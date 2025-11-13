// <file_info: tools_catalog_files.js>
/* 
- Project: Sampo-MCP
- File: src/tool_catalogs/tool_catalog_files.js
- File and Folder Operation Tools (includes advanced editing)
- Tools for creating, reading, modifying, and managing files and folders.
- Merged with edit tools on 2025-11-03
*/
// </file_info: tools_catalog_files.js>


// <block: imports>
import { serverMessageHandler, missingManual } from "../logger.js";
// </block: imports>


// <block: Case factory>
export const fileTools = {

	// <block: append_file>
	append_file: {
		schema: "SchemaAppendFile",
		impl: { type: "file", commands: ["append_file"] },
		description: "Append content to end of file or prepend to beginning.",
		tags: ["file", "write", "append", "prepend", "modify", "edit"],
		examples: [
			{ "tool": "append_file", "args": { "path": "log.txt", "content": "New log entry\n" } },
			missingManual("append_file")
		]
	},
	// </block: append_file>


	// <block: copy_file>
	copy_file: {
		schema: "SchemaCopyFile",
		impl: { type: "file", commands: ["copy_file"] },
		description: "Copy or move file to new location.",
		tags: ["file", "copy", "move", "backup"],
		examples: [
			{ "tool": "copy_file", "args": { "from": "original.txt", "to": "backup/original.txt" } },
			missingManual("copy_file")
		]
	},
	// </block: copy_file>


	// <block: copy_folder>
	copy_folder: {
		schema: "SchemaCopyFolder",
		impl: { type: "file", commands: ["copy_folder"] },
		description: "Copy or move folder and all contents to new location.",
		tags: ["file", "folder", "directory", "copy", "move", "backup"],
		examples: [
			{ "tool": "copy_folder", "args": { "from": "old_project", "to": "backup/old_project" } },
			missingManual("copy_folder")
		]
	},
	// </block: copy_folder>


	// <block: create_folder>
	create_folder: {
		schema: "SchemaSingleFile",
		impl: { type: "file", commands: ["create_folder"] },
		description: "Create new folder. Creates parent directories if needed.",
		tags: ["file", "folder", "directory", "create", "mkdir"],
		examples: [
			{ "tool": "create_folder", "args": { "path": "new_folder" } },
			missingManual("create_folder")
		]
	},
	// </block: create_folder>


	// <block: delete_file>
	delete_file: {
		schema: "SchemaSingleFile",
		impl: { type: "file", commands: ["delete_file"] },
		description: "Delete file by moving to Trash.",
		tags: ["file", "delete", "trash", "remove"],
		examples: [
			{ "tool": "delete_file", "args": { "path": "old_file.txt" } },
			missingManual("delete_file")
		]
	},
	// </block: delete_file>


	// <block: delete_folder>
	delete_folder: {
		schema: "SchemaDeleteFolder",
		impl: { type: "file", commands: ["delete_folder"] },
		description: "Delete folder by moving to Trash.",
		tags: ["file", "folder", "directory", "delete", "trash", "remove"],
		examples: [
			{ "tool": "delete_folder", "args": { "path": "empty_folder" } },
			missingManual("delete_folder")
		]
	},
	// </block: delete_folder>


	// <block: delete_lines>
	delete_lines: {
		schema: "SchemaDeleteLines",
		impl: { type: "file", commands: ["delete_lines"] },
		description: "Delete a range of lines from a file (inclusive).",
		tags: ["file", "edit", "delete", "remove", "lines", "cleanup"],
		examples: [
			{ "tool": "delete_lines", "args": { "path": "old-code.js", "start": 10, "end": 25 } },
			missingManual("delete_lines")
		]
	},
	// </block: delete_lines>
	
	
	// <block: dir>
	dir: {
		schema: "SchemaDir",
		impl: { type: "file", commands: ["dir"] },
		description: "List folder contents with sorting/filtering.",
		tags: ["file", "folder", "directory", "list", "ls", "browse"],
		examples: [
			{ "tool": "dir", "args": { "path": "." } },
			missingManual("dir")
		]
	},
	// </block: dir>






	// <block: get_file_info>
	get_file_info: {
		schema: "SchemaSingleFile",
		impl: { type: "file", commands: ["get_file_info"] },
		description: "Get file metadata: size, creation/modification/access dates, line count for text files.",
		tags: ["file", "metadata", "info", "stats", "properties"],
		examples: [
			{ "tool": "get_file_info", "args": { "path": "document.txt" } },
			missingManual("get_file_info")
		]
	},
	// </block: get_file_info>


	// <block: get_folder_size>
	get_folder_size: {
		schema: "SchemaGetFolderSize",
		impl: { type: "file", commands: ["get_folder_size"] },
		description: "Calculate total folder size and item count by scanning all files/subdirectories recursively.",
		tags: ["file", "folder", "directory", "size", "metadata", "info", "disk-usage"],
		examples: [
			{ "tool": "get_folder_size", "args": { "path": "project" } },
			missingManual("get_folder_size")
		]
	},
	// </block: get_folder_size>


	// <block: insert_at_line>
	insert_at_line: {
		schema: "SchemaInsertAtLine",
		impl: { type: "file", commands: ["insert_at_line"] },
		description: "Insert, replace, or modify content at specific line. Modes: before, after, or replace.",
		tags: ["file", "edit", "insert", "line", "write", "modify"],
		examples: [
			{ "tool": "insert_at_line", "args": { "path": "server.js", "line": 1, "content": "// Auto-generated" } },
			missingManual("insert_at_line")
		]
	},
	// </block: insert_at_line>
	
	
	// <block: read_file>
	read_file: {
		schema: "SchemaReadFile",
		impl: { type: "file", commands: ["read_file"] },
		description: "Read text file in configurable chunks. Supports partial reading with line ranges.",
		tags: ["file", "read", "text", "view", "content"],
		examples: [
			{ "tool": "read_file", "args": { "path": "README.md" } },
			missingManual("read_file")
		]
	},
	// </block: read_file>


	// <block: rename_file>
	rename_file: {
		schema: "SchemaRenameFile",
		impl: { type: "file", commands: ["rename_file"] },
		description: "Rename file within same directory. Does not move to different folder.",
		tags: ["file", "rename", "name", "copy"],
		examples: [
			{ "tool": "rename_file", "args": { "path": "old_name.txt", "new_name": "new_name.txt" } },
			missingManual("rename_file")
		]
	},
	// </block: rename_file>


	// <block: replace_lines>
	replace_lines: {
		schema: "SchemaReplaceLines",
		impl: { type: "file", commands: ["replace_lines"] },
		description: "Replace a range of lines with new content.",
		tags: ["file", "edit", "replace", "rewrite", "lines", "write"],
		examples: [
			{ "tool": "replace_lines", "args": { "path": "server.js", "start": 10, "end": 15, "new_content": "function newImplementation() {\n\treturn true;\n}" } },
			missingManual("replace_lines")
		]
	},
	// </block: replace_lines>
	
	
	// <block: replace_text>
	replace_text: {
		schema: "SchemaReplaceText",
		impl: { type: "file", commands: ["replace_text"] },
		description: "Find and replace exact text block. Text must appear exactly once. Creates backup by default.",
		tags: ["file", "edit", "replace", "rewrite", "code", "text", "write"],
		examples: [
			{ "tool": "replace_text", "args": { "path": "server.js", "old_text": "const port = 3000;", "new_text": "const port = 8080;" }},
			missingManual("replace_text")
		]
	},
	// </block: replace_text>
	
	
	// <block: rewrite_line>
	rewrite_line: {
		schema: "SchemaRewriteLine",
		impl: { type: "file", commands: ["rewrite_line"] },
		description: "Replace or create specific line by line number.",
		tags: ["file", "write", "edit", "line", "modify", "rewrite"],
		examples: [
			{ "tool": "rewrite_line", "args": { "path": "file.txt", "line_number": 3, "content": "new line content" } },
			missingManual("rewrite_line")
		]
	},
	// </block: rewrite_line>


	// <block: search_files>
	search_files: {
		schema: "SchemaSearchFiles",
		impl: { type: "file", commands: ["search_files"] },
		description: "Recursively search directory tree for files/folders matching name pattern. Results saved to JSON.",
		tags: ["file", "folder", "directory", "search", "find", "locate", "query"],
		examples: [
			{ "tool": "search_files", "args": { "path": ".", "pattern": "config" } },
			missingManual("search_files")
		]
	},
	// </block: search_files>




	// <block: write_file>
	write_file: {
		schema: "SchemaWriteFile",
		impl: { type: "file", commands: ["write_file"] },
		description: "Create new file or overwrite existing file with content. Supports very long text.",
		tags: ["file", "write", "create", "save", "overwrite"],
		examples: [
			{ "tool": "write_file", "args": { "path": "new_file.txt", "content": "File content here" } },
			missingManual("write_file")
		]
	},
	// </block: write_file>

};
// </block: Case factory>