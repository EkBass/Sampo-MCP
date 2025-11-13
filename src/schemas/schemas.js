// <file_info: schemas.js>
/* 
- Project: Sampo-MCP
- File: src/schemas.js
*/
// </file_info: schemas.js>


// <block: imports>
import { z } from "zod";
// </block: imports>


// <block: export_schemas>
export const schemas = {
    // File and folder operation schemas


	// <block: SchemaAddLogEntry>
    SchemaAddLogEntry: z.object({
        content: z.string().min(1).describe("In short and to the point. If you do a lot at once, create your own separate entry for them and don't write the bible here. The maximum length of the entry is 512 characters."),
    }).strict(),
	// </block: SchemaAddLogEntry>

	
    // <block: SchemaAppendFile>
    SchemaAppendFile: z.object({
        path: z.string().min(1).describe("Path to the file, relative to Workspace or absolute"),
        content: z.string().describe("File content to append (can be very long)"),
        prepend: z.boolean().optional().describe("(Optional) Prepend to beginning instead of appending (default: false)"),
    }).strict(),
    // </block: SchemaAppendFile>


    // <block: SchemaCopyFile>
    SchemaCopyFile: z.object({
        from: z.string().min(1).describe("Source file path, relative to Workspace or absolute"),
        to: z.string().min(1).describe("Destination file path, relative to Workspace or absolute"),
        leave_old: z.boolean().optional().describe("(Optional) Keep original file after copy (default: true). Set to false to move file."),
    }).strict(),
    // </block: SchemaCopyFile>


    // <block: SchemaCopyFolder>
    SchemaCopyFolder: z.object({
        from: z.string().min(1).describe("Source folder path, relative to Workspace or absolute"),
        to: z.string().min(1).describe("Destination folder path, relative to Workspace or absolute"),
        leave_old: z.boolean().optional().describe("(Optional) Keep original folder after copy (default: true). Set to false to move folder."),
    }).strict(),
    // </block: SchemaCopyFolder>


    // <block: SchemaDeleteFolder>
    SchemaDeleteFolder: z.object({
        path: z.string().min(1).describe("Folder path to delete, relative to Workspace or absolute"),
        force: z.boolean().optional().describe("(Optional) Force delete non-empty folders (default: false)"),
    }).strict(),
    // </block: SchemaDeleteFolder>


    // <block: SchemaDir>
    SchemaDir: z.object({
        path: z.string().min(1).optional().describe("(Optional) Folder path to list, relative to Workspace or absolute. If omitted, uses projectRoot in devMode or workspacePath otherwise."),
        sort: z.enum(["-l", "-o", "-d", "-f", "-b", "-s"]).optional().describe("(Optional) Sort: -l (latest), -o (oldest), -d (folders), -f (files), -b (biggest), -s (smallest)"),
        filter: z.string().optional().describe("(Optional) Extension like '.txt' or number for limit"),
        output: z.string().optional().describe("(Optional) Save to JSON: 'filename.json' saves to workspace/json-data/"),
    }).strict(),
    // </block: SchemaDir>


    // <block: SchemaSearchBlocks>
    SchemaSearchBlocks: z.object({
        path: z.string().optional().describe("(Optional) Path to search for blocks (file or directory). Default: Projects/Sampo-MCP-source/src"),
        blocks: z.array(z.string()).optional().describe("(Optional) Array of specific block names to find (e.g., ['get_cpu_info', 'append_file']). If omitted, finds all blocks."),
        output: z.string().optional().describe("(Optional) Save results to JSON file in workspace/json/ (e.g., 'blocks.json')"),
    }).strict(),
    // </block: SchemaSearchBlocks>


    // <block: SchemaGetBlockList>
    SchemaGetBlockList: z.object({
        path: z.string().optional().describe("(Optional) Path to search for blocks (file or directory). Default: Projects/Sampo-MCP-source/src"),
    }).strict(),
    // </block: SchemaGetBlockList>


    // <block: SchemaGetFolderSize>
    SchemaGetFolderSize: z.object({
        path: z.string().min(1).describe("Folder path, relative to Workspace or absolute"),
    }).strict(),
    // </block: SchemaGetFolderSize>


    // <block: SchemaListTools>
    SchemaListTools: z.object({
        catalog: z.string().min(1).optional().describe("(Optional) Catalog name: 'files', 'blocks', 'network', 'system', 'versions', 'edit', 'npm', 'search'. If omitted, returns list of available catalogs.")
    }).strict(),
    
    SchemaGetToolInfo: z.object({
        tool: z.string().min(1).describe("Name of the tool to get information about")
    }).strict(),
    // </block: SchemaListTools>


    // <block: SchemaPing>
    SchemaPing: z.object({
        url: z.string().min(1).describe("URL to ping (e.g., https://www.google.com)"),
        timeout: z.number().int().min(100).max(30000).optional().describe("(Optional) Timeout in milliseconds (default: 5000, min: 100, max: 30000)"),
    }).strict(),
    // </block: SchemaPing>


    // <block: SchemaReadFile>
    SchemaReadFile: z.object({
        path: z.string().min(1).describe("Path to the file, relative to Workspace or absolute"),
        start_line: z.number().int().optional().describe("(Optional) Starting line number (1-indexed, defaults to 1)"),
        num_lines: z.number().int().optional().describe("(Optional)  Number of lines to read (if omitted, reads to end of file)"),
    }).strict(),
    // </block: SchemaReadFile>


    // <block: SchemaRenameFile>
    SchemaRenameFile: z.object({
        path: z.string().min(1).describe("Current file path"),
        new_name: z.string().min(1).describe("New filename (not full path)")
    }).strict(),
    // </block: SchemaRenameFile>


    // <block: SchemaRewriteLine>
    SchemaRewriteLine: z.object({
        path: z.string().min(1).describe("Path to the file, relative to Workspace or absolute"),
        line_number: z.number().int().min(1).describe("Line number to rewrite (1-indexed). If line doesn't exist, new lines are created up to this number."),
        content: z.string().describe("New content for the line (will replace or create the line)"),
    }).strict(),
    // </block: SchemaRewriteLine>


    // <block: SchemaSearchFiles>
    SchemaSearchFiles: z.object({
        path: z.string().min(1).describe("Starting folder path to search from, relative to Workspace or absolute"),
        pattern: z.string().min(1).optional().describe("(Optional) File/folder name pattern (case-insensitive, partial match). If omitted with type filter, matches all items of that type."),
        type: z.enum(["all", "files", "folders"]).optional().default("all").describe("(Optional) Filter results: all (default), files only, or folders only"),
        limit: z.number().int().min(1).optional().describe("(Optional) Maximum results to return (default: 50)"),
        output: z.string().optional().describe("(Optional) Custom filename for JSON results. Auto-named with timestamp if omitted."),
    }).strict(),
    // </block: SchemaSearchFiles>


    // <block: SchemaSearchTools>
    SchemaSearchTools: z.object({
        query: z.string().min(1).describe("Search query with keywords to find tools"),
        limit: z.number().int().min(1).max(50).optional().default(5).describe("(Optional) Maximum results to return (default: 5, max: 50)"),
    }).strict(),
    // </block: SchemaSearchTools>


    // <block: SchemaSingle_works_as_fallback_for_non_arg_tools>
    SchemaSingle: z.object({}).strict(),
    // </block: SchemaSingle_works_as_fallback_for_non_arg_tools>


    // <block: SchemaSingleFile>
    SchemaSingleFile: z.object({
        path: z.string().min(1).describe("Path to the file, relative to Workspace or absolute")
    }).strict(),
    // </block: SchemaSingleFile>


    // <block: SchemaWriteFile>
    SchemaWriteFile: z.object({
        path: z.string().min(1).describe("Path to the file to create/overwrite, relative to Workspace or absolute"),
        content: z.string().describe("File content (can be very long)"),
    }).strict(),
    // </block: SchemaWriteFile>


    // <block: SchemaMultiPing>
    SchemaMultiPing: z.object({
        urls: z.array(z.string().min(1)).min(1).max(10).describe("Array of URLs to ping (max 10)"),
        timeout: z.number().int().min(100).max(30000).optional().describe("(Optional) Timeout per URL in milliseconds (default: 5000, min: 100, max: 30000)"),
    }).strict(),
    // </block: SchemaMultiPing>


    // <block: SchemaTraceRoute>
    SchemaTraceRoute: z.object({
        url: z.string().min(1).describe("URL to trace route to"),
        max_hops: z.number().int().min(1).max(30).optional().describe("(Optional) Maximum hops (default: 30, min: 1, max: 30)"),
    }).strict(),
    // </block: SchemaTraceRoute>


    // <block: SchemaCheckPort>
    SchemaCheckPort: z.object({
        url: z.string().min(1).describe("URL or hostname to check"),
        port: z.number().int().min(1).max(65535).describe("Port number to check (1-65535)"),
        timeout: z.number().int().min(100).max(30000).optional().describe("(Optional) Timeout in milliseconds (default: 5000, min: 100, max: 30000)"),
    }).strict(),
    // </block: SchemaCheckPort>


    // <block: SchemaScanPorts>
    SchemaScanPorts: z.object({
        url: z.string().min(1).describe("URL or hostname to scan"),
        start_port: z.number().int().min(1).max(65535).describe("Starting port number (1-65535)"),
        end_port: z.number().int().min(1).max(65535).describe("Ending port number (1-65535)"),
        timeout: z.number().int().min(100).max(10000).optional().describe("(Optional) Timeout per port in milliseconds (default: 1000, min: 100, max: 10000)"),
    }).strict(),
    // </block: SchemaScanPorts>


    // <block: SchemaDnsLookup>
    SchemaDnsLookup: z.object({
        url: z.string().min(1).describe("URL or hostname to lookup"),
    }).strict(),
    // </block: SchemaDnsLookup>


    // <block: SchemaBandwidthTest>
    SchemaBandwidthTest: z.object({
        url: z.string().min(1).describe("URL to test bandwidth against"),
        size: z.number().int().min(1024).max(10485760).optional().describe("(Optional) Data size in bytes (default: 1048576, min: 1024, max: 10485760)"),
    }).strict(),
    // </block: SchemaBandwidthTest>


    // <block: SchemaNetworkLatency>
    SchemaNetworkLatency: z.object({
        url: z.string().min(1).describe("URL to measure latency to"),
        count: z.number().int().min(1).max(10).optional().describe("(Optional) Number of pings (default: 5, min: 1, max: 10)"),
    }).strict(),
    // </block: SchemaNetworkLatency>


    // <block: SchemaNpmCommand>
    SchemaNpmCommand: z.object({
        command: z.string().min(1).describe("npm command to run (install, update, list, outdated, audit, etc.)"),
        path: z.string().optional().describe("(Optional) Path to project directory (default: current workspace)"),
        args: z.array(z.string()).optional().describe("(Optional) Additional arguments for the npm command"),
        dry_run: z.boolean().optional().describe("(Optional) Run in dry-run mode without making changes (default: false)")
    }).strict(),
    // </block: SchemaNpmCommand>


    // <block: SchemaNpmInstall>
    SchemaNpmInstall: z.object({
        path: z.string().optional().describe("(Optional) Path to project directory (default: Sampo-MCP-source)"),
        packages: z.array(z.string()).optional().describe("(Optional) Specific packages to install. If omitted, installs all from package.json"),
        save_dev: z.boolean().optional().describe("(Optional) Save as dev dependency (default: false)"),
        dry_run: z.boolean().optional().describe("(Optional) Run in dry-run mode without making changes (default: false)")
    }).strict(),
    // </block: SchemaNpmInstall>


    // <block: SchemaNpmUpdate>
    SchemaNpmUpdate: z.object({
        path: z.string().optional().describe("(Optional) Path to project directory (default: Sampo-MCP-source)"),
        packages: z.array(z.string()).optional().describe("(Optional) Specific packages to update. If omitted, updates all packages"),    
        dry_run: z.boolean().optional().describe("(Optional) Run in dry-run mode without making changes (default: false)")
    }).strict(),
    // </block: SchemaNpmUpdate>


    // <block: SchemaReplaceText>
    SchemaReplaceText: z.object({
        path: z.string().min(1).describe("Path to the file, relative to Workspace or absolute"),
        old_text: z.string().describe("Exact text to find and replace (must appear exactly once in file)"),
        new_text: z.string().describe("Replacement text (use empty string to delete)"),
        backup: z.boolean().optional().describe("(Optional) Create backup before modification (default: true)")
    }).strict(),
    // </block: SchemaReplaceText>


    // <block: SchemaInsertAtLine>
    SchemaInsertAtLine: z.object({
        path: z.string().min(1).describe("Path to the file, relative to Workspace or absolute"),
        line: z.number().int().min(1).describe("Line number (1-indexed) where to insert/replace"),
        content: z.string().describe("Content to insert or replace"),
        mode: z.enum(["before", "after", "replace"]).optional().describe("(Optional) Insert mode: 'before' line, 'after' line, or 'replace' line (default: 'after')"),
        backup: z.boolean().optional().describe("(Optional) Create backup before modification (default: false)")
    }).strict(),
    // </block: SchemaInsertAtLine>


    // <block: SchemaDeleteLines>
    SchemaDeleteLines: z.object({
        path: z.string().min(1).describe("Path to the file, relative to Workspace or absolute"),
        start: z.number().int().min(1).describe("Starting line number (1-indexed) to delete"),
        end: z.number().int().min(1).describe("Ending line number (1-indexed) to delete (inclusive)"),
        backup: z.boolean().optional().describe("(Optional) Create backup before modification (default: false)")
    }).strict(),
    // </block: SchemaDeleteLines>


    // <block: SchemaReplaceLines>
    SchemaReplaceLines: z.object({
        path: z.string().min(1).describe("Path to the file, relative to Workspace or absolute"),
        start: z.number().int().min(1).describe("Starting line number (1-indexed) to replace"),
        end: z.number().int().min(1).describe("Ending line number (1-indexed) to replace (inclusive)"),
        new_content: z.string().describe("New content to replace lines (can be multi-line, use empty string to delete)"),
        backup: z.boolean().optional().describe("(Optional) Create backup before modification (default: false)")
    }).strict(),
    // </block: SchemaReplaceLines>   


    // <block: SchemaReadBlock>
    SchemaReadBlock: z.object({
        path: z.string().min(1).describe("Path to the file containing the block"),
        block: z.string().min(1).describe("Name of the block to read"),
    }).strict(),
    // </block: SchemaReadBlock>


    // <block: SchemaUpdateBlock>
    SchemaUpdateBlock: z.object({
        path: z.string().min(1).describe("Path to the file containing the block"),
        block: z.string().min(1).describe("Name of the block to update"),
        content: z.string().describe("New content for the block (excluding block markers)"),
        backup: z.boolean().optional().describe("(Optional) Create backup before modification (default: true)"),
    }).strict(),
    // </block: SchemaUpdateBlock>


    // <block: SchemaDeleteBlock>
    SchemaDeleteBlock: z.object({
        path: z.string().min(1).describe("Path to the file containing the block"),
        block: z.string().min(1).describe("Name of the block to delete"),
        backup: z.boolean().optional().describe("(Optional) Create backup before modification (default: true)"),
    }).strict(),
    // </block: SchemaDeleteBlock>


    // <block: SchemaDuplicateBlock>
    SchemaDuplicateBlock: z.object({
        path: z.string().min(1).describe("Path to the file containing the block"),
        block: z.string().min(1).describe("Name of the source block to duplicate"),
        new_name: z.string().min(1).describe("Name for the duplicated block"),
        position: z.enum(["before", "after"]).optional().describe("(Optional) Insert 'before' or 'after' the original block (default: 'after')"),
    }).strict(),
    // </block: SchemaDuplicateBlock>


    // <block: SchemaAddBlock>
    SchemaAddBlock: z.object({
        path: z.string().min(1).describe("Path to the file where the block will be added"),
        block: z.string().min(1).describe("Name for the new block"),
        content: z.string().describe("Content for the new block (excluding block markers)"),
        position: z.union([
            z.enum(["start", "end"]),
            z.number().int().min(1)
        ]).optional().describe("(Optional) Position: 'start', 'end', or line number (default: 'end')"),
        reference_block: z.string().optional().describe("(Optional) Name of reference block. If provided, position means 'before' or 'after' this block"),
    }).strict(),
    // </block: SchemaAddBlock>


    // <block: SchemaMoveBlock>
    SchemaMoveBlock: z.object({
        from_file: z.string().min(1).describe("Source file path containing the block"),
        to_file: z.string().min(1).describe("Target file path where block will be moved"),
        block: z.string().min(1).describe("Name of the block to move"),
        position: z.enum(["start", "end"]).optional().describe("(Optional) Insert at 'start' or 'end' of target file (default: 'end')"),
        backup: z.boolean().optional().describe("(Optional) Create backups of both files before modification (default: true)"),
    }).strict(),
    // </block: SchemaMoveBlock>


    // <block: SchemaRenameBlock>
    SchemaRenameBlock: z.object({
        path: z.string().min(1).describe("Path to the file containing the block"),
        old_name: z.string().min(1).describe("Current name of the block to rename"),
        new_name: z.string().min(1).describe("New name for the block"),
        backup: z.boolean().optional().describe("(Optional) Create backup before modification (default: true)"),
    }).strict(),
    // </block: SchemaRenameBlock>
};
// </block: export_schemas>