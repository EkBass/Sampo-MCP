// <file_info: server.js>
/* 
- Project: Sampo-MCP
- File: src/server.js 
- Main MCP server with stdio and optional HTTP API
*/
// </file_info: server.js>


// <block: imports>
import fs from "node:fs/promises";
import path from "node:path";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
	InitializeRequestSchema, ListToolsRequestSchema, CallToolRequestSchema,
	ListPromptsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema
}
	from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import http from "node:http";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

// Centralized path imports - Note: ES6 imports require string literals, not variables
import { _INITS, validateWorkspacePath } from "./inits.js";
import { log, logInfo, logError, setClientName, serverMessageHandler } from "./logger.js";
import { registry, registerAllTools } from "./tools_register.js";
import { startPeriodicCleanup } from "./cleanup.js";
import { generateInitsYaml } from "./generators/generate_inits_yaml.js";
import { mapFiles } from "./generators/file_map_generator.js";
import { validateApiKey } from "./api_auth.js";
// </block: imports>


// <block: helper_toFileUri>
const toFileUri = (filePath) => `file:///${filePath.replace(/\\/g, '/')}`;
// </block: helper_toFileUri>


// <block: log_server_startup>
logInfo("=== Sampo-MCP Server Starting ===");
logInfo(`Version: ${_INITS.Sampo_MCP_version}`);
logInfo(`Workspace: ${_INITS.workspacePath}`);
logInfo(`Trash: ${_INITS.trashPath}`);
logInfo(`JSON: ${_INITS.jsonPath}`);
logInfo(`Logs: ${_INITS.logsPath}`);

let startupMessage = "";
startupMessage += "\n";
startupMessage += "* IMPORTANT: AI Developer Guidelines\n";
startupMessage += "*  Use Sampo tools for ALL file operations in this workspace\n";
startupMessage += `*  Documentation: ${_INITS.sampoDocsPath}\n`;
startupMessage += "\n";
serverMessageHandler("info", startupMessage);
// </block: log_server_startup>


// <block: clientReturn_function>
function clientReturn({ type = "data", data = null, message = null, code = "OK", format = "Sampo-MCP-signal", meta = {} } = {}) {
	const envelope = {
		format, version: 1, type, code, message,
		meta: { ts: new Date().toISOString(), ...meta },
		data,
	};
	return { content: [{ type: "text", text: JSON.stringify(envelope) }] };
}
// </block: clientReturn_function>


// <block: const_mcpServer>
serverMessageHandler("info", `${_INITS.Sampo_Name} Workspace root: ${_INITS.workspacePath}`);

// Track connected client info
let currentClient = { name: _INITS.Sampo_Name, version: _INITS.Sampo_MCP_version };

const mcpServer = new Server(
	{ name: _INITS.Sampo_Name, version: _INITS.Sampo_MCP_version }, 
	{ capabilities: { tools: {}, prompts: {}, resources: {} } }
);
// </block: const_mcpServer>


// <block: handler_to_InitializeRequestSchema>
mcpServer.setRequestHandler(InitializeRequestSchema, async (req) => {
	const clientInfo = req.params.clientInfo || {};
	currentClient = { 
		name: clientInfo.name || "unknown", 
		version: clientInfo.version || "unknown"
	};
	
	// Set client name in logger for client-specific logs
	setClientName(currentClient.name);
	
	logInfo(`Client connected: ${currentClient.name} v${currentClient.version}`);
	logInfo("AI client should call sampo:001_AI_Call_This_Tool_On_First_Connection first!");
	
	// Return server info (required by MCP protocol)
	return {
		protocolVersion: _INITS.Sampo_MCP_config.protocolVersion,
		capabilities: { tools: {}, prompts: {}, resources: {} },
		serverInfo: { 
			name: _INITS.Sampo_Name, 
			version: _INITS.Sampo_MCP_version,
			instructions: `╔═══════════════════════════════════════════════════════════════╗
║ CRITICAL: New AI client?                                      ║
║ Call: "sampo:001_AI_Call_This_Tool_On_First_Connection"       ║
║ Returns: Complete orientation package with all paths & rules- ║
╚═══════════════════════════════════════════════════════════════╝

Rules:
• ONLY use Sampo tools (sampo:read_file, NOT view)
• Get paths from orientation tool, then decide what to read
• Use block-based editing for code (sampo:read_block/replace_block)

Workspace: ${_INITS.workspacePath}
Documentation: ${_INITS.sampoDocsPath}`
		}
	};
});
// </block: handler_to_InitializeRequestSchema>


// <block: handler_to_ListToolsRequestSchema>
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
	return {
		tools: registry.list().map(def => ({
			name: def.name, 
			description: def.description ?? "", 
			inputSchema: def.jsonSchema,
		})),
	};
});
// </block: handler_to_ListToolsRequestSchema>


// <block: handler_to_CallToolRequestSchema>
mcpServer.setRequestHandler(CallToolRequestSchema, async (req) => {
	const { name, arguments: args } = req.params;

	try {
		logInfo(`Tool called: ${name}`);
		const def = registry.require(name);
		const parsed = def.zod ? def.zod.parse(args || {}) : (args || {});
		const result = await def.impl(parsed, {
			fs,
			path,
			_workspace: _INITS.workspacePath,
			_trash: _INITS.trashPath,
			validateWorkspacePath,
			clientReturn,
			name,
			log,
			logInfo,
			logError,
			currentClient, // Pass stdio client info
		});
		if (result && result.content) return result;
		return clientReturn({ type: "data", data: result, meta: { tool: name } });
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		
		// Detect unknown tool errors and provide special handling
		if (msg.startsWith("Unknown tool:")) {
			logError(`Unknown tool requested: ${name}`);
			return clientReturn({ 
				type: "error", 
				message: msg, 
				code: "UNKNOWN_TOOL",
				meta: { 
					tool: name,
					hint: "Use sampo:list_tools or sampo:search_tools to discover available tools"
				}
			});
		}
		
		logError(`Tool error [${name}]: ${msg}`);
		return clientReturn({ type: "error", message: msg, code: e?.code || "EFAIL", meta: { tool: name } });
	}
});
// </block: handler_to_CallToolRequestSchema>


// <block: handler_to_ListPromptsRequestSchema>
mcpServer.setRequestHandler(ListPromptsRequestSchema, async () => {
	logInfo("Prompts list requested - returning empty list (not implemented)");
	return { prompts: [] };
});
// </block: handler_to_ListPromptsRequestSchema>


// <block: handler_to_ListResourcesRequestSchema>
mcpServer.setRequestHandler(ListResourcesRequestSchema, async () => {
    logInfo("Resources list requested - returning Sampo-docs");
    
    return { 
        resources: [
			{
				uri: "sampo://guidelines",
				name: "CRITICAL: Sampo Usage Guidelines",
				description: "Essential rules: ALWAYS use Sampo tools (sampo:read_file, etc)." +
					"NEVER use native tools (view, create_file, bash_tool)." +
					"Call the 001_AI_Call_This_Tool_On_First_Connection tool for details.",
				mimeType: "text/markdown"
			},
            {
                uri: "sampo://workspace-root",
                name: "WORKSPACE ROOT PATH",
                description: "Absolute path to workspace root.",
                mimeType: "text/plain"
            },
            {
                uri: "sampo://sampo-docs-path",
                name: "SAMPO DOCS PATH",
                description: "Sampo-docs root.",
                mimeType: "text/plain"
            },
            {
                uri: "sampo://tool-docs-path",
                name: "TOOL DOCS PATH",
                description: "Tool documentation organized by categories.",
                mimeType: "text/plain"
            },
            {
                uri: "sampo://sampo-source-path",
                name: "SAMPO SOURCE PATH",
                description: "Sampo-MCP source code directory.",
                mimeType: "text/plain"
            },
            {
                uri: toFileUri(path.join(_INITS.toolDocsPath, "Index-tools", "001_AI_Call_This_Tool_On_First_Connection.yaml")),
                name: "Connection Guide",
                description: "Central documentation - what AI needs on connection.",
                mimeType: "text/markdown"
            },
			{
                uri: toFileUri(path.join(_INITS.devDocsPath, "log.yaml")),
                name: "log",
                description: "log path",
                mimeType: "text/plain"
            },
            {
                uri: toFileUri(path.join(_INITS.devDocsPath, "How_to_add_new_tool_to_Sampo-MCP.yaml")),
                name: "Adding New Tools Guide",
                description: "How to add new tools to Sampo-MCP.",
                mimeType: "text/plain"
            },
            {
                uri: toFileUri(path.join(_INITS.devDocsPath, "file_tree.yaml")),
                name: "File Tree Map",
                description: "YAML map of Sampo source files.",
                mimeType: "application/json"
            },
            {
                uri: toFileUri(path.join(_INITS.devDocsPath, "init-config.yaml")),
                name: "INITS Configuration",
                description: "_INITS configuration and path documentation.",
                mimeType: "text/plain"
            },
            {
                uri: "sampo://trash-path",
                name: "TRASH PATH",
                description: "Files can be recovered from here.",
                mimeType: "text/plain"
            },
		]
	};
});

// </block: handler_to_ListResourcesRequestSchema>


// <block: handler_to_ReadResourceRequestSchema>
mcpServer.setRequestHandler(ReadResourceRequestSchema, async (req) => {
	const { uri } = req.params;
	logInfo(`Resource read requested: ${uri}`);
	
	try {
		// Handle file:// URIs (dev-docs)
		if (uri.startsWith("file:///")) {
			const filePath = uri.replace("file:///", "");
			const content = await fs.readFile(filePath, "utf-8");
			return {
				contents: [{
					uri: uri,
					mimeType: uri.endsWith(".md") ? "text/markdown" : "text/plain",
					text: content
				}]
			};
		}
		// Handle sampo:// synthetic resources
		if (uri === "sampo://workspace-root") {
			return {
				contents: [{
					uri: uri,
					mimeType: "text/plain",
					text: _INITS.workspacePath
				}]
			};
		}

		if (uri === "sampo://sampo-docs-path") {
			return {
				contents: [{
					uri: uri,
					mimeType: "text/plain",
					text: _INITS.sampoDocsPath
				}]
			};
		}

		if (uri === "sampo://tool-docs-path") {
			return {
				contents: [{
					uri: uri,
					mimeType: "text/plain",
					text: _INITS.toolDocsPath
				}]
			};
		}


	if (uri === "sampo://sampo-source-path") {
		return {
			contents: [{
				uri: uri,
				mimeType: "text/plain",
				text: _INITS.projectSrc
			}]
		};
	}
		if (uri === "sampo://trash-path") {
			return {
				contents: [{
					uri: uri,
					mimeType: "text/plain",
					text: _INITS.trashPath
				}]
			};
		}
		// Handle sampo:// URIs (synthetic resources)
		if (uri === "sampo://guidelines") {
			const filePath = path.join(_INITS.toolDocsPath, "Index-tools", "001_AI_Call_This_Tool_On_First_Connection.yaml");
			let content = await fs.readFile(filePath, "utf-8");
			
			// Replace placeholders with actual paths
			content = content
				.replace(/\{\{workspacePath\}\}/g, _INITS.workspacePath)
				.replace(/\{\{projectSrc\}\}/g, _INITS.projectSrc)
				.replace(/\{\{sampoDocsPath\}\}/g, _INITS.sampoDocsPath)
				.replace(/\{\{blockDocsPath\}\}/g, _INITS.blockDocsPath)
				.replace(/\{\{toolDocsPath\}\}/g, _INITS.toolDocsPath)
				.replace(/\{\{devDocsPath\}\}/g, _INITS.devDocsPath)
				.replace(/\{\{logsPath\}\}/g, _INITS.logsPath)
				.replace(/\{\{trashPath\}\}/g, _INITS.trashPath);
			
			return {
				contents: [{
					uri: uri,
					mimeType: "text/markdown",
					text: content
				}]
			};
		}

		if (uri === "sampo://tool-docs") {
			const filePath = path.join(_INITS.sampoToolDocsPath, "TOOL_DOCS_INFO.md");
			let content = await fs.readFile(filePath, "utf-8");
			
			// Replace placeholder
			content = content.replace(/\{\{toolDocsPath\}\}/g, _INITS.toolDocsPath);
			
			return {
				contents: [{
					uri: uri,
					mimeType: "text/markdown",
					text: content
				}]
			};
		}		
		// Unknown URI
		logError(`Unknown resource URI: ${uri}`);
		throw new Error(`Unknown resource URI: ${uri}`);
		
	} catch (error) {
		logError(`Error reading resource: ${error.message}`);
		throw error;
	}
});
// </block: handler_to_ReadResourceRequestSchema>


// <block: http_api_server>
const app = express();
app.use(express.json({ limit: "100mb" }));

// Enable CORS for local development
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	if (req.method === 'OPTIONS') {
		return res.sendStatus(200);
	}
	next();
});

// Authentication middleware for API routes
app.use('/api', (req, res, next) => {
	const authHeader = req.headers.authorization;
	
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(401).json({ 
			success: false, 
			error: 'Missing or invalid Authorization header',
			hint: 'Use: Authorization: Bearer <your-api-key>'
		});
	}
	
	const apiKey = authHeader.substring(7); // Remove "Bearer "
	const client = validateApiKey(apiKey);
	
	if (!client) {
		return res.status(403).json({ 
			success: false, 
			error: 'Invalid or inactive API key'
		});
	}
	
	// Store client info in request for use in tools
	req.aiClient = client;
	
	// Log API access
	logInfo(`API access: ${client.name} (${client.type})`);
	
	next();
});

// Helper function to call tools with AI client context
async function callTool(toolName, args, aiClient = null) {
	const def = registry.require(toolName);
	const parsed = def.zod ? def.zod.parse(args || {}) : (args || {});
	const result = await def.impl(parsed, {
		fs,
		path,
		_workspace: _INITS.workspacePath,
		_trash: _INITS.trashPath,
		validateWorkspacePath,
		clientReturn,
		name: toolName,
		log,
		logInfo,
		logError,
		aiClient, // Pass AI client info to tools
		currentClient, // Pass stdio client info (for consistency)
	});
	return result;
}
// </block: http_api_server>


// <block: listTools_with_minimal_info>
/* Only name and description provided */
app.get("/api/tools", (req, res) => {
	try {
		const tools = registry.list().map(def => ({
			name: def.name, 
			description: def.description ?? "",
		}));
		res.json({ success: true, tools });
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
});
// </block: listTools_with_minimal_info>


// <block: listTools_with_full_info>
app.get("/api/tools/all", (req, res) => {
	try {
		const tools = registry.list().map(def => ({
			name: def.name,
			description: def.description,
			note: def.note,
			example: def.example,
			schema: def.jsonSchema,
		}));
		res.json({ success: true, tools });
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
});
// </block: listTools_with_full_info>


// <block: get_tool_full_details>
/* Get full tool details */
app.get("/api/tools/:toolName", (req, res) => {
	try {
		const { toolName } = req.params;
		const def = registry.require(toolName);
		res.json({
			success: true,
			tool: {
				name: def.name, 
				description: def.description ?? "", 
				note: def.note ?? "", 
				example: def.example ?? "",
			}
		});
	} catch (error) {
		res.status(404).json({ success: false, error: error.message });
	}
});
// </block: get_tool_full_details>


// <block: search_tool_query>
app.get("/api/search", (req, res) => {
	try {
		const query = (req.query.q || "").toLowerCase().trim();
		if (!query) {
			return res.status(400).json({ success: false, error: "Query parameter 'q' is required" });
		}

		const keywords = query.split(/\s+/);
		const tools = registry.list();

		// Score each tool based on keyword matches
		const scored = tools.map(def => {
			let score = 0;
			const nameL = def.name.toLowerCase();
			const descL = (def.description ?? "").toLowerCase();
			const tagsL = (def.tags ?? []).map(t => t.toLowerCase());

			for (const keyword of keywords) {
				// Name match (highest weight)
				if (nameL.includes(keyword)) score += 10;
				// Tag match (high weight)
				if (tagsL.some(tag => tag.includes(keyword))) score += 5;
				// Description match (lower weight)
				if (descL.includes(keyword)) score += 1;
			}

			return { def, score };
		});

		// Filter and sort by score
		const results = scored
			.filter(item => item.score > 0)
			.sort((a, b) => b.score - a.score)
			.map(item => ({
				name: item.def.name,
				description: item.def.description ?? "",
			}));

		res.json({ success: true, query, results });
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
});
// </block: search_tool_query>


// <block: call_tool>
app.post("/api/call/:toolName", async (req, res) => {
	try {
		const { toolName } = req.params;
		const args = req.body || {};
		const result = await callTool(toolName, args, req.aiClient);
		res.json({ success: true, result });
	} catch (error) {
		// Detect unknown tool errors and provide helpful response
		if (error.message.startsWith("Unknown tool:")) {
			res.status(404).json({ 
				success: false, 
				error: error.message,
				code: "UNKNOWN_TOOL",
				hint: "Use /api/list or /api/search?q=<keyword> to discover available tools"
			});
		} else {
			res.status(400).json({ success: false, error: error.message });
		}
	}
});
// </block: call_tool>


// <block: health_check>
app.get("/api/health", (req, res) => {
	res.json({
		success: true,
		status: "running",
		uptime: Date.now() - _INITS.startup_time,
		root: _INITS.workspacePath,
		version: _INITS.Sampo_MCP_version,
		name: _INITS.Sampo_Name,
	});
});
// </block: health_check>


// <block: server_info>
// Get server metadata from package.json
app.get("/api/info", (req, res) => {
	res.json({
		success: true,
		name: _INITS.Sampo_Name,
		version: _INITS.Sampo_MCP_version,
		description: _INITS.Sampo_MCP_description,
		homepage: _INITS.Sampo_MCP_homepage,
		license: _INITS.Sampo_MCP_license,
		author: _INITS.Sampo_MCP_author,
		repository: _INITS.Sampo_MCP_repository,
		engines: _INITS.Sampo_MCP_engines,
	});
});
// </block: server_info>


// <block: http_configuration>
const HTTP_PORT = process.env.SAMPO_HTTP_PORT 
    ? parseInt(process.env.SAMPO_HTTP_PORT) 
    : (_INITS.Sampo_MCP_config.httpPort || 3000);
const ENABLE_HTTP = process.env.SAMPO_ENABLE_HTTP 
    ? process.env.SAMPO_ENABLE_HTTP === 'true'
    : (_INITS.Sampo_MCP_config.enableHttp === true);
// </block: http_configuration>


// <block: server_startup>
(async () => { // <-- KEEP THIS LINE (The correct start)
	// Register all tools (loads external docs first)
	// --- REMOVED: const { registerAllTools } = await import("./tools_register.js");
	await registerAllTools(); // Now available via static import
	logInfo("Tools registered successfully");

	// HTTP server (OPTIONAL - start BEFORE stdio to avoid blocking)
	if (ENABLE_HTTP) {
		const httpServer = http.createServer(app);
		await new Promise((resolve) => {
			httpServer.listen(HTTP_PORT, "127.0.0.1", () => {
				logInfo(`HTTP API listening on ${_INITS.Sampo_MCP_http}:${HTTP_PORT}`);
				
				let httpMessage = "";
				httpMessage += `[${_INITS.Sampo_Name}] HTTP API listening on ${_INITS.Sampo_MCP_http}:${HTTP_PORT}\n`;
				httpMessage += "- GET  /api/tools\n";
				httpMessage += "- GET  /api/tools/all\n";
				httpMessage += "- GET  /api/tools/:toolName\n";
				httpMessage += "- GET  /api/search?q=keyword\n";
				httpMessage += "- POST /api/call/:toolName\n";
				httpMessage += "- GET  /api/health\n";
				httpMessage += "- GET  /api/info\n";
				serverMessageHandler("info", httpMessage);
				resolve();
			});
		});
	} else {
		logInfo("HTTP API disabled (enableHttp=false)");
		serverMessageHandler("info", "[Sampo-MCP] HTTP API disabled (enableHttp=false)");
	}

	// Start periodic cleanup
	startPeriodicCleanup();
	logInfo("Server initialization complete");
	
	// Generate init configuration YAML
	await generateInitsYaml();
	
	// Generate file tree map (runs on every startup)
	try {
		const result = await mapFiles([], { 
			save: false,             // Don't save file_tree.yaml to data folder
			generatePaths: false,    // Don't generate file_paths.js (deprecated)
			mode: "module" 
		});
		
		// Generate YAML content for dev-docs
		const yamlLines = [];
		yamlLines.push("# FILE TREE MAP");
		yamlLines.push(`# Generated: ${result.metadata.timestamp}`);
		yamlLines.push("");
		yamlLines.push("# METADATA");
		yamlLines.push("metadata:");
		yamlLines.push(`  timestamp: "${result.metadata.timestamp}"`);
		yamlLines.push(`  description: "${result.metadata.description}"`);
		yamlLines.push(`  errors: ${result.metadata.errors}`);
		yamlLines.push(`  error_message: ${result.metadata.error_message ? `"${result.metadata.error_message}"` : "null"}`);
		if (result.metadata.paths_file) {
			yamlLines.push(`  paths_file: "${result.metadata.paths_file}"`);
		}
		yamlLines.push("");
		yamlLines.push("# FILES");
		yamlLines.push("files:");
		const sortedKeys = Object.keys(result.files).sort();
		for (const key of sortedKeys) {
			yamlLines.push(`  ${key}: "${result.files[key]}"`);
		}
		yamlLines.push("");
		yamlLines.push("# END");
		
		const outputPath = path.join(_INITS.devDocsPath, "file_tree.yaml");
		await fs.writeFile(outputPath, yamlLines.join("\n"), "utf-8");
		logInfo(`File tree map generated: ${outputPath}`);
		
		if (result.metadata.paths_file) {
			logInfo(`File paths module updated: ${result.metadata.paths_file}`);
		}
		
		// Log any errors/warnings separately
		if (result.metadata.errors) {
			logError(`File tree map warnings: ${result.metadata.error_message}`);
		}
	} catch (err) {
		logError(`File tree map generation error: ${err.message}`);
	}

	// MCP stdio transport (connect LAST - this blocks further execution)
	const transport = new StdioServerTransport();
	await mcpServer.connect(transport);
	logInfo(`MCP stdio transport ready on root=${_INITS.workspacePath}`);
	serverMessageHandler("info", `[Sampo-MCP] ready on stdio; root=${_INITS.workspacePath}`);
})(); // <-- THIS IS THE CLOSING PARENTHESIS FOR THE CORRECT STARTING LINE
// </block: server_startup>