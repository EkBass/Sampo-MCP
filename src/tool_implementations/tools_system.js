// <file_info: tools_system.js>
/* 
- Project: Sampo-MCP
- File: src/tool_implementations/tool_system.js
- System information and server control tools
- Refactored to use shared utilities from utils.js
*/
// </file_info: tools_system.js>


// <block: imports>
import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";
import yaml from "yaml";
import { _INITS } from "../inits.js";
import { exec, getPackageJson, createError, createResponse, formatLocalTime } from "../utils.js";
// </block: imports>


// <block: tool_factory_system_info>
export const makeSystemTool = (commands) => async (_args, ctx) => {
	const { clientReturn } = ctx;
	const cmd = commands[0]; // Use first command as the init type

	switch (cmd) {


		// <block: 001_AI_Call_This_Tool_On_First_Connection>
		case "001_AI_Call_This_Tool_On_First_Connection": {
			try {
				const yamlPath = path.join(_INITS.sampoDocsPath, "Tool-docs", "System-tools", "001_AI_Call_This_Tool_On_First_Connection.yaml");
				const content = await fs.readFile(yamlPath, "utf-8");
				return clientReturn(createResponse(
					"Orientation guide retrieved successfully",
					{ content }
				));
			} catch (err) {
				return clientReturn(createError(
					"ORIENTATION_READ_FAILED",
					err.message
				));
			}
		}
		// </block: 001_AI_Call_This_Tool_On_First_Connection>


		// <block: add_log_entry>
		case "add_log_entry": {
			try {
				const fs = await import("node:fs/promises");
				const path = await import("node:path");
				
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
				try {
					logContent = await fs.readFile(logPath, "utf-8");
				} catch (err) {
					// File doesn't exist yet, create header
					logContent = "# DEVELOPMENT LOG\n# Generated: " + isoTimestamp + "\n# Total entries: 0\n\nentries:\n";
				}
				
				// Split into lines
				const lines = logContent.split("\n");
				
				// Find all entry start positions (lines starting with "- timestamp:")
				const entryStarts = [];
				for (let i = 0; i < lines.length; i++) {
					if (lines[i].startsWith("- timestamp:")) {
						entryStarts.push(i);
					}
				}
				
				// If >= 200 entries, remove oldest 100
				if (entryStarts.length >= 200) {
					// Keep from the 100th entry (index 100) onward
					const keepFromLine = entryStarts[100];
					
					// Find where "entries:" line is
					const entriesLineIndex = lines.findIndex(line => line.trim() === "entries:");
					
					// Remove lines between "entries:" and the 100th entry
					if (entriesLineIndex !== -1) {
						lines.splice(entriesLineIndex + 1, keepFromLine - entriesLineIndex - 1);
					}
				}
				
				// Find where to insert (before "# END" or at end)
				let insertIndex = lines.length;
				const endIndex = lines.findIndex(line => line.trim() === "# END");
				if (endIndex !== -1) {
					insertIndex = endIndex;
				}
				
				// Create new entry
				const newEntry = [
					`- timestamp: "${timestamp}"`,
					`  iso_timestamp: "${isoTimestamp}"`,
					`  author: "${userName}"`,
					`  content: >`,
					`    ${truncatedContent.replace(/\n/g, "\n    ")}`,
					""
				];
				
				// Insert new entry
				lines.splice(insertIndex, 0, ...newEntry);
				
				// Update header with new count
				const newEntryCount = entryStarts.length >= 200 ? 101 : entryStarts.length + 1;
				for (let i = 0; i < lines.length; i++) {
					if (lines[i].startsWith("# Total entries:")) {
						lines[i] = `# Total entries: ${newEntryCount}`;
						break;
					}
				}
				
				// Write back
				await fs.writeFile(logPath, lines.join("\n"), "utf-8");
				
				return clientReturn(createResponse(
					"Log entry added successfully",
					{
						timestamp: timestamp,
						userName: userName,
					}
				));
			} catch (err) {
				return clientReturn(createError(
					"LOG_WRITE_FAILED",
					err.message
				));
			}
		}
		// </block: add_log_entry>
		
			
		// <block: get_sampo_info>
		case "get_sampo_info": {
			return clientReturn(createResponse(
				"Sampo-MCP version info retrieved",
				{
					package_path: _INITS.package_path,
					Sampo_MCP_version: _INITS.Sampo_MCP_version,
					Sampo_MCP_dependencies: _INITS.Sampo_MCP_dependencies,
					Sampo_MCP_http: _INITS.Sampo_MCP_http,
					Sampo_MCP_homepage: _INITS.Sampo_MCP_homepage,
					Sampo_MCP_author: _INITS.Sampo_MCP_author,
					Sampo_MCP_author_email: _INITS.email,
					
					// Helpful hint for AI clients
					ai_orientation_hint: "New AI client? Call '001_AI_Call_This_Tool_On_First_Connection' to get complete documentation, block system guide, and workspace rules in one response!"
				}
			));
		}
		// </block: get_sampo_info>


        // <block: get_sampo_package>
		case "get_sampo_package": {
			try {
				const package_json = await getPackageJson();
				return clientReturn(createResponse(
					"Complete package.json retrieved",
					package_json
				));
			} catch (err) {
				return clientReturn(createError(
					"PACKAGE_READ_FAILED",
					err.message
				));
			}
		}
        // </block: get_sampo_package>


        // <block: get_cpu_info>
		case "get_cpu_info": {
			const cpus = os.cpus();

			// Add summary stats
			const summary = {
				model: cpus[0].model,
				cores: cpus.length,
				speed_mhz: cpus[0].speed,
				architecture: _INITS.arch,
				per_core_details: cpus  // Full array for detailed analysis
			};

			return clientReturn(createResponse(
				"CPU information retrieved",
				summary
			));
		}
		// </block: get_cpu_info>


		// <block: get_cuda_info>
		case "get_cuda_info": {
			try {
				const { stdout, stderr } = await exec('nvidia-smi');
				if (stderr) {
					throw new Error(stderr);
				}

				const lines = stdout.split('\n');
				const cudaData = {
					timestamp: null,
					smi_version: null,
					driver_version: null,
					cuda_version: null
				};

				const headerLine = lines[0];
				if (headerLine) {
					cudaData.timestamp = headerLine.trim();
					const versionMatch = stdout.match(/NVIDIA-SMI ([\d.]+).*Driver Version: ([\d.]+).*CUDA Version: ([\d.]+)/);
					if (versionMatch) {
						cudaData.smi_version = versionMatch[1];
						cudaData.driver_version = versionMatch[2];
						cudaData.cuda_version = versionMatch[3];
					}
				}

				return clientReturn(createResponse(
					"NVIDIA GPU version info retrieved",
					cudaData
				));
			} catch (err) {
				return clientReturn(createError(
					"CUDA_INFO_FAILED",
					"Failed to get CUDA version info",
					{ error: err.message }
				));
			}
		}
		// </block: get_cuda_info>
		
		
		// <block: get_current_uptime_and_startup_time>
		case "get_current_uptime":
		case "get_startup_time": {
			const currentTime = Date.now();
			const uptimeMs = currentTime - _INITS.startup_time;
			const uptimeSeconds = Math.floor(uptimeMs / 1000);

			const hours = Math.floor(uptimeSeconds / 3600);
			const minutes = Math.floor((uptimeSeconds % 3600) / 60);
			const seconds = uptimeSeconds % 60;

			const uptimeFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

			return clientReturn(createResponse(
				"Startup and Uptime Info",
				{
					startup_time: new Date(_INITS.startup_time).toISOString(),
					uptime: uptimeFormatted,
				}
			));
		}
		// </block: get_current_uptime_and_startup_time>


        // <block: get_hdd_info>
		case "get_hdd_info": {
			const fs = await import("node:fs/promises");
			const os = await import("node:os");

			// On Windows, could enumerate drives (C:, D:, etc.)
			// On Unix, could parse `df -h` output for all mounts

			const drivePath = _INITS.win ? "C:\\" : "/";
			// ... existing implementation

			// TODO: Add multi-drive support
			// Consider: get_all_drives tool
		}
        // </block: get_hdd_info>


        // <block: get_help>
		case "get_help": {
			return clientReturn(createResponse(
				"Sampo-MCP Help Guide",
				{
					message: "For complete orientation 'sampo:001_AI_Call_This_Tool_On_First_Connection'",
					note: "All file operations are sandboxed to workspace root"
				}
			));
		}

		// </block: get_help>


        // <block: get_paths>
		case "get_paths": {
			return clientReturn(createResponse(
				"All Sampo-MCP directory paths retrieved",
				{
					workspacePath: _INITS.workspacePath,
					projectRoot: _INITS.projectRoot,
					projectSrc: _INITS.projectSrc,
					trashPath: _INITS.trashPath,
					jsonPath: _INITS.jsonPath,
					logsPath: _INITS.logsPath,
					backupsPath: _INITS.backupsPath,
					userDataPath: _INITS.userDataPath,
					sampoDocsPath: _INITS.sampoDocsPath,
					blockDocsPath: _INITS.blockDocsPath,
					toolDocsPath: _INITS.toolDocsPath,
					devDocsPath: _INITS.devDocsPath
				}
			));
		}
        // </block: get_paths>


        // <block: get_local_time>
		case "get_local_time": {
			const now = new Date();
			const _timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
			const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
			const day = days[now.getDay()];
			const dd = String(now.getDate()).padStart(2, '0');
			const mm = String(now.getMonth() + 1).padStart(2, '0');
			const yyyy = now.getFullYear();
			const hh = String(now.getHours()).padStart(2, '0');
			const min = String(now.getMinutes()).padStart(2, '0');

			const formattedValue = `${day} ${dd}-${mm}-${yyyy} ${hh}:${min}`;
			return clientReturn(createResponse(
				"Local time retrieved",
				{
					format: "Day DD-MM-YYYY HH:MM",
					timezone: _timezone,
					value: formattedValue,
				}
			));
		}
        // </block: get_local_time>


        // <block: get_network_info>
		case "get_network_info": {
			try {
				const command = _INITS.win ? 'ipconfig' : 'ifconfig';
				const { stdout, stderr } = await exec(command);
				if (stderr) {
					throw new Error(stderr);
				}
				let adapters = [];
				if (_INITS.win) {
					const adapterBlocks = stdout.split('adapter ');
					for (const block of adapterBlocks.slice(1)) {
						const lines = block.split('\r\n');
						const name = lines[0].replace(':', '').trim();
						const adapter = { name, status: null, ipv4: null, gateway: null };
						for (const line of lines) {
							if (line.includes('Media State')) {
								adapter.status = line.split(':')[1]?.trim();
							}
							if (line.includes('IPv4 Address')) {
								adapter.ipv4 = line.split(':')[1]?.trim();
							}
							if (line.includes('Default Gateway')) {
								adapter.gateway = line.split(':')[1]?.trim();
							}
						}
						if (adapter.status === 'Media disconnected' && !adapter.ipv4) continue;
						adapters.push(adapter);
					}
				}
				return clientReturn(createResponse(
					"Network information retrieved",
					{ adapters }
				));
			} catch (err) {
				return clientReturn(createError(
					"NETWORK_INFO_FAILED",
					"Network information retrieval failed.",
					{ error: err.message }
				));
			}
		}
        // </block: get_network_info>


		// <block: get_nvidia_smi_info>
		case "get_nvidia_smi_info": {
			try {
				const { stdout, stderr } = await exec('nvidia-smi');
				if (stderr) {
					throw new Error(stderr);
				}

				const lines = stdout.split('\n');
				const gpuData = {
					timestamp: null,
					smi_version: null,
					driver_version: null,
					cuda_version: null,
					gpus: []
				};

				const headerLine = lines[0];
				if (headerLine) {
					gpuData.timestamp = headerLine.trim();
					const versionMatch = stdout.match(/NVIDIA-SMI ([\d.]+).*Driver Version: ([\d.]+).*CUDA Version: ([\d.]+)/);
					if (versionMatch) {
						gpuData.smi_version = versionMatch[1];
						gpuData.driver_version = versionMatch[2];
						gpuData.cuda_version = versionMatch[3];
					}
				}

				const gpuMatch = stdout.match(/(\d+)\s+NVIDIA[^\n]+/g);
				if (gpuMatch) {
					for (const match of gpuMatch) {
						const gpuLine = match.split('|');
						const tempMatch = match.match(/(\d+)C/);
						const memMatch = stdout.match(/(\d+)MiB\s*\/\s*(\d+)MiB/);
						const powerMatch = match.match(/(\d+)W\s*\/\s*(\d+)W/);
						const utilMatch = match.match(/(\d+)%\s+Default/);

						gpuData.gpus.push({
							id: gpuLine[0].trim(),
							model: gpuLine[1]?.trim() || 'Unknown',
							temperature_c: tempMatch ? parseInt(tempMatch[1]) : null,
							power_usage_w: powerMatch ? parseInt(powerMatch[1]) : null,
							power_cap_w: powerMatch ? parseInt(powerMatch[2]) : null,
							memory_used_mib: memMatch ? parseInt(memMatch[1]) : null,
							memory_total_mib: memMatch ? parseInt(memMatch[2]) : null,
							utilization_percent: utilMatch ? parseInt(utilMatch[1]) : null
						});
					}
				}



				return clientReturn(createResponse(
					"NVIDIA GPU detailed info retrieved",
					gpuData
				));
			} catch (err) {
				return clientReturn(createError(
					"GPU_INFO_FAILED",
					"Failed to get detailed NVIDIA GPU info",
					{ error: err.message }
				));
			}
		}
		// </block: get_nvidia_smi_info>


        // <block: get_os_info>
		case "get_os_info": {
			return clientReturn(createResponse(
				"OS information retrieved",
				{
					platform: os.platform(),
					release: os.release(),
					architecture: _INITS.arch,
					hostname: os.hostname(),
					version: os.version(),
				}
			));
		}
        // </block: get_os_info>


        // <block: get_ram_info>
		case "get_ram_info": {
			const totalMem = os.totalmem();
			const freeMem = os.freemem();
			const usedMem = totalMem - freeMem;

			// Add current process memory usage
			const processMemory = process.memoryUsage();

			const toGB = (bytes) => (bytes / (1024 ** 3)).toFixed(2);
			const toMB = (bytes) => (bytes / (1024 ** 2)).toFixed(2);

			return clientReturn(createResponse(
				"Memory information retrieved",
				{
					system: {
						type: "GB",
						total: parseFloat(toGB(totalMem)),
						free: parseFloat(toGB(freeMem)),
						used: parseFloat(toGB(usedMem)),
						usedPercent: parseFloat(((usedMem / totalMem) * 100).toFixed(2)),
					},
					sampo_process: {
						type: "MB",
						rss: parseFloat(toMB(processMemory.rss)),
						heapUsed: parseFloat(toMB(processMemory.heapUsed)),
						heapTotal: parseFloat(toMB(processMemory.heapTotal)),
						external: parseFloat(toMB(processMemory.external))
					}
				}
			));
		}
        // </block: get_ram_info>


        // <block: get_server_root>
		case "get_server_root": {
			return clientReturn(createResponse(
				"Server root retrieved",
				{ root: _INITS.server_root }
			));
		}
		// </block: get_server_root>


        // <block: is_windows>
		case "is_windows": {
			return clientReturn(createResponse(
				"Windows check complete",
				{ is_windows: _INITS.win }
			));
		}
        // </block: is_windows>


        // <block: list_tools>
		case "list_tools": {
			try {
				const fs = await import("node:fs/promises");
				const path = await import("node:path");
				const { registry } = await import("../tools_register.js");
				
				const catalog = _args?.catalog;
				
				const allTools = registry.list();
				
			// NO CATALOG PROVIDED - Return list of available catalogs
			if (!catalog) {
				// Extract unique catalog types from impl.type field
				const catalogSet = new Set(allTools.map(tool => tool.catalogType));
				
				for (const tool of allTools) {
					// All tools MUST have catalogType - crash if missing
					if (!tool.catalogType) {
						throw new Error(
							`CRITICAL: Tool '${tool.name}' missing catalogType field. ` +
							`All tools must be registered with a catalogType.`
						);
					}
					
					catalogSet.add(tool.catalogType.toLowerCase());
				}
				
				// Remove any empty entries and sort
				catalogSet.delete(undefined);
				catalogSet.delete(null);
				catalogSet.delete("");
				
				const catalogs = Array.from(catalogSet).sort();
				
				return clientReturn(createResponse(
					"Available tool catalogs",
					{ 
						catalogs: catalogs,
						note: "Catalogs derived from tool implementation types"
					}
				));
			}
			
			// CATALOG PROVIDED - Filter tools by impl.type ONLY
			const catalogLower = catalog.toLowerCase();
			
			const tools = allTools.filter(tool => {
				// Require catalogType - crash if missing
				if (!tool.catalogType) {
					throw new Error(
						`CRITICAL: Tool '${tool.name}' missing catalogType field. ` +
						`All tools must be registered with a catalogType.`
					);
				}
				
				return tool.catalogType.toLowerCase() === catalogLower;
			});
				
				if (tools.length === 0) {
					return clientReturn(createError(
						"EINVAL",
						`Catalog '${catalog}' not found or empty. Use list_tools() without args to see available catalogs.`
					));
				}
				
				// Helper to find yaml file recursively
				async function findYamlDoc(toolName, dir) {
					try {
						const entries = await fs.readdir(dir, { withFileTypes: true });
						
						for (const entry of entries) {
							const fullPath = path.join(dir, entry.name);
							
							if (entry.isDirectory()) {
								const found = await findYamlDoc(toolName, fullPath);
								if (found) return found;
							} else if (entry.isFile() && entry.name === `${toolName}.yaml`) {
								return fullPath;
							}
						}
					} catch (err) {
						// Directory read error, skip
					}
					return null;
				}
				
				function extractToolDescription(yamlContent) {
					try {
						const match = yamlContent.match(/^tool_description:\s*(.*)$/m);
						return match ? match[1].trim() : null;
					} catch {
						return null;
					}
				}

				
				const toolDocsPath = _INITS.toolDocsPath;
				const results = [];
				
				for (const tool of tools) {
					try {
						const yamlPath = await findYamlDoc(tool.name, toolDocsPath);
						
						if (!yamlPath) {
							// Yaml doc missing - add warning
							results.push({
								name: tool.name,
								tool_description: `# ${tool.name}\n\n⚠️ YAML documentation not found.`,
								warning: "missing_yaml"
							});
						} else {
							const yamlContent = await fs.readFile(yamlPath, "utf-8");
							const tool_description = extractToolDescription(yamlContent);
							
							if (!tool_description) {
								results.push({
									name: tool.name,
									tool_description: `# ${tool.name}\n\ntool_description: not found.`,
									warning: "missing_tool_description"
								});
							} else {
								results.push({
									name: tool.name,
									tool_description: tool_description
								});
							}
						}
					} catch (err) {
						results.push({
							name: tool.name,
							tool_description: `# ${tool.name}\n\nError loading documentation: ${err.message}`,
							warning: "load_error"
						});
					}
				}
				
				return clientReturn(createResponse(
					`Catalog '${catalog}' tools`,
					{ 
						tools: results,
						catalog_type: catalogLower 
					}
				));
				
			} catch (err) {
				return clientReturn(createError(
					"EFAIL",
					String(err?.message || err)
				));
			}
		}
        // </block: list_tools>


        // <block: get_tool_info>
		case "get_tool_info": {
			try {
				const fs = await import("node:fs/promises");
				const path = await import("node:path");
				const { registry } = await import("../tools_register.js");
				
				const toolName = _args?.tool;
				const toolDocsPath = _INITS.toolDocsPath;
				
				if (!toolName) {
					return clientReturn(createError(
						"EINVAL",
						"Tool name is required"
					));
				}
				
				// Check if tool exists
				let tool;
				try {
					tool = registry.require(toolName);
				} catch (err) {
					return clientReturn(createError(
						"ENOTFOUND",
						err.message
					));
				}
				
				// Helper to find yaml file recursively
				async function findYamlDoc(name, dir) {
					try {
						const entries = await fs.readdir(dir, { withFileTypes: true });
						
						for (const entry of entries) {
							const fullPath = path.join(dir, entry.name);
							
							if (entry.isDirectory()) {
								const found = await findYamlDoc(name, fullPath);
								if (found) return found;
							} else if (entry.isFile() && entry.name === `${name}.yaml`) {
								return fullPath;
							}
						}
					} catch (err) {
						// Directory read error, skip
					}
					return null;
				}
				
				try {
					const yamlPath = await findYamlDoc(toolName, toolDocsPath);
					
					if (!yamlPath) throw new Error("Manual not found");
					
					const yamlContent = await fs.readFile(yamlPath, "utf-8");
					
					// Return complete yaml manual
					return clientReturn(createResponse(
						`Tool '${toolName}' manual`,
						{ manual: yamlContent }
					));
					
				} catch (err) {
					// Manual missing - return basic info
					return clientReturn(createResponse(
						`Tool '${toolName}' (no manual found)`,
						{
							tool: toolName,
							description: tool.description || "No description available",
							warning: "YAML documentation is missing for this tool"
						}
					));
				}
				
			} catch (err) {
				return clientReturn(createError(
					"EFAIL",
					String(err?.message || err)
				));
			}
		}
        // </block: get_tool_info>

        // <block: paths>
		case "paths": {
			return clientReturn(createResponse(
				"Paths retrieved",
				{
					workspace: _INITS.workspacePath,
					trash: _INITS.trashPath,
					json: _INITS.jsonPath,
					logs: _INITS.logsPath,
					backups: _INITS.backupsPath
				}
			));
		}
        // </block: paths>


        // <block: sampo_close>
		case "sampo_close": {
			clientReturn(createResponse("Server shutting down. 'sampo_close' executed."));
			setTimeout(() => process.exit(0), 500);
			break;
		}
        // </block: sampo_close>


        // <block: sampo_restart>
		case "sampo_restart": {
			process.exit(42);  // Special exit code = "restart requested"
		}
		// </block: sampo_restart>


		default:
			return clientReturn(createError(
				"UNKNOWN_INIT",
				`Unknown Sampo-MCP init: ${cmd}`
			));
	}
};
// </block: tool_factory_system_info>


// <block: usage_guidelines_impl>
export async function usage_guidelines_impl() {
	// Load the YAML document that contains the full guidelines
	const yamlPath = path.join(_INITS.toolDocsPath, "Index-tools", "001_AI_Call_This_Tool_On_First_Connection.yaml");
	
	let yamlContent;
	try {
		const fileContent = await fs.readFile(yamlPath, 'utf8');
		yamlContent = yaml.parse(fileContent);
	} catch (error) {
		return {
			content: [{
				type: "text",
				text: JSON.stringify({
					format: "Sampo-MCP-signal",
					version: _INITS.Sampo_MCP_version,
					type: "error",
					code: "EFAIL",
					message: `Failed to load guidelines YAML: ${error.message}`,
					meta: { ts: new Date().toISOString() },
					data: null
				}, null, 2)
			}]
		};
	}
	
	// Create guidelines object - check if YAML already has runtime paths to avoid duplication
	let guidelines = { ...yamlContent };
	
	// Only add/override runtime paths if they're missing or need updating
	// This prevents duplication while ensuring paths are always current
	
	// If YAML has a 'data' wrapper, work with that
	if (yamlContent.data && typeof yamlContent.data === 'object') {
		// The YAML already contains structured data, just update the runtime paths within it
		guidelines = {
			...yamlContent,
			data: {
				...yamlContent.data,
				// Only override the path sections, keeping other YAML content intact
				workspace_paths: {
					workspace_root: {
						path: _INITS.workspacePath,
						description: "Main workspace directory - all file operations relative to this"
					},
					sampo_source: {
						path: _INITS.projectSrc,
						description: "Sampo-MCP source code directory"
					},
					sampo_docs: {
						path: _INITS.sampoDocsPath,
						description: "All documentation root"
					},
					dev_docs: {
						path: _INITS.devDocsPath,
						description: "Development guides and logs"
					},
					tool_docs: {
						path: _INITS.toolDocsPath,
						description: "Tool documentation organized by categories"
					},
					block_docs: {
						path: _INITS.blockDocsPath,
						description: "Block system documentation and maps"
					},
					user_data: {
						path: _INITS.userDataPath,
						description: "Data related to user"
					},
					trash: {
						path: _INITS.trashPath,
						description: "Deleted files go here (recoverable)"
					},
					json_output: {
						path: _INITS.jsonPath,
						description: "JSON search results and generated data"
					},
					backups: {
						path: _INITS.backupsPath,
						description: "Automatic backups from block operations"
					}
				},
				key_documents: {
					tools: {
						path: _INITS.toolDocsPath,
						description: "Manuals for Sampo tools listed by categories"
					},
					init_config: {
						doc: path.join(_INITS.devDocsPath, "init-config.yaml"),
						description: "Auto-generated initialization configuration"
					},
					blocks_manual: {
						doc: path.join(_INITS.blockDocsPath, "Block_system_manual.yaml"),
						description: "Guide how to use block-system with Sampo"
					},
					file_structure: {
						doc: path.join(_INITS.devDocsPath, "file_tree.yaml"),
						description: "Contains yaml map of files/folders at Sampo-MCP source code"
					},
					blocks_map: {
						doc: path.join(_INITS.blockDocsPath, "BLOCKS_MAP.yaml"),
						description: "Yaml map of blocks in Sampo source",
						warning: "By size, it can get massive"
					},
					dev_log: {
						doc: path.join(_INITS.devDocsPath, "log.yaml"),
						description: "Development log with timestamped entries"
					}
				}
			}
		};
	} else {
		// YAML doesn't have a 'data' wrapper, add runtime paths at top level
		// Only override if these keys already exist, otherwise add them
		guidelines.workspace_paths = {
			workspace_root: {
				path: _INITS.workspacePath,
				description: "Main workspace directory - all file operations relative to this"
			},
			sampo_source: {
				path: _INITS.projectSrc,
				description: "Sampo-MCP source code directory"
			},
			sampo_docs: {
				path: _INITS.sampoDocsPath,
				description: "All documentation root"
			},
			dev_docs: {
				path: _INITS.devDocsPath,
				description: "Development guides and logs"
			},
			tool_docs: {
				path: _INITS.toolDocsPath,
				description: "Tool documentation organized by categories"
			},
			block_docs: {
				path: _INITS.blockDocsPath,
				description: "Block system documentation and maps"
			},
			user_data: {
				path: _INITS.userDataPath,
				description: "Data related to user"
			},
			trash: {
				path: _INITS.trashPath,
				description: "Deleted files go here (recoverable)"
			},
			json_output: {
				path: _INITS.jsonPath,
				description: "JSON search results and generated data"
			},
			backups: {
				path: _INITS.backupsPath,
				description: "Automatic backups from block operations"
			}
		};
		
		guidelines.key_documents = {
			tools: {
				path: _INITS.toolDocsPath,
				description: "Manuals for Sampo tools listed by categories"
			},
			init_config: {
				doc: path.join(_INITS.devDocsPath, "init-config.yaml"),
				description: "Auto-generated initialization configuration"
			},
			blocks_manual: {
				doc: path.join(_INITS.blockDocsPath, "Block_system_manual.yaml"),
				description: "Guide how to use block-system with Sampo"
			},
			file_structure: {
				doc: path.join(_INITS.devDocsPath, "file_tree.yaml"),
				description: "Contains yaml map of files/folders at Sampo-MCP source code"
			},
			blocks_map: {
				doc: path.join(_INITS.blockDocsPath, "BLOCKS_MAP.yaml"),
				description: "Yaml map of blocks in Sampo source",
				warning: "By size, it can get massive"
			},
			dev_log: {
				doc: path.join(_INITS.devDocsPath, "log.yaml"),
				description: "Development log with timestamped entries"
			}
		};
	}
	
	return {
		content: [{
			type: "text",
			text: JSON.stringify({
				format: "Sampo-MCP-signal",
				version: _INITS.Sampo_MCP_version,
				type: "data",
				code: "OK",
				message: "Sampo-MCP Orientation Package",
				meta: { 
					ts: new Date().toISOString(),
					importance: "CRITICAL",
					note: "Read documents as needed using sampo:read_file"
				},
				data: guidelines.data || guidelines // Use guidelines.data if it exists, otherwise guidelines itself
			}, null, 2)
		}]
	};
}
// </block: usage_guidelines_impl>