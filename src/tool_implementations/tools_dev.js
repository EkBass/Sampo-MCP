// <file_info: tools_dev.js>
/* 
- Project: Sampo-MCP
- File: src/tool_implementations/tools_dev.js
- Development tools implementation
- Consolidates dev tools from system, search, and file catalogs
- Created: 2025-11-03
*/
// </file_info: tools_dev.js>


// <block: imports>
import fs from "node:fs/promises";
import path from "node:path";
import { _INITS } from "../inits.js";
import { validateWorkspacePath } from "../inits.js";
import { createError, createResponse, formatLocalTime } from "../utils.js";
// </block: imports>


// <block: helper_save_data>
const saveData = async (data, filename, fs, path) => {
	const dataDir = path.join(_INITS.docsPath, "json");
	await fs.mkdir(dataDir, { recursive: true });
	
	const cleanFilename = filename.endsWith(".json") 
		? filename 
		: `${filename}.json`;
	
	const jsonPath = path.join(dataDir, cleanFilename);
	await fs.writeFile(jsonPath, JSON.stringify(data, null, 2), "utf-8");
	
	return {
		file: jsonPath,
		size: (await fs.stat(jsonPath)).size
	};
};
// </block: helper_save_data>


// <block: helper_parse_file_blocks>
const parseFileBlocks = async (filePath, fs) => {
	const content = await fs.readFile(filePath, "utf-8");
	const lines = content.split("\n");
	const blocks = [];
	let currentBlock = null;
	
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const lineNumber = i + 1;
		
		// Match various block patterns - fixed regex to properly capture block names
		const startMatch = line.match(/^\s*(?:\/\/|#|<!--|\/\*)\s*<block:\s*([^>]+?)>\s*$/);
		const endMatch = line.match(/^\s*(?:\/\/|#|<!--|\/\*)\s*<\/block:\s*([^>]+?)>\s*$/);
		
		if (startMatch && !currentBlock) {
			const blockName = startMatch[1].trim();
			currentBlock = {
				name: blockName,
				start_line: lineNumber,
				content_lines: []
			};
		} else if (endMatch && currentBlock) {
			const endName = endMatch[1].trim();
			if (endName === currentBlock.name) {
				currentBlock.end_line = lineNumber;
				currentBlock.line_count = currentBlock.end_line - currentBlock.start_line + 1;
				blocks.push({
					name: currentBlock.name,
					start_line: currentBlock.start_line,
					end_line: currentBlock.end_line,
					line_count: currentBlock.line_count
				});
				currentBlock = null;
			}
		}
	}
	
	return { blocks };
};
// </block: helper_parse_file_blocks>


// <block: helper_search_directory>
const searchDirectory = async (dirPath, processor, fs, path, logError) => {
	const results = [];
	try {
		const entries = await fs.readdir(dirPath, { withFileTypes: true });
		for (const entry of entries) {
			if (entry.name.startsWith("_") || entry.name === "node_modules") continue;
			
			const fullPath = path.join(dirPath, entry.name);
			if (entry.isFile() && /\.(js|ts|jsx|tsx|json|yaml|yml|md)$/i.test(entry.name)) {
				try {
					const fileResults = await processor(fullPath);
					results.push(...fileResults);
				} catch (err) {
					if (logError) logError(`Error processing ${fullPath}: ${err.message}`);
				}
			} else if (entry.isDirectory()) {
				const subResults = await searchDirectory(fullPath, processor, fs, path, logError);
				results.push(...subResults);
			}
		}
	} catch (err) {
		if (logError) logError(`Error reading directory ${dirPath}: ${err.message}`);
	}
	return results;
};
// </block: helper_search_directory>


// <block: tool_factory_dev>
export const makeDevTool = (commands) => async (_args, ctx) => {
	const { clientReturn } = ctx;
	const cmd = commands[0]; // Use first command as the tool type
	
	// Helper for logging
	const logInfo = ctx.logInfo || (() => {});
	const logError = ctx.logError || (() => {});

	switch (cmd) {

		// <block: add_log_entry>
		case "add_log_entry": {
			try {
				const { content } = _args;
				const logPath = path.join(_INITS.devDocsPath, "log.yaml");
				
				// Determine user name from context
				let userName = "MCP Client"; // Default for stdio connections
				
				// Check if called via HTTP with AI client info
				if (ctx.aiClient) {
					userName = ctx.aiClient.name;
				} 
				// Check if called via stdio with known client
				else if (ctx.currentClient && ctx.currentClient.name && ctx.currentClient.name !== "unknown") {
					userName = ctx.currentClient.name;
				}
				
				// Truncate content to 512 chars
				const truncatedContent = content.slice(0, 512);
				
				// Get formatted timestamp
				const timestamp = formatLocalTime();
				const isoTimestamp = new Date().toISOString();
				
				// Read existing log
				let logContent = "";
				let entries = [];
				try {
					logContent = await fs.readFile(logPath, "utf-8");
					// Parse existing entries - handle both quoted strings and block scalars
					const entryPattern = /- timestamp: "([^"]+)"\n  iso_timestamp: "([^"]+)"\n  author: "([^"]+)"\n  content: (?:"((?:[^"\\]|\\.)*)"|>-?\n((?:    .+\n?)*))/g;
					let match;
					while ((match = entryPattern.exec(logContent)) !== null) {
						let entryContent = match[4] || match[5]?.replace(/^    /gm, '').trim();
						// Unescape if it was a quoted string
						if (match[4]) {
							entryContent = entryContent.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
						}
						entries.push({
							timestamp: match[1],
							iso_timestamp: match[2],
							author: match[3],
							content: entryContent
						});
					}
				} catch (err) {
					// File doesn't exist yet, start fresh
				}
				
				// If >= 200 entries, keep last 100
				if (entries.length >= 200) {
					entries = entries.slice(-100);
				}
				
				// Add new entry
				entries.push({
					timestamp,
					iso_timestamp: isoTimestamp,
					author: userName,
					content: truncatedContent
				});
				
				// Format for YAML
				const yamlContent = entries.map(entry => {
					// Check if content needs multiline format
					const needsMultiline = entry.content.includes('\n') || 
						entry.content.includes('"') || 
						entry.content.length > 60;
					
					if (needsMultiline) {
						// Use block scalar for multiline content
						const indentedContent = entry.content.split('\n')
							.map(line => `    ${line}`).join('\n');
						return `- timestamp: "${entry.timestamp}"\n  iso_timestamp: "${entry.iso_timestamp}"\n  author: "${entry.author}"\n  content: >\n${indentedContent}`;
					} else {
						// Use quoted string for simple content
						const escapedContent = entry.content
							.replace(/\\/g, '\\\\')
							.replace(/"/g, '\\"')
							.replace(/\n/g, '\\n');
						return `- timestamp: "${entry.timestamp}"\n  iso_timestamp: "${entry.iso_timestamp}"\n  author: "${entry.author}"\n  content: "${escapedContent}"`;
					}
				}).join('\n\n');
				
				await fs.writeFile(logPath, yamlContent, "utf-8");
				
				return clientReturn(createResponse(
					`Log entry added by ${userName}`,
					{
						timestamp,
						iso_timestamp: isoTimestamp,
						author: userName,
						content: truncatedContent,
						total_entries: entries.length,
						log_file: logPath
					}
				));

			} catch (err) {
				logError(`add_log_entry failed: ${err.message}`);
				return clientReturn(err.type ? err : createError("LOG_FAILED", err.message));
			}
		}
		// </block: add_log_entry>


		// <block: export_folder_tree>
		case "export_folder_tree": {
			try {
				async function getFolderTree(dirPath, maxDepth = 50, currentDepth = 0) {
					if (currentDepth >= maxDepth) {
						return { folder: path.basename(dirPath), note: `Max depth (${maxDepth}) reached` };
					}
					try {
						const entries = await fs.readdir(dirPath, { withFileTypes: true });
						const folders = entries.filter(e => e.isDirectory());
						const node = { folder: path.basename(dirPath) };
						if (folders.length > 0) {
							node.children = [];
							for (const f of folders) {
								const sub = path.join(dirPath, f.name);
								try {
									const subTree = await getFolderTree(sub, maxDepth, currentDepth + 1);
									node.children.push(subTree);
								} catch {
									node.children.push({ folder: f.name, error: "Failed to read" });
								}
							}
						}
						return node;
					} catch {
						return { folder: path.basename(dirPath), error: "Failed to read directory" };
					}
				}

				// Simple YAML formatter for folder tree
				function treeToYaml(tree, indent = 0) {
					const spaces = '  '.repeat(indent);
					let yaml = '';
					
					if (indent === 0) {
						// Add header
						yaml += '# PROJECT FOLDER TREE\n';
						yaml += `# Generated: ${formatLocalTime()}\n`;
						yaml += `# Root: ${_INITS.projectRoot}\n\n`;
						yaml += 'folder_tree:\n';
					}
					
					yaml += `${spaces}- folder: "${tree.folder}"\n`;
					
					if (tree.error) {
						yaml += `${spaces}  error: "${tree.error}"\n`;
					}
					if (tree.note) {
						yaml += `${spaces}  note: "${tree.note}"\n`;
					}
					if (tree.children && tree.children.length > 0) {
						yaml += `${spaces}  children:\n`;
						for (const child of tree.children) {
							yaml += treeToYaml(child, indent + 2);
						}
					}
					
					return yaml;
				}

				const structure = await getFolderTree(_INITS.projectRoot);
				const yamlContent = treeToYaml(structure);
				
				// Save to Dev-docs directory as specified in documentation
				const outputPath = path.join(_INITS.devDocsPath, 'folder_tree.yaml');
				await fs.writeFile(outputPath, yamlContent, 'utf8');
				
				// Count folders
				const countFolders = (node) => {
					let count = 1;
					if (node.children) {
						for (const child of node.children) {
							count += countFolders(child);
						}
					}
					return count;
				};
				
				return clientReturn(createResponse(
					"Folder tree exported successfully",
					{
						saved_to: outputPath,
						root: _INITS.projectRoot,
						folder_count: countFolders(structure)
					}
				));
			} catch (err) {
				return clientReturn(err.type ? err : createError("EFAIL", String(err?.message || err)));
			}
		}
		// </block: export_folder_tree>

		// <block: get_sampo_package>
		case "get_sampo_package": {
			try {
				// Package.json is at the root of Sampo-MCP, not in src
				const packagePath = path.join(_INITS.server_root, "..", "package.json");
				const packageContent = await fs.readFile(packagePath, "utf-8");
				const packageData = JSON.parse(packageContent);
				
				return clientReturn(createResponse(
					"Package.json retrieved successfully",
					{
						package_data: packageData,
						path: packagePath
					}
				));

			} catch (err) {
				logError(`get_sampo_package failed: ${err.message}`);
				return clientReturn(err.type ? err : createError("PACKAGE_FAILED", err.message));
			}
		}
		// </block: get_sampo_package>


		// <block: sampo_close>
		case "sampo_close": {
			try {
				logInfo("Sampo-MCP server shutdown requested");
				
				// Exit gracefully
				setTimeout(() => {
					process.exit(0);
				}, 100);
				
				return clientReturn(createResponse(
					"Sampo-MCP server shutting down gracefully",
					{
						exit_code: 0,
						timestamp: new Date().toISOString()
					}
				));

			} catch (err) {
				logError(`sampo_close failed: ${err.message}`);
				return clientReturn(err.type ? err : createError("SHUTDOWN_FAILED", err.message));
			}
		}
		// </block: sampo_close>


		// <block: sampo_restart>
		case "sampo_restart": {
			try {
				logInfo("Sampo-MCP server restart requested");
				
				// Exit with code 42 for restart-wrapper to detect
				setTimeout(() => {
					process.exit(42);
				}, 100);
				
				return clientReturn(createResponse(
					"Sampo-MCP server restarting (requires restart-wrapper.js)",
					{
						exit_code: 42,
						restart_delay: "1 second",
						timestamp: new Date().toISOString()
					}
				));

			} catch (err) {
				logError(`sampo_restart failed: ${err.message}`);
				return clientReturn(err.type ? err : createError("RESTART_FAILED", err.message));
			}
		}
		// </block: sampo_restart>


		// <block: get_block_list>
		case "get_block_list": {
			const searchPath = _args?.path || _INITS.projectSrc;
			
			try {
				// Use the path directly since this is a dev tool working with source code
				const resolvedPath = searchPath;
				
				// Extract only block names from files
				const getBlockNamesFromFile = async (filePath) => {
					const parsedData = await parseFileBlocks(filePath, fs);
					return parsedData.blocks.map(b => b.name);
				};
				
				logInfo(`Getting block list from: ${resolvedPath}`);
				
				const stats = await fs.stat(resolvedPath);
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
		// </block: get_block_list>


		// <block: export_folder_tree>
		case "export_folder_tree": {
			try {
				async function getFolderTree(dirPath, maxDepth = 50, currentDepth = 0) {
					if (currentDepth >= maxDepth) {
						return { folder: path.basename(dirPath), note: `Max depth (${maxDepth}) reached` };
					}
					try {
						const entries = await fs.readdir(dirPath, { withFileTypes: true });
						const folders = entries.filter(e => e.isDirectory());
						const node = { folder: path.basename(dirPath) };
						if (folders.length > 0) {
							node.children = [];
							for (const f of folders) {
								const sub = path.join(dirPath, f.name);
								try {
									const subTree = await getFolderTree(sub, maxDepth, currentDepth + 1);
									node.children.push(subTree);
								} catch {
									node.children.push({ folder: f.name, error: "Failed to read" });
								}
							}
						}
						return node;
					} catch {
						return { folder: path.basename(dirPath), error: "Failed to read directory" };
					}
				}

				const structure = await getFolderTree(_INITS.workspacePath);
				const jsonData = await saveData(structure, "full_directory_listing", fs, path);

				return clientReturn(createResponse(
					"Directory listing saved to file",
					{
						...jsonData,
						root: _INITS.workspacePath
					}
				));
			} catch (err) {
				return clientReturn(err.type ? err : createError("EFAIL", String(err?.message || err)));
			}
		}
		// </block: export_folder_tree>


		
		// <block: export_tools_catalog>
		case "export_tools_catalog": {
			try {
				const { registry } = await import("../tools_register.js");
				const tools = registry.list().map(def => ({
					name: def.name,
					description: def.description ?? "",
					parameters: def.inputSchema ?? {},
					note: def.note ?? "",
					example: def.example ?? ""
				}));

				// Sort tools by name for better organization
				tools.sort((a, b) => a.name.localeCompare(b.name));

				// Generate YAML content
				let yamlContent = '# SAMPO-MCP TOOLS CATALOG\n';
				yamlContent += `# Generated: ${formatLocalTime()}\n`;
				yamlContent += `# Total tools: ${tools.length}\n\n`;
				yamlContent += 'tools_catalog:\n';

				for (const tool of tools) {
					yamlContent += `  - name: "${tool.name}"\n`;
					yamlContent += `    description: "${tool.description}"\n`;
					
					// Add parameters if present
					if (tool.parameters && Object.keys(tool.parameters).length > 0) {
						yamlContent += `    parameters:\n`;
						const paramsYaml = JSON.stringify(tool.parameters, null, 2)
							.split('\n')
							.map(line => '      ' + line)
							.join('\n');
						yamlContent += paramsYaml + '\n';
					}
					
					if (tool.note) {
						yamlContent += `    note: "${tool.note}"\n`;
					}
					if (tool.example) {
						yamlContent += `    example: "${tool.example}"\n`;
					}
					yamlContent += '\n';
				}

				// Save to Dev-docs directory as specified in documentation
				const outputPath = path.join(_INITS.devDocsPath, 'tools_catalog.yaml');
				await fs.writeFile(outputPath, yamlContent, 'utf8');

				return clientReturn(createResponse(
					"Tools catalog exported successfully",
					{
						saved_to: outputPath,
						total_tools: tools.length,
						timestamp: new Date().toISOString()
					}
				));
			} catch (err) {
				return clientReturn(err.type ? err : createError("EFAIL", String(err?.message || err)));
			}
		}
		// </block: export_tools_catalog>


		default:
			return clientReturn({ ok: false, error: `Unknown dev command: ${cmd}` });
	}
};
// </block: tool_factory_dev>
