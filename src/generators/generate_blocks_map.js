// <block: file_info_generate_blocks_map.js>
/* 
- Project: Sampo-MCP
- File: src/generate_blocks_map.js
- Auto-generates BLOCKS_MAP.yaml and BLOCKS_MAP.json documenting all code blocks in src/
- Runs on every server startup to keep documentation in sync with code
- Reports errors for mismatched blocks but continues processing
- Validates block structure conventions and provides warnings
*/
// </block: file_info_generate_blocks_map.js>


// <block: imports>
import fs from "node:fs/promises";
import path from "node:path";
import { _INITS } from "../inits.js";
import { serverMessageHandler } from "../logger.js";
// </block: imports>


// <block: parseFileBlocks>
export async function parseFileBlocks(filePath) {
	try {
		const content = await fs.readFile(filePath, "utf-8");
		const lines = content.split("\n");
		const blocks = [];
		const blockStack = [];
		const errors = [];
		const warnings = [];
		const filename = path.basename(filePath);

		// Track which lines are covered by blocks
		const coveredLines = new Set();

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const lineNum = i + 1;
			const trimmed = line.trim();

			const fileInfoOpenMatch = trimmed.match(/^\/\/\s*<file_info:\s*([^>]+)>$/);
			if (fileInfoOpenMatch) {
				const specifiedFilename = fileInfoOpenMatch[1].trim();
				const blockName = `file_info_${specifiedFilename}`;
				blockStack.push({
					name: blockName,
					start_line: lineNum,
					start_index: i,
					file: filePath,
					syntax: "new" // Track that this uses new syntax
				});
				continue;
			}
			
			// Match closing file_info: // </file_info: filename> or // </file_info>
			const fileInfoCloseMatch = trimmed.match(/^\/\/\s*<\/file_info(?::\s*([^>]+))?>$/);
			if (fileInfoCloseMatch) {
				const specifiedFilename = fileInfoCloseMatch[1]?.trim();
				const blockName = specifiedFilename ? `file_info_${specifiedFilename}` : null;
				
				if (blockStack.length === 0) {
					errors.push({
						type: "ORPHANED_CLOSE",
						line: lineNum,
						message: `Closing </file_info> without matching opening${blockName ? `: ${blockName}` : ""}`
					});
					continue;
				}
				
				// Find matching file_info block (search backwards for the most recent)
				let matched = false;
				for (let j = blockStack.length - 1; j >= 0; j--) {
					const stackBlock = blockStack[j];
					// Match if it's a new-syntax file_info AND names match (or no name specified in close tag)
					if (stackBlock.syntax === "new" && (!blockName || stackBlock.name === blockName)) {
						const block = stackBlock;
						block.end_line = lineNum;
						block.end_index = i;
						block.line_count = lineNum - block.start_line + 1;
						block.content_lines = lineNum - block.start_line - 1;
						
						// Mark all lines in this block as covered
						for (let lineIdx = block.start_line; lineIdx <= block.end_line; lineIdx++) {
							coveredLines.add(lineIdx);
						}
						
						blocks.push(block);
						blockStack.splice(j, 1);
						matched = true;
						break;
					}
				}
				
				if (!matched) {
					errors.push({
						type: "NAME_MISMATCH",
						line: lineNum,
						message: `Closing </file_info> doesn't match any open <file_info> block${blockName ? ` (looking for ${blockName})` : ""}`
					});
				}
				continue;
			}
			
			// Match self-closing imports: // <block: imports/>
			const selfClosingImportsMatch = trimmed.match(/^\/\/\s*<block:\s*imports\s*\/>$/);
			if (selfClosingImportsMatch) {
				// Create a self-contained imports block (0 content lines)
				blocks.push({
					name: "imports",
					start_line: lineNum,
					start_index: i,
					end_line: lineNum,
					end_index: i,
					file: filePath,
					line_count: 1,
					content_lines: 0,
					selfClosing: true
				});
				coveredLines.add(lineNum);
				continue;
			}
			
			// ============================================
			// LEGACY SYNTAX: <block: name>
			// ============================================
			
			// Match opening block: // <block: name> (must be exact match after trim)
			const openMatch = trimmed.match(/^\/\/\s*<block:\s*([^>]+)>$/);
			if (openMatch) {
				const blockName = openMatch[1].trim();
				blockStack.push({
					name: blockName,
					start_line: lineNum,
					start_index: i,
					file: filePath,
					syntax: "legacy" // Track that this uses legacy syntax
				});
				continue;
			}

			// Match closing block: // </block: name> or // </block> (must be exact match after trim)
			const closeMatch = trimmed.match(/^\/\/\s*<\/block(?::\s*([^>]+))?>$/);
			if (closeMatch) {
				const blockName = closeMatch[1]?.trim();
				
				if (blockStack.length === 0) {
					// Closing block without opening
					errors.push({
						type: "ORPHANED_CLOSE",
						line: lineNum,
						message: `Closing block without matching opening block${blockName ? `: ${blockName}` : ""}`
					});
					continue;
				}
				
				// Find matching opening block
				let matched = false;
				for (let j = blockStack.length - 1; j >= 0; j--) {
					const stackBlock = blockStack[j];
					// Only match legacy syntax blocks (not file_info new syntax)
					if (stackBlock.syntax === "legacy" && (!blockName || stackBlock.name === blockName)) {
						const block = stackBlock;
						block.end_line = lineNum;
						block.end_index = i;
						block.line_count = lineNum - block.start_line + 1;
						block.content_lines = lineNum - block.start_line - 1; // Excluding markers
						
						// Mark all lines in this block as covered
						for (let lineIdx = block.start_line; lineIdx <= block.end_line; lineIdx++) {
							coveredLines.add(lineIdx);
						}
						
						blocks.push(block);
						blockStack.splice(j, 1);
						matched = true;
						break;
					}
				}
				
				if (!matched && blockName) {
					const openBlocks = blockStack.filter(b => b.syntax === "legacy").map(b => `'${b.name}'`).join(", ");
					errors.push({
						type: "NAME_MISMATCH",
						line: lineNum,
						expected: blockStack.find(b => b.syntax === "legacy")?.name,
						found: blockName,
						message: `Closing block name '${blockName}' doesn't match any open block.${openBlocks ? ` Expected: ${openBlocks}` : ""}`
					});
				}
			}
		}

		// Check for unclosed blocks
		if (blockStack.length > 0) {
			for (const unclosed of blockStack) {
				const syntaxInfo = unclosed.syntax === "new" ? " (new <file_info> syntax)" : "";
				errors.push({
					type: "UNCLOSED_BLOCK",
					block_name: unclosed.name,
					start_line: unclosed.start_line,
					message: `Block '${unclosed.name}' opened at line ${unclosed.start_line} but never closed${syntaxInfo}`
				});
			}
		}

		// Sort blocks by start line
		const sortedBlocks = blocks.sort((a, b) => a.start_line - b.start_line);

		// VALIDATION: Check for required blocks and their order
		if (sortedBlocks.length > 0) {
			const firstBlock = sortedBlocks[0];
			const secondBlock = sortedBlocks.length > 1 ? sortedBlocks[1] : null;
			
			// Check if first block is file_info_[filename]
			const expectedFileInfoName = `file_info_${filename}`;
			if (!firstBlock.name.startsWith("file_info_")) {
				warnings.push({
					type: "MISSING_FILE_INFO",
					line: 1,
					message: `First block should be '${expectedFileInfoName}', but found '${firstBlock.name}'`
				});
			} else if (firstBlock.name === "file_info") {
				warnings.push({
					type: "DEPRECATED_FILE_INFO",
					line: firstBlock.start_line,
					message: `Using deprecated 'file_info'. Should be '${expectedFileInfoName}'`
				});
			} else if (firstBlock.name !== expectedFileInfoName) {
				warnings.push({
					type: "WRONG_FILE_INFO_NAME",
					line: firstBlock.start_line,
					message: `File info block name '${firstBlock.name}' doesn't match filename. Should be '${expectedFileInfoName}'`
				});
			}
			
			// Check if first block starts at line 1
			if (firstBlock.start_line !== 1) {
				warnings.push({
					type: "FILE_INFO_NOT_FIRST",
					line: firstBlock.start_line,
					message: `File info block should start at line 1, but starts at line ${firstBlock.start_line}`
				});
			}
			
			// Check if second block is imports
			if (secondBlock) {
				if (secondBlock.name !== "imports") {
					warnings.push({
						type: "MISSING_IMPORTS_BLOCK",
						line: secondBlock.start_line,
						message: `Second block should be 'imports', but found '${secondBlock.name}'`
					});
				}
			} else if (sortedBlocks.length === 1) {
				warnings.push({
					type: "MISSING_IMPORTS_BLOCK",
					line: firstBlock.end_line,
					message: `File should have 'imports' block as second block`
				});
			}
		} else {
			warnings.push({
				type: "NO_BLOCKS",
				line: 1,
				message: "File contains no blocks"
			});
		}

		// VALIDATION: Check for code outside blocks (excluding empty lines)
		const uncoveredCodeLines = [];
		for (let i = 0; i < lines.length; i++) {
			const lineNum = i + 1;
			const line = lines[i];
			const trimmed = line.trim();
			
			// Skip if line is covered by a block
			if (coveredLines.has(lineNum)) continue;
			
			// Skip empty lines
			if (trimmed === "") continue;
			
			// This is code outside blocks
			uncoveredCodeLines.push(lineNum);
		}

		if (uncoveredCodeLines.length > 0) {
			// Group consecutive lines for better reporting
			const ranges = [];
			let rangeStart = uncoveredCodeLines[0];
			let rangeEnd = uncoveredCodeLines[0];
			
			for (let i = 1; i < uncoveredCodeLines.length; i++) {
				if (uncoveredCodeLines[i] === rangeEnd + 1) {
					rangeEnd = uncoveredCodeLines[i];
				} else {
					ranges.push(rangeStart === rangeEnd ? `${rangeStart}` : `${rangeStart}-${rangeEnd}`);
					rangeStart = uncoveredCodeLines[i];
					rangeEnd = uncoveredCodeLines[i];
				}
			}
			ranges.push(rangeStart === rangeEnd ? `${rangeStart}` : `${rangeStart}-${rangeEnd}`);
			
			warnings.push({
				type: "CODE_OUTSIDE_BLOCKS",
				lines: uncoveredCodeLines,
				message: `Code found outside blocks at lines: ${ranges.join(", ")}`
			});
		}

		return {
			file: filePath,
			blocks: sortedBlocks,
			errors: errors,
			warnings: warnings,
			total_blocks: blocks.length,
			total_errors: errors.length,
			total_warnings: warnings.length,
			total_lines: lines.length
		};

	} catch (error) {
		return {
			file: filePath,
			blocks: [],
			errors: [{
				type: "FILE_READ_ERROR",
				message: error.message
			}],
			warnings: [],
			total_blocks: 0,
			total_errors: 1,
			total_warnings: 0,
			total_lines: 0
		};
	}
}
// </block: parseFileBlocks>


// <block: helper_scan_directory_recursive>
async function scanDirectory(dirPath, results = []) {
	try {
		const entries = await fs.readdir(dirPath, { withFileTypes: true });
		
		for (const entry of entries) {
			const fullPath = path.join(dirPath, entry.name);
			
			// Skip hidden directories and node_modules
			if (entry.isDirectory()) {
				if (entry.name.startsWith(".") || entry.name === "node_modules") {
					continue;
				}
				await scanDirectory(fullPath, results);
			} else if (entry.isFile() && entry.name.endsWith(".js")) {
				results.push(fullPath);
			}
		}
		
		return results;
	} catch (error) {
		serverMessageHandler("error", `Error scanning directory ${dirPath}: ${error.message}`);
		return results;
	}
}
// </block: helper_scan_directory_recursive>


// <block: generate_summary_statistics>
function generateBlocksSummary(fileResults) {
	const summary = {
		total_files: fileResults.length,
		total_blocks: 0,
		total_errors: 0,
		total_warnings: 0,
		files_with_errors: 0,
		files_with_warnings: 0,
		files_without_blocks: 0,
		most_blocks_file: null,
		most_blocks_count: 0,
		unique_block_names: new Set(),
		duplicate_block_names: {},
		warning_types: {}
	};

	// Count blocks, errors, and warnings
	for (const fileResult of fileResults) {
		summary.total_blocks += fileResult.total_blocks;
		summary.total_errors += fileResult.total_errors;
		summary.total_warnings += fileResult.total_warnings || 0;
		
		if (fileResult.total_errors > 0) {
			summary.files_with_errors++;
		}
		
		if ((fileResult.total_warnings || 0) > 0) {
			summary.files_with_warnings++;
		}
		
		if (fileResult.total_blocks === 0) {
			summary.files_without_blocks++;
		}
		
		// Track file with most blocks
		if (fileResult.total_blocks > summary.most_blocks_count) {
			summary.most_blocks_count = fileResult.total_blocks;
			summary.most_blocks_file = path.basename(fileResult.file);
		}
		
		// Track unique and duplicate block names
		for (const block of fileResult.blocks) {
			if (summary.unique_block_names.has(block.name)) {
				// Duplicate found
				if (!summary.duplicate_block_names[block.name]) {
					summary.duplicate_block_names[block.name] = [];
				}
				summary.duplicate_block_names[block.name].push({
					file: path.basename(fileResult.file),
					line: block.start_line
				});
			} else {
				summary.unique_block_names.add(block.name);
			}
		}
		
		// Track warning types
		if (fileResult.warnings) {
			for (const warning of fileResult.warnings) {
				if (!summary.warning_types[warning.type]) {
					summary.warning_types[warning.type] = 0;
				}
				summary.warning_types[warning.type]++;
			}
		}
	}

	// Convert Set to sorted array
	summary.unique_block_names = Array.from(summary.unique_block_names).sort();
	summary.unique_block_count = summary.unique_block_names.length;

	// Clean up duplicate tracking - only keep names that actually appear multiple times
	const duplicates = {};
	for (const [name, locations] of Object.entries(summary.duplicate_block_names)) {
		if (locations.length > 0) {
			duplicates[name] = locations;
		}
	}
	summary.duplicate_block_names = duplicates;
	summary.duplicate_block_count = Object.keys(duplicates).length;

	return summary;
}
// </block: generate_summary_statistics>


// <block: generateBlocksMap>
export async function generateBlocksMap() {
	try {
		const srcDir = _INITS.server_root; // Points to src directory
		const outputDir = _INITS.blockDocsPath;
		const outputPath = path.join(outputDir, 'BLOCKS_MAP.yaml');
		
		serverMessageHandler("info", `Scanning for code blocks in ${srcDir}`);
		
		// Ensure block docs directory exists
		await fs.mkdir(outputDir, { recursive: true });
		
		// Scan for all .js files
		const jsFiles = await scanDirectory(srcDir);
		
		// Parse each file
		const fileResults = [];
		for (const filePath of jsFiles) {
			const relativePath = path.relative(srcDir, filePath);
			const result = await parseFileBlocks(filePath);
			
			// Replace absolute path with relative path
			result.file = relativePath;
			fileResults.push(result);
		}
		
		// Generate summary for logging
		const summary = generateBlocksSummary(fileResults);
		
		// === BUILD YAML FORMAT ===
		const lines = [];
		
		// Header
		lines.push(`# BLOCKS MAP`);
		lines.push(`# Generated: ${new Date().toISOString()}`);
		const statusBadge = summary.total_errors > 0 ? `Errors: ${summary.total_errors}` : 
		                     summary.total_warnings > 0 ? `Warnings: ${summary.total_warnings}` : 'Clean';
		lines.push(`# Status: ${statusBadge}`);
		lines.push(``);
		
		// Metadata section
		lines.push(`# METADATA`);
		lines.push(`metadata:`);
		lines.push(`  timestamp: "${new Date().toISOString()}"`);
		lines.push(`  total_files: ${summary.total_files}`);
		lines.push(`  total_blocks: ${summary.total_blocks}`);
		lines.push(`  unique_blocks: ${summary.unique_block_count}`);
		lines.push(`  errors: ${summary.total_errors}`);
		lines.push(`  warnings: ${summary.total_warnings}`);
		lines.push(`  files_with_errors: ${summary.files_with_errors}`);
		lines.push(`  files_with_warnings: ${summary.files_with_warnings}`);
		lines.push(``);
		
		// Sort files by name
		const sortedFiles = fileResults
			.filter(f => f.total_blocks > 0 || f.total_errors > 0 || f.total_warnings > 0)
			.sort((a, b) => path.basename(a.file).localeCompare(path.basename(b.file)));
		
		// Problem files section (if any)
		if (summary.total_errors > 0 || summary.total_warnings > 0) {
			lines.push(`# PROBLEM-FILES`);
			lines.push(`problems:`);
			
			const problemFiles = sortedFiles
				.filter(f => f.total_errors > 0 || f.total_warnings > 0)
				.sort((a, b) => {
					if (a.total_errors > 0 && b.total_errors === 0) return -1;
					if (a.total_errors === 0 && b.total_errors > 0) return 1;
					return 0;
				});
			
			for (const fileResult of problemFiles) {
				const filename = path.basename(fileResult.file);
				
				if (fileResult.total_errors > 0) {
					const error = fileResult.errors[0];
					const lineInfo = error.line ? ` at line ${error.line}` : '';
					lines.push(`  - file: "${filename}"`);
					lines.push(`    type: error`);
					lines.push(`    issue: "${error.type}${lineInfo}"`);
				} else if (fileResult.total_warnings > 0) {
					const warningTypes = fileResult.warnings.map(w => w.type).join(', ');
					lines.push(`  - file: "${filename}"`);
					lines.push(`    type: warning`);
					lines.push(`    issue: "${warningTypes}"`);
				}
			}
			lines.push(``);
		}
		
		// Files section
		lines.push(`# FILES`);
		lines.push(`files:`);
		
		for (const fileResult of sortedFiles) {
			const filename = path.basename(fileResult.file);
			
			// File entry
			lines.push(`  ${filename}:`);
			lines.push(`    path: "${fileResult.file}"`);
			lines.push(`    blocks: ${fileResult.total_blocks}`);
			lines.push(`    lines: ${fileResult.total_lines}`);
			
			// Add error/warning info if exists
			if (fileResult.total_errors > 0) {
				lines.push(`    errors: ${fileResult.total_errors}`);
			}
			if (fileResult.total_warnings > 0) {
				lines.push(`    warnings: ${fileResult.total_warnings}`);
			}
			
			// Block list
			if (fileResult.total_blocks > 0) {
				lines.push(`    block_list:`);
				
				for (const block of fileResult.blocks) {
					lines.push(`      - name: "${block.name}"`);
					lines.push(`        start: ${block.start_line}`);
					lines.push(`        end: ${block.end_line}`);
					lines.push(`        lines: ${block.content_lines}`);
				}
			}
		}
		
		lines.push(``);
		lines.push(`# END`);
		
		// Write to file
		await fs.writeFile(outputPath, lines.join('\n'), 'utf-8');
		
		// Log results
		serverMessageHandler("info", `Blocks map generated (YAML):`);
		serverMessageHandler("info", `  - Files scanned: ${summary.total_files}`);
		serverMessageHandler("info", `  - Blocks found: ${summary.total_blocks}`);
		serverMessageHandler("info", `  - Unique names: ${summary.unique_block_count}`);
		serverMessageHandler("info", `  - Errors found: ${summary.total_errors}`);
		serverMessageHandler("info", `  - Warnings found: ${summary.total_warnings}`);
		if (summary.total_errors > 0) {
			serverMessageHandler("warning", `  🔴 Files with errors: ${summary.files_with_errors}`);
		}
		if (summary.total_warnings > 0) {
			serverMessageHandler("warning", `  ⚠️ Files with warnings: ${summary.files_with_warnings}`);
		}
		serverMessageHandler("info", `  - Saved to: ${outputPath}`);
		
		return outputPath;
		
	} catch (error) {
		serverMessageHandler("error", `Failed to generate blocks map: ${error.message}`);
		// Don't crash server on documentation generation failure
		return null;
	}
}
// </block: generateBlocksMap>


// <block: helper_categorize_errors_by_type>
function categorizeErrors(fileResults) {
	const errorCategories = {
		UNCLOSED_BLOCK: [],
		ORPHANED_CLOSE: [],
		NAME_MISMATCH: [],
		FILE_READ_ERROR: []
	};
	
	for (const fileResult of fileResults) {
		if (fileResult.errors.length === 0) continue;
		
		for (const error of fileResult.errors) {
			const category = errorCategories[error.type];
			if (category) {
				category.push({
					file: path.basename(fileResult.file),
					...error
				});
			}
		}
	}
	
	// Only return categories that have errors
	const result = {};
	for (const [type, errors] of Object.entries(errorCategories)) {
		if (errors.length > 0) {
			result[type] = {
				count: errors.length,
				errors: errors
			};
		}
	}
	
	return result;
}
// </block: helper_categorize_errors_by_type>


// <block: generate_blocks_map_json>
export async function generateBlocksJson() {
	try {
		const srcDir = _INITS.server_root;
		const outputDir = _INITS.blockDocsPath;
		const outputPath = path.join(outputDir, 'BLOCKS_MAP.json');
		
		// Ensure block docs directory exists
		await fs.mkdir(outputDir, { recursive: true });
		
		// Scan for all .js files
		const jsFiles = await scanDirectory(srcDir);
		
		// Parse each file
		const fileResults = [];
		for (const filePath of jsFiles) {
			const relativePath = path.relative(srcDir, filePath);
			const result = await parseFileBlocks(filePath);
			result.file = relativePath;
			fileResults.push(result);
		}
		
		// Generate summary
		const summary = generateBlocksSummary(fileResults);
		
		// Build SIMPLIFIED JSON structure
		const fileArray = fileResults
			.sort((a, b) => path.basename(a.file).localeCompare(path.basename(b.file)))
			.map(fileResult => {
				const filename = path.basename(fileResult.file);
				
				// If file has errors, return error object
				if (fileResult.total_errors > 0) {
					const errorMessages = fileResult.errors.map(e => 
						`${e.type}: ${e.message}`
					).join("; ");
					return {
						filename: filename,
						error: errorMessages
					};
				}
				
				// If no blocks, skip file entirely
				if (fileResult.total_blocks === 0) {
					return null;
				}
				
				// Build simplified block array
				const blockArray = fileResult.blocks.map(block => ({
					startLine: block.start_line,
					endLine: block.end_line,
					__text: block.name
				}));
				
				// Return single block as object, multiple blocks as array
				return {
					filename: filename,
					block: blockArray.length === 1 ? blockArray[0] : blockArray
				};
			})
			.filter(f => f !== null);
		
		const blocksMap = {
			root: {
				description: `Auto-generated map of all code blocks in src/ directory. Generated at ${new Date().toISOString()}. Files scanned: ${summary.total_files}, Blocks found: ${summary.total_blocks}, Errors: ${summary.total_errors}`,
				file: fileArray
			}
		};
		
		// Write to file with pretty formatting
		await fs.writeFile(
			outputPath,
			JSON.stringify(blocksMap, null, 2),
			'utf-8'
		);
		
		return outputPath;
		
	} catch (error) {
		serverMessageHandler("error", `Failed to generate blocks JSON: ${error.message}`);
		return null;
	}
}
// </block: generate_blocks_map_json>


// <block: tool_impl_generate_blocks_json>
export async function generate_blocks_json_impl() {
	try {
		const outputPath = await generateBlocksJson();
		
		if (!outputPath) {
			return {
				content: [{
					type: "text",
					text: JSON.stringify({
						format: "Sampo-MCP-signal",
						version: 1,
						type: "error",
						code: "GENERATION_FAILED",
						message: "Failed to generate BLOCKS_MAP.json",
						meta: { ts: new Date().toISOString() },
						data: null
					})
				}]
			};
		}
		
		return {
			content: [{
				type: "text",
				text: JSON.stringify({
					format: "Sampo-MCP-signal",
					version: 1,
					type: "data",
					code: "OK",
					message: "BLOCKS_MAP.json generated successfully",
					meta: { ts: new Date().toISOString() },
					data: {
						output_path: outputPath,
						file: "BLOCKS_MAP.json",
						note: "Simplified JSON structure for programmatic access"
					}
				})
			}]
		};
	} catch (error) {
		return {
			content: [{
				type: "text",
				text: JSON.stringify({
					format: "Sampo-MCP-signal",
					version: 1,
					type: "error",
					code: "UNEXPECTED_ERROR",
					message: error.message,
					meta: { ts: new Date().toISOString() },
					data: null
				})
			}]
		};
	}
}
// </block: tool_impl_generate_blocks_json>