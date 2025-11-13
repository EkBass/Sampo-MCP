// <file_info: tools_catalog_system.js>
/* 
- Project: Sampo-MCP
- File: src/tool_catalogs/tool_catalog_system.js
- System Information & Server Control Tools
- Tools for retrieving system hardware info, server status, and control.
*/
// </file_info: tools_catalog_system.js>


// <block: imports>
import { missingManual } from "../logger.js";
// </block: imports>


// <block: tool_definitions_system_info_control>
export const systemTools = {

	// <block: 001_AI_Call_This_Tool_On_First_Connection>
	"001_AI_Call_This_Tool_On_First_Connection": {
		schema: "SchemaSingle",
		impl: { type: "system", commands: ["001_AI_Call_This_Tool_On_First_Connection"] },
		description: "⚠️ CALL THIS FIRST! Complete orientation guide returning block system guide, workspace rules, and development guidelines.",
		tags: ["important", "readme", "guidelines", "documentation", "getting-started", "help", "required", "first"],
		examples: [
			{ "tool": "001_AI_Call_This_Tool_On_First_Connection", "args": {} },
		]
	},
	// </block: 001_AI_Call_This_Tool_On_First_Connection>




	// <block: get_cpu_info>
	get_cpu_info: {
		schema: "SchemaSingle",
		impl: { type: "system", commands: ["get_cpu_info"] },
		description: "Get CPU model, core count, clock speed for all logical processors.",
		tags: ["system", "hardware", "cpu", "processor"],
		examples: [
			{ "tool": "get_cpu_info", "args": {} },
			missingManual("get_cpu_info")
		]
	},
	// </block: get_cpu_info>


	// <block: get_cuda_info>
	get_cuda_info: {
		schema: "SchemaSingle",
		impl: { type: "system", commands: ["get_cuda_info"] },
		description: "Get NVIDIA  SMI, driver and cuda versions, if available",
		tags: ["system", "hardware", "gpu", "nvidia", "cuda", "versions"],
		examples: [
			{ "tool": "get_cuda_info", "args": {} },
			missingManual("get_cuda_info")
		]
	},
	// </block: get_cuda_info>


	// <block: get_current_uptime>
	get_current_uptime: {
		schema: "SchemaSingle",
		impl: { type: "system", commands: ["get_current_uptime"] },
		description: "Get how long the Sampo-MCP server has been running since last startup.",
		tags: ["system", "server", "uptime", "monitoring"],
		examples: [
			{ "tool": "get_current_uptime", "args": {} },
			missingManual("get_current_uptime")
		]
	},
	// </block: get_current_uptime>


	// <block: get_hdd_info>
	get_hdd_info: {
		schema: "SchemaSingle",
		impl: { type: "system", commands: ["get_hdd_info"] },
		description: "Get disk/storage space information for the workspace drive including total capacity, used space, available space, and usage percentage.",
		tags: ["system", "hardware", "storage", "disk", "drive"],
		examples: [
			{ "tool": "get_hdd_info", "args": {} },
			missingManual("get_hdd_info")
		]
	},
	// </block: get_hdd_info>


	// <block: get_help>
	get_help: {
		schema: "SchemaSingle",
		impl: { type: "system", commands: ["get_help"] },
		description: "Get comprehensive help guide about Sampo-MCP capabilities organized by category (file operations, system info, network tools, version detection, search) with usage examples and best practices.",
		tags: ["help", "documentation", "guide", "getting-started"],
		examples: [
			{ "tool": "get_help", "args": {} },
			missingManual("get_help")
		]
	},
	// </block: get_help>


	// <block: get_local_time>
	get_local_time: {
		schema: "SchemaSingle",
		impl: { type: "system", commands: ["get_local_time"] },
		description: "Get current local time, date, and timezone of the server.",
		tags: ["system", "time", "date", "timezone"],
		examples: [
			{ "tool": "get_local_time", "args": {} },
			missingManual("get_local_time")
		]
	},
	// </block: get_local_time>


	// <block: get_network_info>
	get_network_info: {
		schema: "SchemaSingle",
		impl: { type: "network", commands: ["get_network_info"] },
		description: "Get detailed information about all network adapters including interface names, IPv4/IPv6 addresses, MAC addresses, subnet masks, and default gateway. Shows both active and inactive interfaces.",
		tags: ["system", "network", "adapters", "interfaces", "ip"],
		examples: [
			{ "tool": "get_network_info", "args": {} },
			missingManual("get_network_info")
		]
	},
	// </block: get_network_info>


	// <block: get_nvidia_smi_info>
	get_nvidia_smi_info: {
		schema: "SchemaSingle",
		impl: { type: "system", commands: ["get_nvidia_smi_info"] },
		description: "Get NVIDIA GPU and CUDA driver information including model, memory, temperature, and power usage.",
		tags: ["system", "hardware", "gpu", "nvidia", "cuda", "monitoring"],
		examples: [
			{ "tool": "get_nvidia_smi_info", "args": {} },
			missingManual("get_nvidia_smi_info")
		]
	},
	// </block: get_nvidia_smi_info>


	// <block: get_os_info>
	get_os_info: {
		schema: "SchemaSingle",
		impl: { type: "system", commands: ["get_os_info"] },
		description: "Get operating system information including platform type, version, release, architecture (x64/arm), and hostname.",
		tags: ["system", "os", "platform", "operating-system"],
		examples: [
			{ "tool": "get_os_info", "args": {} },
			missingManual("get_os_info")
		]
	},
	// </block: get_os_info>


	// <block: get_paths>
	get_paths: {
		schema: "SchemaSingle",
		impl: { type: "system", commands: ["get_paths"] },
		description: "Get all Sampo-MCP directory paths including workspace root, project source, documentation folders, trash, logs, and user data locations.",
		tags: ["system", "filesystem", "paths", "workspace", "config"],
		examples: [
			{ "tool": "get_paths", "args": {} },
			missingManual("get_paths")
		]
	},
	// </block: get_paths>


	// <block: get_ram_info>
	get_ram_info: {
		schema: "SchemaSingle",
		impl: { type: "system", commands: ["get_ram_info"] },
		description: "Get system memory (RAM) information including total capacity, free memory, used memory, and usage percentage.",
		tags: ["system", "hardware", "memory", "ram"],
		examples: [
			{ "tool": "get_ram_info", "args": {} },
			missingManual("get_ram_info")
		]
	},
	// </block: get_ram_info>


	// <block: get_sampo_info>
	get_sampo_info: {
		schema: "SchemaSingle",
		impl: { type: "system", commands: ["get_sampo_info"] },
		description: "Get Sampo-MCP server version, installed dependencies with versions, HTTP API configuration, package.json location + more.\n" +
			"Use 'get_sampo_package' to see 'package.json'.\n" +
			"New AI client? Call '001_AI_Call_This_Tool_On_First_Connection' to get complete documentation, block system guide, and workspace rules in one response!" +
			"README_Why_name_Sampo.md is at dev-docs incase you are interested.",
		tags: ["system", "server", "metadata", "version", "config"],
		examples: [
			{ "tool": "get_sampo_info", "args": {} },
			missingManual("get_sampo_info")
		]
	},
	// </block: get_sampo_info>




	// <block: get_server_root>
	get_server_root: {
		schema: "SchemaSingle",
		impl: { type: "system", commands: ["get_server_root"] },
		description: "Get the absolute path to the Sampo-MCP server installation directory.",
		tags: ["system", "server", "paths", "config"],
		examples: [
			{ "tool": "get_server_root", "args": {} },
			missingManual("get_server_root")
		]
	},
	// </block: get_server_root>


	// <block: get_startup_time>
	get_startup_time: {
		schema: "SchemaSingle",
		impl: { type: "system", commands: ["get_startup_time"] },
		description: "Get the ISO 8601 timestamp of when the Sampo-MCP server was last started.",
		tags: ["system", "server", "time", "monitoring", "uptime"],
		examples: [
			{ "tool": "get_startup_time", "args": {} },
			missingManual("get_startup_time")
		]
	},
	// </block: get_startup_time>


	// <block: is_windows>
	is_windows: {
		schema: "SchemaSingle",
		impl: { type: "system", commands: ["is_windows"] },
		description: "Check if the Sampo-MCP server is running on Windows operating system.",
		tags: ["system", "os", "platform", "windows"],
		examples: [
			{ "tool": "is_windows", "args": {} },
			missingManual("is_windows")
		]
	},
	// </block: is_windows>


	// <block: list_tools>
	list_tools: {
		schema: "SchemaListTools",
		impl: { type: "system", commands: ["list_tools"] },
		description: "List available tool catalogs or tools within a catalog",
		tags: ["system", "tools", "metadata", "discovery", "help", "index"],
		examples: [
			{ "tool": "list_tools", "args": {} },
			{ "tool": "list_tools", "args": { "catalog": "file" } },
			{ "tool": "list_tools", "args": { "catalog": "block" } }
		]
	},
	
	get_tool_info: {
		schema: "SchemaGetToolInfo",
		impl: { type: "system", commands: ["get_tool_info"] },
		description: "Get complete YAML documentation for a specific tool",
		tags: ["system", "tools", "metadata", "discovery", "help"],
		examples: [
			{ "tool": "get_tool_info", "args": { "tool": "read_file" } },
			{ "tool": "get_tool_info", "args": { "tool": "replace_block" } }
		]
	},
	// </block: list_tools>


	


};
// </block: tool_definitions_system_info_control>