// <file_info: tools_register.js>
/* 
- Project: Sampo-MCP
- File: src/tools_register.js
- Tool registration and catalog resolution system
- Manages tool registry, schema mapping, and implementation binding
- Loads and merges external tool documentation
*/
// </file_info: tools_register.js>


// <block: imports>
import zodToJsonSchema from "zod-to-json-schema";
import { schemas } from "./schemas/schemas.js";
import { _INITS } from "./inits.js";
import { serverMessageHandler } from "./logger.js";
import { loadAllDocs, mergeToolDocs } from "./generators/docs_generator.js";
import { toolCatalog } from "./tool_catalogs/tools_catalog_index.js";

// Tool implementation makers - imported directly from their modules (no circular dependency)
import { makeEnvironmentTool, get_environment } from "./tool_implementations/tools_environment.js";
import { makeSystemTool, usage_guidelines_impl } from "./tool_implementations/tools_system.js";
import { makeNetworkTool } from "./tool_implementations/tools_network.js";
import { makeFileTool } from "./tool_implementations/tools_files.js";
import { makeSearchTool } from "./tool_implementations/tools_search.js";
import { makeNpmTool } from "./tool_implementations/tools_npm.js";
import { makeBlockTool } from "./tool_implementations/tools_blocks.js";
import { makeDevTool } from "./tool_implementations/tools_dev.js";
// </block: imports>


// <block: class_registry_tool_management>
class Registry {
	constructor() {
		this._tools = new Map();
		this._externalDocs = null;
	}

	async initialize() {
		// Load external docs before registering tools
		this._externalDocs = await loadAllDocs();
	}

	register(name, def) {
		const jsonSchema = zodToJsonSchema(def.zod);
		this._tools.set(name, { name, ...def, jsonSchema });
	}

	require(name) {
		const def = this._tools.get(name);
		if (!def) {
			// Generate helpful error with suggestions
			const suggestions = this.findSimilarTools(name, 3);
			const suggestionText = suggestions.length > 0
				? ` Did you mean: ${suggestions.join(", ")}?`
				: "";
			throw new Error(`Unknown tool: ${name}.${suggestionText} Use list_tools or search_tools to discover available tools.`);
		}
		return def;
	}

	list() {
		return Array.from(this._tools.values());
	}

	getExternalDocs() {
		return this._externalDocs;
	}

	findSimilarTools(targetName, maxResults = 3) {
		const tools = this.list();
		const targetLower = targetName.toLowerCase();
		const targetParts = targetLower.split(/[_:]/);

		const scored = tools.map(tool => {
			const nameLower = tool.name.toLowerCase();
			const nameParts = nameLower.split(/[_:]/);
			let score = 0;

			// Exact prefix match (highest score)
			if (nameLower.startsWith(targetLower)) score += 100;

			// Levenshtein distance (closer = higher score)
			const distance = this._levenshteinDistance(targetLower, nameLower);
			score += Math.max(0, 50 - distance * 2);

			// Shared word parts
			for (const targetPart of targetParts) {
				for (const namePart of nameParts) {
					if (targetPart.length > 2 && namePart.includes(targetPart)) {
						score += 20;
					}
				}
			}

			// Tag matching
			const tags = tool.tags || [];
			for (const tag of tags) {
				if (tag.toLowerCase().includes(targetLower)) {
					score += 15;
				}
			}

			return { name: tool.name, score };
		});

		return scored
			.filter(item => item.score > 10) // Only suggest if reasonably similar
			.sort((a, b) => b.score - a.score)
			.slice(0, maxResults)
			.map(item => item.name);
	}

	_levenshteinDistance(str1, str2) {
		const len1 = str1.length;
		const len2 = str2.length;
		const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

		for (let i = 0; i <= len1; i++) matrix[i][0] = i;
		for (let j = 0; j <= len2; j++) matrix[0][j] = j;

		for (let i = 1; i <= len1; i++) {
			for (let j = 1; j <= len2; j++) {
				const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
				matrix[i][j] = Math.min(
					matrix[i - 1][j] + 1,     // deletion
					matrix[i][j - 1] + 1,     // insertion
					matrix[i - 1][j - 1] + cost // substitution
				);
			}
		}

		return matrix[len1][len2];
	}
}
// </block: class_registry_tool_management>


// <block: registry_singleton_instance>
export const registry = new Registry();
// </block: registry_singleton_instance>


// <block: register_all_tools_catalog_resolution>
// Read devMode from config (default: false for production)
const devMode = _INITS.Sampo_MCP_config?.devMode ?? false;
if (devMode) {
	serverMessageHandler("info", "Running in DEVELOPMENT mode - Sampo source code accessible");
} else {
	serverMessageHandler("info", "Running in PRODUCTION mode - Sampo source code hidden");
}

// Implementation lookup map - no circular dependency!
const implMap = {
	makeSystemTool,
	makeEnvironmentTool,
	makeNetworkTool,
	makeFileTool,
	makeSearchTool,
	makeNpmTool,
	makeBlockTool,
	makeDevTool,
	// Direct function refs
	get_environment,
	usage_guidelines_impl,
};

// Register tools function - will be called after initialization
export async function registerAllTools() {
	// Initialize registry (loads external docs)
	await registry.initialize();
	
	const externalDocs = registry.getExternalDocs();

	// Register all tools
	for (const [name, config] of Object.entries(toolCatalog)) {
		const zod = schemas[config.schema] ?? schemas.SchemaSingle;

		// Pick/construct implementation based on type
		let implFn;
		if (typeof config.impl === "string") {
			// Direct function reference
			implFn = implMap[config.impl];
		} else if (config.impl?.type === "system") {
			// System initialization tools
			implFn = makeSystemTool(config.impl.commands);
		} else if (config.impl?.type === "environment") {
			// Environment detection tools
			implFn = makeEnvironmentTool(config.impl.commands);
		} else if (config.impl?.type === "network") {
			// Network-related tools
			implFn = makeNetworkTool(config.impl.commands);
		} else if (config.impl?.type === "search") {
			// Search tools
			implFn = makeSearchTool(toolCatalog);
		} else if (config.impl?.type === "npm") {
			// NPM package management tools
			implFn = makeNpmTool(config.impl.commands);
		} else if (config.impl?.type === "block") {
			// Block discovery tools
			implFn = makeBlockTool(config.impl.commands);
		} else if (config.impl?.type === "file") {
			// File and folder operations
			implFn = makeFileTool(config.impl.commands);
		} else if (config.impl?.type === "dev") {
			// Development tools
			implFn = makeDevTool(config.impl.commands);
		}
		
		if (typeof implFn !== "function") {
			throw new Error(`Tool '${name}' has no valid implementation binding`);
		}

		// Merge external docs with catalog entry
		const externalDoc = externalDocs.get(name);
		const mergedConfig = mergeToolDocs(config, externalDoc);

		registry.register(name, {
			description: mergedConfig.description ?? "",
			tags: mergedConfig.tags ?? [],
			examples: mergedConfig.examples ?? [],
			schema: mergedConfig.schema,
		    catalogType: config.impl?.type || "unknown",
			zod,
			impl: implFn,
		});
	}
}
// </block: register_all_tools_catalog_resolution>