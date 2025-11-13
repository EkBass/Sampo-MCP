// <file_info: tools_files.js>
/*
- Project: Sampo-MCP
- File: src/tool_implementations/tool_files.js
- File and folder manipulation tools with advanced editing capabilities
- Provides comprehensive file operations including read, write, copy, move, delete
- Includes advanced line-based editing: replace_text, insert_at_line, delete_lines, replace_lines
- Merged from tools_edit.js on 2025-11-03
- Updated: 2025-11-07 - Refactored to use createResponse from utils.js
*/
// </file_info: tools_files.js>


// <block: imports>
import { validateWorkspacePath, _INITS } from "../inits.js";

import { 
    isReadOnly, 
    createBackup, 
    readLines, 
    writeLines,
    createError,
    createResponse,
    requireParam
} from "../utils.js";
// </block: imports>






// <block: helper_extractXXXpath>
const extractFilePath = (_args) => _args?.path || _args?.file;
const extractFolderPath = (_args) => _args?.path || _args?.folder || _args?.source;
// </block: helper_extractXXXpath>





// <block: helper_validateWritePath>
const validateWritePath = (filePath) => {
	const validatedPath = validateWorkspacePath(filePath);
	
	if (isReadOnly(validatedPath)) {
		throw createError("READ_ONLY", "Cannot modify read-only file (starts with _)");
	}
	
	return validatedPath;
};
// </block: helper_validateWritePath>



// <block: helper_ensureIsFileOrFolder>
const ensureIsFile = async (filePath, fs) => {
	const stats = await fs.promises.stat(filePath);
	if (!stats.isFile()) {
		throw createError("NOT_A_FILE", "Path is not a file");
	}
	return stats;
};
const ensureIsDirectory = async (folderPath, fs) => {
	const stats = await fs.promises.stat(folderPath);
	if (!stats.isDirectory()) {
		throw createError("NOT_A_DIRECTORY", "Path is not a folder");
	}
	return stats;
};
// </block: helper_ensureIsFileOrFolder>


// <block: helper_ensureParentDir>
const ensureParentDir = async (filePath, fs, path) => {
	await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
};
// </block: helper_ensureParentDir>


// <block: helper_calculateSizes>
const calculateSizes = (bytes) => ({
	size_bytes: bytes,
	size_kb: (bytes / 1024).toFixed(2),
	size_mb: (bytes / (1024 * 1024)).toFixed(2),
	size_gb: (bytes / (1024 * 1024 * 1024)).toFixed(2)
});
// </block: helper_calculateSizes>


// <block: helper_getFileMetadata>
const getFileMetadata = async (filePath, fs) => {
	const stats = await fs.promises.stat(filePath);
	return {
		...calculateSizes(stats.size),
		created: stats.birthtime.toISOString(),
		modified: stats.mtime.toISOString()
	};
};
// </block: helper_getFileMetadata>


// <block: helper_getFileMetadataWithLines>
const getFileMetadataWithLines = async (filePath, fs, content = null) => {
	const metadata = await getFileMetadata(filePath, fs);
	
	if (content !== null) {
		metadata.lines_total = content.split("\n").length;
	}
	
	return metadata;
};
// </block: helper_getFileMetadataWithLines>


// <block: helper_moveToTrash>
const moveToTrash = async (itemPath, fs, path) => {
	await fs.promises.mkdir(_INITS.trashPath, { recursive: true });
	const itemName = path.basename(itemPath);
	const trashName = `${Date.now()}_${itemName}`;
	const trashPath = path.join(_INITS.trashPath, trashName);
	
	await fs.promises.rename(itemPath, trashPath);
	
	return {
		original_path: itemPath,
		trash_path: trashPath,
		item_name: itemName
	};
};
// </block: helper_moveToTrash>


// <block: helper_normalizeLineEndings>
const normalizeLineEndings = (content) => {
	return content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
};
// </block: helper_normalizeLineEndings>


// <block: helper_readNormalizedFile>
const readNormalizedFile = async (filePath, fs) => {
	const content = await fs.promises.readFile(filePath, "utf-8");
	return normalizeLineEndings(content);
};
// </block: helper_readNormalizedFile>


// <block: helper_saveJsonData>
const saveJsonData = async (data, filename, fs, path) => {
	const jsonDir = _INITS.jsonPath;
	await fs.promises.mkdir(jsonDir, { recursive: true });
	
	const jsonFilename = filename.endsWith('.json') ? filename : `${filename}.json`;
	const jsonPath = path.join(jsonDir, jsonFilename);
	
	await fs.promises.writeFile(jsonPath, JSON.stringify(data, null, 2), "utf-8");
	
	const stats = await fs.promises.stat(jsonPath);
	return {
		file: jsonPath,
		...calculateSizes(stats.size)
	};
};
// </block: helper_saveJsonData>


// <block: helper_recursiveCopy>
async function recursiveCopy(src, dest, fs, path) {
	await fs.promises.mkdir(dest, { recursive: true });
	const entries = await fs.promises.readdir(src, { withFileTypes: true });
	for (const entry of entries) {
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);
		if (entry.isDirectory()) {
			await recursiveCopy(srcPath, destPath, fs, path);
		} else if (entry.isFile()) {
			const content = await fs.promises.readFile(srcPath);
			await fs.promises.writeFile(destPath, content);
		}
	}
}
// </block: helper_recursiveCopy>


// <block: helper_deleteRecursive>
async function deleteRecursive(folderPath, fs, path) {
	const entries = await fs.promises.readdir(folderPath, { withFileTypes: true });
	for (const entry of entries) {
		const fullPath = path.join(folderPath, entry.name);
		if (entry.isDirectory()) {
			await deleteRecursive(fullPath, fs, path);
		} else {
			await fs.promises.unlink(fullPath);
		}
	}
	await fs.promises.rmdir(folderPath);
}
// </block: helper_deleteRecursive>


// <block: helper_calculateFolderSize>
async function calculateFolderSize(folderPath, fs, path) {
	let totalSize = 0;
	try {
		const entries = await fs.promises.readdir(folderPath, { withFileTypes: true });
		for (const entry of entries) {
			const fullPath = path.join(folderPath, entry.name);
			if (entry.isDirectory()) {
				totalSize += await calculateFolderSize(fullPath, fs, path);
			} else if (entry.isFile()) {
				const stats = await fs.promises.stat(fullPath);
				totalSize += stats.size;
			}
		}
	} catch (err) {}
	return totalSize;
}


// <block: helper_validatePosition>
const validatePosition = (_args) => ({
	filePath: _args?.path,
	createBackupFlag: _args?.backup ?? false
});
// </block: helper_validatePosition>


// <block: helper_validateEditPath>
const validateEditPath = (filePath) => {
	if (!filePath) {
		throw createError("MISSING_PATH", "path parameter is required");
	}
	
	const validatedPath = validateWorkspacePath(filePath);
	
	if (isReadOnly(validatedPath)) {
		throw createError("READ_ONLY", "Cannot modify read-only file (starts with _)");
	}
	
	return validatedPath;
};
// </block: helper_validateEditPath>


// <block: helper_handleBackup>
const handleBackup = async (filePath, validatedPath, createBackupFlag, logInfo) => {
	if (!createBackupFlag) {
		return null;
	}
	
	const backupPath = await createBackup(filePath, validatedPath);
	if (backupPath && logInfo) {
		logInfo(`Backup created: ${backupPath}`);
	}
	return backupPath;
};
// </block: helper_handleBackup>


// <block: helper_getEditFileMetadata>
const getEditFileMetadata = async (validatedPath, lines) => {
	const fs = await import("fs");
	const stats = await fs.promises.stat(validatedPath);
	return {
		path: validatedPath,
		lines_total: lines ? lines.length : undefined,
		size_bytes: stats.size,
		modified: stats.mtime.toISOString()
	};
};
// </block: helper_getEditFileMetadata>


// <block: helper_validateLineNumbers>
const validateLineNumbers = (startLine, endLine) => {
	if (!startLine || startLine < 1) {
		throw createError("INVALID_START", "start parameter must be >= 1");
	}
	
	if (endLine !== undefined && endLine < startLine) {
		throw createError("INVALID_END", "end parameter must be >= start");
	}
};
// </block: helper_validateLineNumbers>


// <block: helper_checkLineRange>
const checkLineRange = (lines, startLine, endLine) => {
	const endIdx = endLine - 1;
	
	if (endIdx >= lines.length) {
		throw createError(
			"LINE_OUT_OF_RANGE", 
			`End line ${endLine} exceeds file length (${lines.length} lines)`
		);
	}
};
// </block: helper_checkLineRange>


// </block: helper_calculateFolderSize>


// <block: tool_factory_file_operations>
export const makeFileTool = (_commands) => async (_args = {}, ctx = {}) => {
	const { clientReturn } = ctx;
	const fs = await import("fs");
	const path = await import("path");

	const cmd = _args.command || _args.cmd || ctx.command || ctx.cmd || _args?.name || ctx?.name;

	if (!cmd) {
		return clientReturn({
			ok: false,
			error: "No command in args/ctx",
		});
	}

	switch (cmd) {

		// <block: append_file>
		case "append_file": {
			const filePath = extractFilePath(_args);
			const content = _args?.content || "";
			const prepend = _args?.prepend || false;

			try {
				requireParam(filePath, "path");
				const validatedPath = validateWritePath(filePath);
				await ensureParentDir(validatedPath, fs, path);

				if (prepend) {
					let existingContent = "";
					try {
						existingContent = await fs.promises.readFile(validatedPath, "utf-8");
					} catch (err) {}
					await fs.promises.writeFile(validatedPath, content + existingContent, "utf-8");
				} else {
					await fs.promises.appendFile(validatedPath, content, "utf-8");
				}

				const fileContent = await fs.promises.readFile(validatedPath, "utf-8");
				const metadata = await getFileMetadataWithLines(validatedPath, fs, fileContent);

				return clientReturn(createResponse(
					`Content ${prepend ? "prepended to" : "appended to"}: ${validatedPath}`,
					{
						path: validatedPath,
						mode: prepend ? "prepend" : "append",
						...metadata
					}
				));
			} catch (err) {
				return clientReturn(err.type ? err : createError("EFAIL", String(err?.message || err)));
			}
		}
		// </block: append_file>


		// <block: copy_file>
		case "copy_file": {
			const fromPath = _args?.from;
			const toPath = _args?.to;
			const leaveOld = _args?.leave_old !== false;

			try {
				requireParam(fromPath, "from", "MISSING_PARAMS");
				requireParam(toPath, "to", "MISSING_PARAMS");

				const validatedFrom = validateWorkspacePath(fromPath);
				const validatedTo = validateWorkspacePath(toPath);

				await ensureIsFile(validatedFrom, fs);

				if (!leaveOld) {
					if (isReadOnly(validatedFrom)) {
						throw createError("READ_ONLY", "Cannot move read-only file (starts with _).");
					}
				}

				await ensureParentDir(validatedTo, fs, path);
				const content = await fs.promises.readFile(validatedFrom);
				await fs.promises.writeFile(validatedTo, content);

				if (!leaveOld) {
					await fs.promises.unlink(validatedFrom);
				}

				const metadata = await getFileMetadata(validatedTo, fs);

				return clientReturn(createResponse(
					`File ${leaveOld ? "copied" : "moved"} successfully`,
					{
						operation: leaveOld ? "copy" : "move",
						from: validatedFrom,
						to: validatedTo,
						source_preserved: leaveOld,
						...metadata
					}
				));
			} catch (err) {
				return clientReturn(err.type ? err : createError("EFAIL", String(err?.message || err)));
			}
		}
		// </block: copy_file>


		// <block: copy_folder>
		case "copy_folder": {
			const fromPath = _args?.from;
			const toPath = _args?.to;
			const leaveOld = _args?.leave_old !== false;

			try {
				requireParam(fromPath, "from", "MISSING_PARAMS");
				requireParam(toPath, "to", "MISSING_PARAMS");

				const validatedFrom = validateWorkspacePath(fromPath);
				const validatedTo = validateWorkspacePath(toPath);

				await ensureIsDirectory(validatedFrom, fs);

				try {
					await fs.promises.stat(validatedTo);
					throw createError("DESTINATION_EXISTS", "Destination folder already exists");
				} catch (e) {
					if (e.code !== "ENOENT") throw e;
				}

				await recursiveCopy(validatedFrom, validatedTo, fs, path);
				const folderSize = await calculateFolderSize(validatedTo, fs, path);

				if (!leaveOld) {
					if (isReadOnly(validatedFrom)) {
						throw createError("READ_ONLY", "Cannot delete read-only folder (starts with _)");
					}
					await deleteRecursive(validatedFrom, fs, path);
				}

				const destStats = await fs.promises.stat(validatedTo);

				return clientReturn(createResponse(
					`Folder ${leaveOld ? "copied" : "moved"} successfully`,
					{
						operation: leaveOld ? "copy" : "move",
						from: validatedFrom,
						to: validatedTo,
						source_preserved: leaveOld,
						...calculateSizes(folderSize),
						created: destStats.birthtime.toISOString(),
						modified: destStats.mtime.toISOString()
					}
				));
			} catch (err) {
				return clientReturn(err.type ? err : createError("EFAIL", String(err?.message || err)));
			}
		}
		// </block: copy_folder>


		// <block: create_folder>
		case "create_folder": {
			const folderPath = extractFolderPath(_args);

			try {
				requireParam(folderPath, "path");
				const validatedPath = validateWorkspacePath(folderPath);
				
				try {
					const stats = await fs.promises.stat(validatedPath);
					if (stats.isDirectory()) {
						throw createError("FOLDER_ALREADY_EXISTS", "Folder already exists");
					}
				} catch (e) {}
				
				await fs.promises.mkdir(validatedPath, { recursive: true });
				
				return clientReturn(createResponse(`Successfully created folder ${validatedPath}`));
			} catch (err) {
				return clientReturn(err.type ? err : createError("EFAIL", err.message));
			}
		}
		// </block: create_folder>


		// <block: delete_file>
		case "delete_file": {
			const filePath = extractFilePath(_args);

			try {
				requireParam(filePath, "path");
				const validatedPath = validateWritePath(filePath);
				await ensureIsFile(validatedPath, fs);

				const trashData = await moveToTrash(validatedPath, fs, path);

				return clientReturn(createResponse("File moved to Trash", trashData));
			} catch (err) {
				return clientReturn(err.type ? err : createError("EFAIL", String(err?.message || err)));
			}
		}
		// </block: delete_file>


		// <block: delete_folder>
		case "delete_folder": {
			const folderPath = extractFolderPath(_args);
			const force = _args?.force || false;

			try {
				requireParam(folderPath, "path");
				const validatedPath = validateWritePath(folderPath);
				await ensureIsDirectory(validatedPath, fs);

				const entries = await fs.promises.readdir(validatedPath);
				
				if (entries.length > 0 && !force) {
					throw createError(
						"FOLDER_NOT_EMPTY",
						`Folder is not empty (${entries.length} item(s)). Use force: true to delete non-empty folders.`
					);
				}

				const trashData = await moveToTrash(validatedPath, fs, path);

				return clientReturn(createResponse(
					"Folder moved to Trash",
					{
						...trashData,
						was_empty: entries.length === 0,
						items_moved: entries.length
					}
				));
			} catch (err) {
				return clientReturn(err.type ? err : createError("EFAIL", String(err?.message || err)));
			}
		}
		// </block: delete_folder>


		// <block: dir>
		case "dir": {
			let folderPath = extractFolderPath(_args);
			const sort = _args?.sort;
			const filter = _args?.filter;
			const output = _args?.output;

			try {
				// If no path provided, use default based on devMode
				if (!folderPath) {
					folderPath = _INITS.devMode ? _INITS.projectRoot : _INITS.workspacePath;
				}
				
				const validatedPath = validateWorkspacePath(folderPath);
				await ensureIsDirectory(validatedPath, fs);

				const entries = await fs.promises.readdir(validatedPath, { withFileTypes: true });
				let items = [];

				for (const entry of entries) {
					const fullPath = path.join(validatedPath, entry.name);
					try {
						const entryStats = await fs.promises.stat(fullPath);
						items.push({
							name: entry.name,
							type: entry.isDirectory() ? "folder" : "file",
							size: entryStats.size,
							modified: entryStats.mtime.toISOString(),
						});
					} catch {}
				}

				// Apply filters
				if (filter && filter.startsWith(".")) {
					items = items.filter(item => item.name.toLowerCase().endsWith(filter.toLowerCase()));
				}

				// Apply sorting
				if (sort === "-a") items.sort((a, b) => a.name.localeCompare(b.name));
				else if (sort === "-z") items.sort((a, b) => b.name.localeCompare(a.name));
				else if (sort === "-d") items = items.filter(item => item.type === "folder");
				else if (sort === "-f") items = items.filter(item => item.type === "file");
				else if (sort === "-b") items.sort((a, b) => b.size - a.size);
				else if (sort === "-s") items.sort((a, b) => a.size - b.size);

				// Apply numeric limit
				if (filter && !filter.startsWith(".") && !isNaN(parseInt(filter))) {
					items = items.slice(0, parseInt(filter));
				}

				const result = {
					folder: validatedPath,
					count: items.length,
					items: items
				};

				// Save to JSON if requested
				if (output) {
					const jsonData = await saveJsonData(result, output, fs, path);
					result.saved_to = jsonData.file;
				}

				return clientReturn(createResponse(
					`Listed ${items.length} item(s) in ${validatedPath}`,
					result
				));
			} catch (err) {
				return clientReturn(err.type ? err : createError("EFAIL", String(err?.message || err)));
			}
		}
		// </block: dir>


		// <block: get_file_info>
		case "get_file_info": {
			const filePath = extractFilePath(_args);

			try {
				requireParam(filePath, "path");
				const resolvedPath = validateWorkspacePath(filePath);

				const stats = await fs.promises.stat(resolvedPath);
				let lineCount = null;
				
				if (stats.isFile()) {
					try {
						const content = await fs.promises.readFile(resolvedPath, "utf-8");
						lineCount = content.split("\n").length;
					} catch {}
				}

				return clientReturn(createResponse(
					"File info retrieved",
					{
						file: resolvedPath,
						is_file: stats.isFile(),
						is_directory: stats.isDirectory(),
						...calculateSizes(stats.size),
						created: stats.birthtime.toISOString(),
						modified: stats.mtime.toISOString(),
						accessed: stats.atime.toISOString(),
						lines: lineCount
					}
				));
			} catch (err) {
				return clientReturn(err.type ? err : createError("EFAIL", String(err?.message || err)));
			}
		}
		// </block: get_file_info>


		// <block: get_folder_size>
		case "get_folder_size": {
			const folderPath = extractFolderPath(_args);

			try {
				requireParam(folderPath, "path");
				const validatedPath = validateWorkspacePath(folderPath);
				await ensureIsDirectory(validatedPath, fs);

				const totalBytes = await calculateFolderSize(validatedPath, fs, path);
				let fileCount = 0, folderCount = 0;

				async function countItems(fp) {
					try {
						const entries = await fs.promises.readdir(fp, { withFileTypes: true });
						for (const entry of entries) {
							if (entry.isDirectory()) {
								folderCount++;
								await countItems(path.join(fp, entry.name));
							} else if (entry.isFile()) {
								fileCount++;
							}
						}
					} catch {}
				}

				await countItems(validatedPath);

				return clientReturn(createResponse(
					"Folder size calculated",
					{
						folder: validatedPath,
						...calculateSizes(totalBytes),
						file_count: fileCount,
						folder_count: folderCount,
						total_items: fileCount + folderCount
					}
				));
			} catch (err) {
				return clientReturn(err.type ? err : createError("EFAIL", String(err?.message || err)));
			}
		}
		// </block: get_folder_size>


		// <block: read_file>
		case "read_file": {
			const filePath = extractFilePath(_args);
			const startLine = _args?.start_line || _args?.start || 1;
			const numLines = _args?.num_lines || _args?.lines || undefined;

			try {
				requireParam(filePath, "path");
				const resolvedPath = validateWorkspacePath(filePath);

				const content = await readNormalizedFile(resolvedPath, fs);
				const lines = content.split("\n");

				const start = Math.max(0, startLine - 1);
				const end = numLines ? Math.min(lines.length, start + numLines) : lines.length;
				const chunk = lines.slice(start, end).join("\n");

				return clientReturn(createResponse(
					"File read successfully",
					{
						content: chunk,
						line_start: startLine,
						line_end: end,
						total_lines: lines.length,
						has_more: end < lines.length
					}
				));
			} catch (err) {
				return clientReturn(err.type ? err : createError("EFAIL", String(err?.message || err)));
			}
		}
		// </block: read_file>


		// <block: rewrite_line>
		case "rewrite_line": {
			const filePath = extractFilePath(_args);
			const lineNumber = _args?.line_number || _args?.line;
			const content = _args?.content || "";

			try {
				requireParam(filePath, "path");

				if (!lineNumber || lineNumber < 1) {
					throw createError("INVALID_LINE_NUMBER", "line_number must be positive");
				}

				const validatedPath = validateWritePath(filePath);
				await ensureParentDir(validatedPath, fs, path);

				let fileContent = "";
				try {
					fileContent = await readNormalizedFile(validatedPath, fs);
				} catch {}

				let lines = fileContent ? fileContent.split("\n") : [];

				while (lines.length < lineNumber) {
					lines.push("");
				}
				lines[lineNumber - 1] = content;

				await fs.promises.writeFile(validatedPath, lines.join("\n"), "utf-8");
				const metadata = await getFileMetadata(validatedPath, fs);

				return clientReturn(createResponse(
					`Line ${lineNumber} rewritten in ${validatedPath}`,
					{
						path: validatedPath,
						line_number: lineNumber,
						line_content: content,
						total_lines: lines.length,
						...metadata
					}
				));
			} catch (err) {
				return clientReturn(err.type ? err : createError("EFAIL", String(err?.message || err)));
			}
		}
		// </block: rewrite_line>


		// <block: search_files>
		case "search_files": {
			const folderPath = extractFolderPath(_args);
			const pattern = _args?.pattern;
			const type = _args?.type || "all";
			const limit = _args?.limit || 50;
			const output = _args?.output;

			try {
				requireParam(folderPath, "path");
				const validatedPath = validateWorkspacePath(folderPath);
				await ensureIsDirectory(validatedPath, fs);

				const results = [];
				const patternLower = pattern ? pattern.toLowerCase() : null;

				async function searchRecursive(dir) {
					if (results.length >= limit) return;
					try {
						const entries = await fs.promises.readdir(dir, { withFileTypes: true });
						for (const entry of entries) {
							if (results.length >= limit) return;
							const fullPath = path.join(dir, entry.name);
							const nameLower = entry.name.toLowerCase();
							const matchesPattern = !patternLower || nameLower.includes(patternLower);

							if (matchesPattern) {
								const isFile = entry.isFile();
								const isFolder = entry.isDirectory();
								if ((type === "all") || (type === "files" && isFile) || (type === "folders" && isFolder)) {
									try {
										const entryStats = await fs.promises.stat(fullPath);
										results.push({
											path: fullPath,
											name: entry.name,
											type: isFile ? "file" : "folder",
											size: entryStats.size,
											modified: entryStats.mtime.toISOString(),
										});
									} catch {}
								}
							}
							if (entry.isDirectory()) {
								await searchRecursive(fullPath);
							}
						}
					} catch {}
				}

				await searchRecursive(validatedPath);

				const filename = output || `search_results_${Date.now()}`;
				const resultData = {
					search_path: validatedPath,
					pattern: pattern || null,
					type_filter: type,
					results_count: results.length,
					limit: limit,
					timestamp: new Date().toISOString(),
					results: results
				};

				const jsonData = await saveJsonData(resultData, filename, fs, path);

				return clientReturn(createResponse(
					`Found ${results.length} matching item(s). Results saved to JSON.`,
					{
						...resultData,
						saved_to: jsonData.file
					}
				));
			} catch (err) {
				return clientReturn(err.type ? err : createError("EFAIL", String(err?.message || err)));
			}
		}
		// </block: search_files>


		// <block: write_file>
		case "write_file": {
			const filePath = extractFilePath(_args);
			const content = _args?.content || "";
			const append = _args?.append || false;

			try {
				requireParam(filePath, "path");
				const validatedPath = validateWorkspacePath(filePath);

				// Check if location is read-only (checks both filename and directory)
				if (isReadOnly(validatedPath)) {
					throw createError("READ_ONLY", "Cannot write to read-only location");
				}

				await ensureParentDir(validatedPath, fs, path);

				if (append) {
					await fs.promises.appendFile(validatedPath, content, "utf-8");
				} else {
					await fs.promises.writeFile(validatedPath, content, "utf-8");
				}

				const lineCount = content.split("\n").length;
				const metadata = await getFileMetadata(validatedPath, fs);

				return clientReturn(createResponse(
					`File ${append ? "appended to" : "created/overwritten"}: ${validatedPath}`,
					{
						path: validatedPath,
						mode: append ? "append" : "overwrite",
						lines_written: lineCount,
						...metadata
					}
				));
			} catch (err) {
				return clientReturn(err.type ? err : createError("EFAIL", String(err?.message || err)));
			}
		}
		// </block: write_file>



		// <block: replace_text>
		case "replace_text": {
			const { filePath, createBackupFlag } = validatePosition(_args);
			const oldText = _args?.old_text;
			const newText = _args?.new_text;

			// Validate specific parameters
			if (oldText === undefined) {
				return clientReturn(createError("MISSING_OLD_TEXT", "old_text parameter is required"));
			}

			if (newText === undefined) {
				return clientReturn(createError("MISSING_NEW_TEXT", "new_text parameter is required (use empty string to delete)"));
			}

			try {
				const validatedPath = validateEditPath(filePath);
				const fsModule = await import("fs");

				// Check if file exists
				try {
					await fsModule.promises.access(validatedPath);
				} catch {
					return clientReturn(createError("FILE_NOT_FOUND", `File not found: ${filePath}`));
				}

				// Read current content
				const content = await fsModule.promises.readFile(validatedPath, "utf-8");

				// Check if old_text exists and count occurrences
				const occurrences = (content.match(new RegExp(oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;

				if (occurrences === 0) {
					return clientReturn(createError("TEXT_NOT_FOUND", "old_text not found in file. Text must match exactly."));
				}

				if (occurrences > 1) {
					return clientReturn(createError("MULTIPLE_MATCHES", `old_text appears ${occurrences} times in file. It must be unique.`));
				}

				// Create backup if requested
				const backupPath = await handleBackup(filePath, validatedPath, createBackupFlag, ctx.logInfo);

				// Perform replacement
				const newContent = content.replace(oldText, newText);
				await fsModule.promises.writeFile(validatedPath, newContent, "utf-8");

				const newLines = newContent.split("\n");
				const metadata = await getEditFileMetadata(validatedPath, newLines);

				return clientReturn(createResponse("Text block replaced successfully", {
					...metadata,
					backup: backupPath,
					old_length: oldText.length,
					new_length: newText.length
				}));

			} catch (err) {
				if (ctx.logError) ctx.logError(`replace_text failed: ${err.message}`);
				return clientReturn(err.type ? err : createError("REPLACE_FAILED", err.message));
			}
		}
		// </block: replace_text>


		// <block: insert_at_line>
		case "insert_at_line": {
			const { filePath, createBackupFlag } = validatePosition(_args);
			const lineNum = _args?.line;
			const content = _args?.content || "";
			const mode = _args?.mode || "after";

			// Validate specific parameters
			if (!lineNum || lineNum < 1) {
				return clientReturn(createError("INVALID_LINE", "line parameter must be >= 1"));
			}

			if (!["before", "after", "replace"].includes(mode)) {
				return clientReturn(createError("INVALID_MODE", "mode must be 'before', 'after', or 'replace'"));
			}

			try {
				const validatedPath = validateEditPath(filePath);
				const backupPath = await handleBackup(filePath, validatedPath, createBackupFlag, ctx.logInfo);
				
				const lines = await readLines(validatedPath);
				const idx = lineNum - 1; // Convert to 0-based

				if (idx > lines.length) {
					return clientReturn(createError("LINE_OUT_OF_RANGE", `Line ${lineNum} exceeds file length (${lines.length} lines)`));
				}

				// Perform insertion based on mode
				if (mode === "before") {
					lines.splice(idx, 0, content);
				} else if (mode === "after") {
					lines.splice(idx + 1, 0, content);
				} else if (mode === "replace") {
					if (idx >= lines.length) {
						return clientReturn(createError("LINE_OUT_OF_RANGE", `Cannot replace line ${lineNum}: file only has ${lines.length} lines`));
					}
					lines[idx] = content;
				}

				await writeLines(validatedPath, lines);
				const metadata = await getEditFileMetadata(validatedPath, lines);

				return clientReturn(createResponse(
					`Content ${mode === "replace" ? "replaced" : "inserted"} at line ${lineNum}`,
					{
						...metadata,
						backup: backupPath,
						line: lineNum,
						mode: mode
					}
				));

			} catch (err) {
				if (ctx.logError) ctx.logError(`insert_at_line failed: ${err.message}`);
				return clientReturn(err.type ? err : createError("INSERT_FAILED", err.message));
			}
		}
		// </block: insert_at_line>


		// <block: delete_lines>
		case "delete_lines": {
			const { filePath, createBackupFlag } = validatePosition(_args);
			const startLine = _args?.start;
			const endLine = _args?.end;

			try {
				// Validate parameters
				validateLineNumbers(startLine, endLine);
				
				const validatedPath = validateEditPath(filePath);
				const backupPath = await handleBackup(filePath, validatedPath, createBackupFlag, ctx.logInfo);
				
				const lines = await readLines(validatedPath);
				checkLineRange(lines, startLine, endLine);
				
				const startIdx = startLine - 1;
				const endIdx = endLine - 1;
				const deletedCount = endIdx - startIdx + 1;
				
				lines.splice(startIdx, deletedCount);

				await writeLines(validatedPath, lines);
				const metadata = await getEditFileMetadata(validatedPath, lines);

				return clientReturn(createResponse(
					`Deleted ${deletedCount} line(s) from ${startLine} to ${endLine}`,
					{
						...metadata,
						backup: backupPath,
						deleted_lines: deletedCount,
						start_line: startLine,
						end_line: endLine,
						lines_remaining: lines.length
					}
				));

			} catch (err) {
				if (ctx.logError) ctx.logError(`delete_lines failed: ${err.message}`);
				return clientReturn(err.type ? err : createError("DELETE_FAILED", err.message));
			}
		}
		// </block: delete_lines>


		// <block: replace_lines>
		case "replace_lines": {
			const { filePath, createBackupFlag } = validatePosition(_args);
			const startLine = _args?.start;
			const endLine = _args?.end;
			const newContent = _args?.new_content;

			// Validate specific parameters
			if (newContent === undefined) {
				return clientReturn(createError("MISSING_CONTENT", "new_content parameter is required (use empty string to delete lines)"));
			}

			try {
				// Validate parameters
				validateLineNumbers(startLine, endLine);
				
				const validatedPath = validateEditPath(filePath);
				const backupPath = await handleBackup(filePath, validatedPath, createBackupFlag, ctx.logInfo);
				
				const lines = await readLines(validatedPath);
				checkLineRange(lines, startLine, endLine);
				
				const startIdx = startLine - 1;
				const endIdx = endLine - 1;

				// Split new content into lines
				const newLines = newContent.split("\n");
				const deletedCount = endIdx - startIdx + 1;

				// Replace lines: delete old range and insert new content
				lines.splice(startIdx, deletedCount, ...newLines);

				await writeLines(validatedPath, lines);
				const metadata = await getEditFileMetadata(validatedPath, lines);

				return clientReturn(createResponse(
					`Replaced ${deletedCount} line(s) (${startLine}-${endLine}) with ${newLines.length} line(s)`,
					{
						...metadata,
						backup: backupPath,
						start_line: startLine,
						end_line: endLine,
						deleted_lines: deletedCount,
						inserted_lines: newLines.length
					}
				));

			} catch (err) {
				if (ctx.logError) ctx.logError(`replace_lines failed: ${err.message}`);
				return clientReturn(err.type ? err : createError("REPLACE_FAILED", err.message));
			}
		}
		// </block: replace_lines>



		default:
			return clientReturn({ ok: false, error: `Unknown command: ${cmd}` });
	}
};
// </block: tool_factory_file_operations>
