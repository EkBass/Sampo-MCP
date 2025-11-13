// <file_info: tools_search.js>
/* 
- Project: Sampo-MCP
- File: src/tool_implementations/tool_search.js
- Tool search and discovery functionality 
- Keyword-based search with relevance scoring
*/
// </file_info: tools_search.js>


// <block: imports>
import { createError, createResponse } from "../utils.js";
// </block: imports>


// <block: helper_parseKeywords>
const parseKeywords = (query) => {
	if (!query || query.trim() === "") {
		return [];
	}
	return query.toLowerCase().split(/\s+/).filter(k => k.length > 0);
};
// </block: helper_parseKeywords>


// <block: helper_calculateScore>
const calculateScore = (toolName, tool, keywords) => {
	let score = 0;

	// Exact name match (highest priority)
	if (toolName.toLowerCase() === keywords.join("_")) {
		score += 100;
	}

	// Name contains keyword
	keywords.forEach(kw => {
		if (toolName.toLowerCase().includes(kw)) {
			score += 40;
		}
	});

	// Description matches
	const desc = (tool.description || "").toLowerCase();
	keywords.forEach(kw => {
		if (desc.includes(kw)) {
			score += 25;
		}
	});

	// Tags match (high priority)
	if (tool.tags && Array.isArray(tool.tags)) {
		const tags = tool.tags.map(t => t.toLowerCase());
		keywords.forEach(kw => {
			const matchCount = tags.filter(t => t.includes(kw) || kw.includes(t)).length;
			score += matchCount * 30;
		});
	}

	// Note matches
	const note = (tool.note || "").toLowerCase();
	keywords.forEach(kw => {
		if (note.includes(kw)) {
			score += 15;
		}
	});

	return score;
};
// </block: helper_calculateScore>


// <block: helper_createSearchResult>
const createSearchResult = (query, keywords, results, limit) => ({
    query,
    limit,
    keywords,
    count: results.length,
    results 
});
// </block: helper_createSearchResult>


// <block: function_searchTools>
export function searchTools(catalog, query, maxResults = 5) {
	const keywords = parseKeywords(query);
	
	if (keywords.length === 0) {
		return [];
	}

	// Score each tool
	const scored = Object.entries(catalog).map(([toolName, tool]) => ({
		name: toolName,
		score: calculateScore(toolName, tool, keywords),
		tool
	}));

	// Filter out zero scores and sort by score
	return scored
		.filter(item => item.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, maxResults)
		.map(item => ({
			name: item.name,
			description: item.tool.description
		}));
}
// </block: function_searchTools>


// <block: function_makeSearchTool>
export const makeSearchTool = (catalog) => async (args, { clientReturn }) => {
	const query = args?.query || args?.q || "";
	const limit = args?.limit || 10;

	if (!query) {
		return clientReturn(createError("MISSING_QUERY", "search query is required"));
	}

	try {
		const keywords = parseKeywords(query);
		const results = searchTools(catalog, query, limit);
		const searchData = createSearchResult(query, keywords, results, limit);

		const message = results.length === 0 
			? "No tools found matching your search"
			: `Found ${results.length} matching tool(s)`;

		return clientReturn(createResponse(message, searchData));
	} catch (err) {
		return clientReturn(createError("SEARCH_FAILED", err.message));
	}
};
// </block: function_makeSearchTool>