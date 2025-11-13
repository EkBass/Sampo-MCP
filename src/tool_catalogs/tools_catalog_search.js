// <file_info: tools_catalog_search.js>
/* 
- Project: Sampo-MCP
- File: src/tool_catalogs/tools_catalog_search.js
- Search and Discovery Tools
- Tools for discovering and exploring available Sampo-MCP functionality.
*/
// </file_info: tools_catalog_search.js>


// <block: imports>
import { serverMessageHandler, missingManual } from "../logger.js";
// </block: imports>


// <block: tool_definitions_search_discovery>
export const searchTools = {

	// <block: search_tools>
	search_tools: {
		schema: "SchemaSearchTools",
		impl: { type: "search", commands: ["search_tools"] },
		description: "Search for Sampo-MCP tools by keywords with relevance scoring.",
		tags: ["search", "tools", "discovery", "find", "query", "help", "explore"],
		examples: [
			{ "tool": "search_tools", "args": { "query": "file write" } },
			missingManual("search_tools")
		]
	},
	// </block: search_tools>


};

// </block: tool_definitions_search_discovery>