// <file_info: tools_blocks.js>
/* 
- Project: Sampo-MCP
- File: src/tool_implementations/tool_blocks.js
- Block discovery and manipulation system for semantic code editing
- Enables editing by purpose (block names) rather than line numbers
- Provides tools for finding, extracting, replacing, deleting, duplicating, inserting, and moving code blocks
*/
// </file_info: tools_blocks.js>


// <block: imports>
import { validateWorkspacePath, _INITS } from "../inits.js";
import { createBackup, isReadOnly, createError, createResponse, requireParam } from "../utils.js";
// </block: imports>






// <block: extractCommonParams>
const extractCommonParams = (_args) => ({
	filePath: _args?.path,
	blockName: _args?.block,
	createBackupFlag: _args?.backup ?? true
});
// </block: extractCommonParams>


// <block: extractFileParams>
const extractFileParams = (_args) => ({
	fromFile: _args?.from_file,
	toFile: _args?.to_file,
    // Use the spread operator to include all properties from extractCommonParams
	...extractCommonParams(_args) 
});
// </block: extractFileParams>




// <block: ensureFileExists>
const ensureFileExists = async (filePath, fs, originalPath) => {
	try {
		await fs.promises.access(filePath);
	} catch {
		throw createError("FILE_NOT_FOUND", `File not found: ${originalPath}`);
	}
};
// </block: ensureFileExists>


// <block: validateAndCheckPath>
const validateAndCheckPath = (filePath, path) => {
	const resolvedPath = validateWorkspacePath(filePath);
	
	if (isReadOnly(resolvedPath, path)) {
		throw createError("READ_ONLY", "Cannot modify read-only file (starts with _)");
	}
	
	return resolvedPath;
};
// </block: validateAndCheckPath>


// <block: findAndValidateBlock>
const findAndValidateBlock = (parsedData, blockName, filePath) => {
	const block = findBlockByName(parsedData, blockName);
	
	if (!block) {
		throw createError("BLOCK_NOT_FOUND", `Block '${blockName}' not found in ${filePath}`);
	}
	
	return block;
};
// </block: findAndValidateBlock>


// <block: ensureBlockDoesNotExist>
const ensureBlockDoesNotExist = (parsedData, blockName, filePath) => {
	const existing = findBlockByName(parsedData, blockName);
	
	if (existing) {
		throw createError("BLOCK_EXISTS", `Block '${blockName}' already exists in ${filePath}`);
	}
};
// </block: ensureBlockDoesNotExist>


// <block: handleBackup>
const handleBackup = async (resolvedPath, createBackupFlag, fs, path, logInfo) => {
	if (!createBackupFlag) {
		return null;
	}
	
	return await createBackup(resolvedPath, fs, path, logInfo);
};
// </block: handleBackup>


// <block: getFileStats>
const getFileStats = async (resolvedPath, fs) => {
	const stats = await fs.promises.stat(resolvedPath);
	return {
		size_bytes: stats.size,
		modified: stats.mtime.toISOString()
	};
};
// </block: getFileStats>


// <block: isProtectedBlock>
const isProtectedBlock = (blockName) => {
	return blockName.startsWith("file_info_") || blockName === "imports";
};
// </block: isProtectedBlock>



// <block: ensureNotProtected>
const ensureNotProtected = (blockName, operation = "modify") => {
	if (isProtectedBlock(blockName)) {
		const messages = {
			delete: `Cannot delete protected block '${blockName}'. Protected blocks (file_info_*, imports) are mandatory and cannot be deleted.`,
			move: `Cannot move protected block '${blockName}'. Protected blocks (file_info_*, imports) must remain in their original file.`,
			rename_old: `Cannot rename 'file_info_*' blocks. These blocks must match the filename and are protected.`,
			rename_imports: `Cannot rename 'imports' block. This is a mandatory block and is protected.`,
			rename_new_info: `Cannot use 'file_info_*' as new block name. This pattern is reserved for file info blocks.`,
			rename_new_imports: `Cannot use 'imports' as new block name. This name is reserved for the imports block.`
		};
		
		throw createError("PROTECTED_BLOCK", messages[operation] || messages.delete);
	}
};
// </block: ensureNotProtected>


// <block: validatePosition>
const validatePosition = (position, validPositions) => {
	if (!validPositions.includes(position)) {
		throw createError(
			"INVALID_POSITION",
			`position must be one of: ${validPositions.join(", ")}`
		);
	}
};
// </block: validatePosition>


// <block: parse_file_blocks>
async function parseFileBlocks(filePath, fs) {
	const content = await fs.promises.readFile(filePath, "utf-8");
	const lines = content.split("\n");
	const blocks = [];
	const blockStack = [];
	const unclosedBlocks = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const lineNum = i + 1;

		// Match opening block: // <block: name>
		const openMatch = line.match(/\/\/\s*<block:\s*([^>]+)>/);
		if (openMatch) {
			const blockName = openMatch[1].trim();
			blockStack.push({
				name: blockName,
				start_line: lineNum,
				start_index: i,
				file: filePath
			});
			continue;
		}

		// Match closing block: // </block: name> or // </block>
		const closeMatch = line.match(/\/\/\s*<\/block(?::\s*([^>]+))?>/);
		if (closeMatch) {
			const blockName = closeMatch[1]?.trim();
			
			// Find matching opening block
			for (let j = blockStack.length - 1; j >= 0; j--) {
				// Match by name if specified, otherwise match last opened block
				if (!blockName || blockStack[j].name === blockName) {
					const block = blockStack[j];
					block.end_line = lineNum;
					block.end_index = i;
					block.line_count = lineNum - block.start_line + 1;
					
					// Extract content (excluding block markers)
					block.content = lines.slice(block.start_index + 1, block.end_index).join("\n");
					
					blocks.push(block);
					blockStack.splice(j, 1);
					break;
				}
			}
		}
	}

	// Collect unclosed blocks
	if (blockStack.length > 0) {
		unclosedBlocks.push(...blockStack);
	}

	return {
		lines,
		blocks,
		unclosedBlocks,
		content
	};
}
// </block: parse_file_blocks>


// <block: find_block_by_name>
function findBlockByName(parsedData, blockName) {
	return parsedData.blocks.find(b => b.name === blockName) || null;
}
// </block: find_block_by_name>


// <block: search_directory_recursive>
async function searchDirectory(dirPath, processor, fs, path, logError) {
	const allResults = [];
	
	try {
		const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
		
		for (const entry of entries) {
			const fullPath = path.join(dirPath, entry.name);
			
			if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
				// Recurse into subdirectories
				const subResults = await searchDirectory(fullPath, processor, fs, path, logError);
				allResults.push(...subResults);
			} else if (entry.isFile() && entry.name.endsWith('.js')) {
				// Process JavaScript files
				try {
					const results = await processor(fullPath);
					if (Array.isArray(results)) {
						allResults.push(...results);
					} else if (results) {
						allResults.push(results);
					}
				} catch (err) {
					logError(`Error processing ${fullPath}: ${err.message}`);
				}
			}
		}
	} catch (err) {
		logError(`Error reading directory ${dirPath}: ${err.message}`);
	}
	
	return allResults;
}
// </block: search_directory_recursive>


// <block: tool_factory_block_manipulation>
export const makeBlockTool = (commands) => async (_args, ctx) => {
	const { clientReturn, logInfo, logError } = ctx;
	const fs = await import("fs");
	const path = await import("path");
	const cmd = commands[0];

	switch (cmd) {

		// <block: case_search_blocks>
		case "search_blocks": {
			const searchPath = _args?.path || _INITS.server_root;
			const blockNames = _args?.blocks;
			const outputFile = _args?.output;

			try {
				const resolvedPath = validateWorkspacePath(searchPath);

				// Processor function for finding blocks
				const findBlocksInFile = async (filePath) => {
					const parsedData = await parseFileBlocks(filePath, fs);
					
					// Filter by requested block names if specified
					let blocks = parsedData.blocks;
					if (blockNames && blockNames.length > 0) {
						blocks = blocks.filter(b => blockNames.includes(b.name));
					}
					
					// Report unclosed blocks
					if (parsedData.unclosedBlocks.length > 0) {
						logInfo(`Warning: ${parsedData.unclosedBlocks.length} unclosed block(s) in ${filePath}`);
						for (const unclosed of parsedData.unclosedBlocks) {
							logInfo(`  Unclosed: ${unclosed.name} starts at line ${unclosed.start_line}`);
						}
					}
					
					return blocks;
				};

				logInfo(`Searching for blocks in: ${resolvedPath}`);
				
				// Determine if path is file or directory
				const stats = await fs.promises.stat(resolvedPath);
				let allBlocks = [];

				if (stats.isFile()) {
					allBlocks = await findBlocksInFile(resolvedPath);
				} else if (stats.isDirectory()) {
					allBlocks = await searchDirectory(resolvedPath, findBlocksInFile, fs, path, logError);
				} else {
					return clientReturn(createError("INVALID_PATH", "Path is neither file nor directory"));
				}

				// Sort blocks by file and then by start line
				allBlocks.sort((a, b) => {
					if (a.file !== b.file) return a.file.localeCompare(b.file);
					return a.start_line - b.start_line;
				});

				// Remove content from response (too verbose)
				const blocksForResponse = allBlocks.map(b => ({
					name: b.name,
					file: b.file,
					start_line: b.start_line,
					end_line: b.end_line,
					line_count: b.line_count
				}));

				// Generate output
				const result = {
					search_path: resolvedPath,
					block_names_filter: blockNames || null,
					total_blocks: allBlocks.length,
					timestamp: new Date().toISOString(),
					blocks: blocksForResponse
				};

				// Save to JSON file if requested
				if (outputFile) {
					const jsonDir = _INITS.jsonPath;
					await fs.promises.mkdir(jsonDir, { recursive: true });
					
					const jsonPath = path.join(jsonDir, outputFile.endsWith('.json') ? outputFile : `${outputFile}.json`);
					await fs.promises.writeFile(jsonPath, JSON.stringify(result, null, 2), "utf-8");
					
					logInfo(`Blocks saved to: ${jsonPath}`);
					
					return clientReturn(createResponse(
						`Found ${allBlocks.length} block(s), saved to ${outputFile}`,
						{ ...result, output_file: jsonPath }
					));
				}

				return clientReturn(createResponse(
					`Found ${allBlocks.length} block(s)`,
					result
				));

			} catch (err) {
				logError(`search_blocks failed: ${err.message}`);
				return clientReturn(err.type ? err : createError("SEARCH_FAILED", err.message));
			}
		}
		// </block: case_search_blocks>


		// <block: case_get_block_list>
		case "get_block_list": {
			const searchPath = _args?.path || _INITS.projectSrc;
			
			try {
				const resolvedPath = validateWorkspacePath(searchPath);
				
				// Extract only block names from files
				const getBlockNamesFromFile = async (filePath) => {
					const parsedData = await parseFileBlocks(filePath, fs);
					return parsedData.blocks.map(b => b.name);
				};
				
				logInfo(`Getting block list from: ${resolvedPath}`);
				
				const stats = await fs.promises.stat(resolvedPath);
				let blockNames = [];
				
				if (stats.isFile()) {
					blockNames = await getBlockNamesFromFile(resolvedPath);
				} else if (stats.isDirectory()) {
					const allNames = await searchDirectory(resolvedPath, getBlockNamesFromFile, fs, path, logError);
					blockNames = [...new Set(allNames)]; // Remove duplicates
				} else {
					return clientReturn(createError("INVALID_PATH", "Path is neither file nor directory"));
				}
				
				blockNames.sort();
				
				return clientReturn(createResponse(
					`Found ${blockNames.length} unique block name(s)`,
					{
						search_path: resolvedPath,
						total_blocks: blockNames.length,
						block_names: blockNames,
						timestamp: new Date().toISOString()
					}
				));

			} catch (err) {
				logError(`get_block_list failed: ${err.message}`);
				return clientReturn(err.type ? err : createError("LIST_FAILED", err.message));
			}
		}
		// </block: case_get_block_list>


		// <block: case_read_block>
		case "read_block": {
			const { filePath, blockName } = extractCommonParams(_args);
			const includeMarkers = _args?.include_markers ?? false;

			try {
				validateRequired(filePath, "path");
				validateRequired(blockName, "block");
				
				const resolvedPath = validateWorkspacePath(filePath);
				await ensureFileExists(resolvedPath, fs, filePath);

				const parsedData = await parseFileBlocks(resolvedPath, fs);
				const block = findAndValidateBlock(parsedData, blockName, filePath);

				let content;
				if (includeMarkers) {
					const lines = parsedData.lines;
					content = lines.slice(block.start_index, block.end_index + 1).join("\n");
				} else {
					content = block.content;
				}

				return clientReturn(createResponse(
					`Block '${blockName}' read successfully`,
					{
						path: resolvedPath,
						block_name: blockName,
						start_line: block.start_line,
						end_line: block.end_line,
						line_count: block.line_count,
						content: content,
						include_markers: includeMarkers
					}
				));

			} catch (err) {
				logError(`read_block failed: ${err.message}`);
				return clientReturn(err.type ? err : createError("READ_FAILED", err.message));
			}
		}
		// </block: case_read_block>


		// <block: case_update_block>
		case "update_block": {
			const { filePath, blockName, createBackupFlag } = extractCommonParams(_args);
			const newContent = _args?.content;

			try {
				validateRequired(filePath, "path");
				validateRequired(blockName, "block");
				validateRequired(newContent, "content");

				const resolvedPath = validateAndCheckPath(filePath, path);
				await ensureFileExists(resolvedPath, fs, filePath);

				const parsedData = await parseFileBlocks(resolvedPath, fs);
				const block = findAndValidateBlock(parsedData, blockName, filePath);

				const backupPath = await handleBackup(resolvedPath, createBackupFlag, fs, path, logInfo);

				// Replace block content (keep markers)
				const lines = parsedData.lines;
				const newLines = [
					...lines.slice(0, block.start_index + 1),
					...newContent.split("\n"),
					...lines.slice(block.end_index)
				];

				await fs.promises.writeFile(resolvedPath, newLines.join("\n"), "utf-8");
				const stats = await getFileStats(resolvedPath, fs);

				return clientReturn(createResponse(
					`Block '${blockName}' updated successfully`,
					{
						path: resolvedPath,
						block_name: blockName,
						old_line_count: block.line_count,
						new_line_count: newContent.split("\n").length + 2,
						backup: backupPath,
						...stats
					}
				));

			} catch (err) {
				logError(`update_block failed: ${err.message}`);
				return clientReturn(err.type ? err : createError("UPDATE_FAILED", err.message));
			}
		}
		// </block: case_update_block>


		// <block: case_delete_block>
		case "delete_block": {
			const { filePath, blockName, createBackupFlag } = extractCommonParams(_args);

			try {
				validateRequired(filePath, "path");
				validateRequired(blockName, "block");

				const resolvedPath = validateAndCheckPath(filePath, path);
				await ensureFileExists(resolvedPath, fs, filePath);

				const parsedData = await parseFileBlocks(resolvedPath, fs);
				const block = findAndValidateBlock(parsedData, blockName, filePath);

				ensureNotProtected(blockName, "delete");

				const backupPath = await handleBackup(resolvedPath, createBackupFlag, fs, path, logInfo);

				// Remove block entirely (including markers)
				const lines = parsedData.lines;
				const newLines = [
					...lines.slice(0, block.start_index),
					...lines.slice(block.end_index + 1)
				];

				await fs.promises.writeFile(resolvedPath, newLines.join("\n"), "utf-8");
				const stats = await getFileStats(resolvedPath, fs);

				return clientReturn(createResponse(
					`Block '${blockName}' deleted successfully`,
					{
						path: resolvedPath,
						block_name: blockName,
						deleted_lines: block.line_count,
						remaining_lines: newLines.length,
						backup: backupPath,
						...stats
					}
				));

			} catch (err) {
				logError(`delete_block failed: ${err.message}`);
				return clientReturn(err.type ? err : createError("DELETE_FAILED", err.message));
			}
		}
		// </block: case_delete_block>


		// <block: case_duplicate_block>
		case "duplicate_block": {
			const { filePath, blockName } = extractCommonParams(_args);
			const newBlockName = _args?.new_name;
			const position = _args?.position || "after";

			try {
				validateRequired(filePath, "path");
				validateRequired(blockName, "block");
				validateRequired(newBlockName, "new_name", "NEW_NAME");
				validatePosition(position, ["before", "after"]);

				const resolvedPath = validateAndCheckPath(filePath, path);
				await ensureFileExists(resolvedPath, fs, filePath);

				const parsedData = await parseFileBlocks(resolvedPath, fs);
				const block = findAndValidateBlock(parsedData, blockName, filePath);
				ensureBlockDoesNotExist(parsedData, newBlockName, filePath);

				// Create new block with duplicated content
				const newBlockLines = [
					`\t// <block: ${newBlockName}>`,
					...block.content.split("\n"),
					`\t// </block: ${newBlockName}>`
				];

				const lines = parsedData.lines;
				const insertIndex = position === "before" ? block.start_index : block.end_index + 1;

				const newLines = [
					...lines.slice(0, insertIndex),
					"",
					...newBlockLines,
					...lines.slice(insertIndex)
				];

				await fs.promises.writeFile(resolvedPath, newLines.join("\n"), "utf-8");
				const stats = await getFileStats(resolvedPath, fs);

				return clientReturn(createResponse(
					`Block '${blockName}' duplicated as '${newBlockName}'`,
					{
						path: resolvedPath,
						original_block: blockName,
						new_block: newBlockName,
						position: position,
						duplicated_lines: block.line_count,
						total_lines: newLines.length,
						...stats
					}
				));

			} catch (err) {
				logError(`duplicate_block failed: ${err.message}`);
				return clientReturn(err.type ? err : createError("DUPLICATE_FAILED", err.message));
			}
		}
		// </block: case_duplicate_block>


		// <block: case_add_block>
		case "add_block": {
			const { filePath, blockName } = extractCommonParams(_args);
			const content = _args?.content;
			const position = _args?.position || "end";
			const referenceBlock = _args?.reference_block;

			try {
				validateRequired(filePath, "path");
				validateRequired(blockName, "block");
				validateRequired(content, "content");

				const resolvedPath = validateAndCheckPath(filePath, path);
				await ensureFileExists(resolvedPath, fs, filePath);

				const parsedData = await parseFileBlocks(resolvedPath, fs);
				ensureBlockDoesNotExist(parsedData, blockName, filePath);

				// Create the new block
				const newBlockLines = [
					`\t// <block: ${blockName}>`,
					...content.split("\n"),
					`\t// </block: ${blockName}>`
				];

				// Determine insertion point
				const lines = parsedData.lines;
				let insertIndex;

				if (referenceBlock) {
					const refBlock = findAndValidateBlock(parsedData, referenceBlock, filePath);
					insertIndex = position === "before" ? refBlock.start_index : refBlock.end_index + 1;
				} else if (typeof position === "number") {
					insertIndex = Math.max(0, Math.min(position - 1, lines.length));
				} else if (position === "start") {
					insertIndex = 0;
				} else {
					insertIndex = lines.length;
				}

				const newLines = [
					...lines.slice(0, insertIndex),
					"",
					...newBlockLines,
					...lines.slice(insertIndex)
				];

				await fs.promises.writeFile(resolvedPath, newLines.join("\n"), "utf-8");
				const stats = await getFileStats(resolvedPath, fs);

				return clientReturn(createResponse(
					`Block '${blockName}' added successfully`,
					{
						path: resolvedPath,
						block_name: blockName,
						position: referenceBlock ? `${position} ${referenceBlock}` : position,
						inserted_lines: newBlockLines.length,
						total_lines: newLines.length,
						...stats
					}
				));

			} catch (err) {
				logError(`add_block failed: ${err.message}`);
				return clientReturn(err.type ? err : createError("ADD_FAILED", err.message));
			}
		}
		// </block: case_add_block>


		// <block: case_move_block>
case "move_block": {
		const { fromFile, toFile, blockName, createBackupFlag } = extractFileParams(_args);
		const position = _args?.position || "end";

		try {
			validateRequired(fromFile, "from_file", "FROM_FILE");
			validateRequired(toFile, "to_file", "TO_FILE");
			validateRequired(blockName, "block");
			validatePosition(position, ["start", "end"]);

			const resolvedFromPath = validateAndCheckPath(fromFile, path);
			const resolvedToPath = validateAndCheckPath(toFile, path);

			await ensureFileExists(resolvedFromPath, fs, fromFile);
			await ensureFileExists(resolvedToPath, fs, toFile);

			// Parse source file
			const sourceParsed = await parseFileBlocks(resolvedFromPath, fs);
			const block = findAndValidateBlock(sourceParsed, blockName, fromFile);
			
			ensureNotProtected(blockName, "move");

			// Parse target file
			const targetParsed = await parseFileBlocks(resolvedToPath, fs);
			ensureBlockDoesNotExist(targetParsed, blockName, toFile);

			// Create backups if requested
			const sourceBackup = await handleBackup(resolvedFromPath, createBackupFlag, fs, path, logInfo);
			const targetBackup = await handleBackup(resolvedToPath, createBackupFlag, fs, path, logInfo);

			// Extract block with markers
			const sourceLines = sourceParsed.lines;
			const blockLines = sourceLines.slice(block.start_index, block.end_index + 1);

			// Remove from source
			const newSourceLines = [
				...sourceLines.slice(0, block.start_index),
				...sourceLines.slice(block.end_index + 1)
			];

			// Add to target
			const targetLines = targetParsed.lines;
			let insertIndex;
			
			if (position === "start") {
				// Respect block-system rules: place after mandatory blocks (file_info and imports)
				const importsBlock = targetParsed.blocks.find(b => b.name === "imports");
				if (importsBlock) {
					// Place after the imports block
					insertIndex = importsBlock.end_index + 1;
				} else {
					// If no imports block, look for file_info block
					const fileInfoBlock = targetParsed.blocks.find(b => b.name.startsWith("file_info_"));
					if (fileInfoBlock) {
						// Place after the file_info block
						insertIndex = fileInfoBlock.end_index + 1;
					} else {
						// Fallback to start if no mandatory blocks found (shouldn't happen in proper block-system files)
						insertIndex = 0;
					}
				}
			} else {
				// position === "end"
				insertIndex = targetLines.length;
			}
			
			const newTargetLines = [
				...targetLines.slice(0, insertIndex),
				"",
				...blockLines,
				...targetLines.slice(insertIndex)
			];

			// Write both files
			await fs.promises.writeFile(resolvedFromPath, newSourceLines.join("\n"), "utf-8");
			await fs.promises.writeFile(resolvedToPath, newTargetLines.join("\n"), "utf-8");

			const sourceStats = await getFileStats(resolvedFromPath, fs);
			const targetStats = await getFileStats(resolvedToPath, fs);

			return clientReturn(createResponse(
				`Block '${blockName}' moved from ${fromFile} to ${toFile}`,
				{
					block_name: blockName,
					from_file: resolvedFromPath,
					to_file: resolvedToPath,
					position: position,
					moved_lines: blockLines.length,
					source_backup: sourceBackup,
					target_backup: targetBackup,
					source_remaining_lines: newSourceLines.length,
					target_total_lines: newTargetLines.length,
					source_size_bytes: sourceStats.size_bytes,
					target_size_bytes: targetStats.size_bytes,
					modified: new Date().toISOString()
				}
			));

		} catch (err) {
			logError(`move_block failed: ${err.message}`);
			return clientReturn(err.type ? err : createError("MOVE_FAILED", err.message));
		}
	}
		// </block: case_move_block>


		// <block: case_rename_block>
		case "rename_block": {
			const { filePath, createBackupFlag } = extractCommonParams(_args);
			const oldBlockName = _args?.old_name;
			const newBlockName = _args?.new_name;

			try {
				validateRequired(filePath, "path");
				validateRequired(oldBlockName, "old_name", "OLD_NAME");
				validateRequired(newBlockName, "new_name", "NEW_NAME");

				// Protection checks for renaming
				if (oldBlockName.startsWith("file_info_")) {
					throw createError("PROTECTED_BLOCK", 
						`Cannot rename 'file_info_*' blocks. These blocks must match the filename and are protected.`);
				}
				
				if (oldBlockName === "imports") {
					throw createError("PROTECTED_BLOCK", 
						`Cannot rename 'imports' block. This is a mandatory block and is protected.`);
				}
				
				if (newBlockName.startsWith("file_info_")) {
					throw createError("INVALID_NEW_NAME", 
						`Cannot use 'file_info_*' as new block name. This pattern is reserved for file info blocks.`);
				}
				
				if (newBlockName === "imports") {
					throw createError("INVALID_NEW_NAME", 
						`Cannot use 'imports' as new block name. This name is reserved for the imports block.`);
				}

				const resolvedPath = validateAndCheckPath(filePath, path);
				await ensureFileExists(resolvedPath, fs, filePath);

				const parsedData = await parseFileBlocks(resolvedPath, fs);
				const oldBlock = findAndValidateBlock(parsedData, oldBlockName, filePath);
				ensureBlockDoesNotExist(parsedData, newBlockName, filePath);

				const backupPath = await handleBackup(resolvedPath, createBackupFlag, fs, path, logInfo);

				// Rename block markers
				const lines = parsedData.lines;
				const newLines = [...lines];
				
				newLines[oldBlock.start_index] = `// <block: ${newBlockName}>`;
				newLines[oldBlock.end_index] = `// </block: ${newBlockName}>`;

				await fs.promises.writeFile(resolvedPath, newLines.join("\n"), "utf-8");
				const stats = await getFileStats(resolvedPath, fs);

				return clientReturn(createResponse(
					`Block renamed from '${oldBlockName}' to '${newBlockName}' successfully`,
					{
						path: resolvedPath,
						old_name: oldBlockName,
						new_name: newBlockName,
						line_count: oldBlock.line_count,
						start_line: oldBlock.start_line,
						end_line: oldBlock.end_line,
						backup: backupPath,
						...stats
					}
				));

			} catch (err) {
				logError(`rename_block failed: ${err.message}`);
				return clientReturn(err.type ? err : createError("RENAME_FAILED", err.message));
			}
		}
		// </block: case_rename_block>


		default:
			return clientReturn(createError("UNKNOWN_BLOCK_TOOL", `Unknown block tool: ${cmd}`));
	}
};
// </block: tool_factory_block_manipulation>