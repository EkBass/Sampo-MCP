// <file_info: tools_catalog_index.js>
/* 
- Project: Sampo-MCP
- File: src/tool-catalogs/tools_catalog_index.js
- Central registry that imports and merges all tool categories.
- This file replaces the monolithic tool_catalog.js with a modular structure.
*/
// </file_info: tools_catalog_index.js>


// <block: imports>
import { _INITS } from "../inits.js";
import { environmentTools } from "./tools_catalog_environment.js";
import { systemTools } from "./tools_catalog_system.js";
import { fileTools } from "./tools_catalog_files.js";
import { networkTools } from "./tools_catalog_network.js";
import { blockTools } from "./tools_catalog_blocks.js";
import { npmTools } from "./tools_catalog_npm.js";
import { searchTools } from "./tools_catalog_search.js";
import { devTools } from "./tools_catalog_dev.js";
// </block: imports>


// <block: readme>
/**
 * Master tool catalog combining all categories
 * 
 * Structure:
 * - 001_AI_Call_This_Tool_On_First_Connection: Entry point for AI clients
 * - Version Tools: Software version detection
 * - System Tools: System information and server control
 * - File Tools: File and folder operations (includes advanced editing)
 * - Network Tools: Network diagnostics and connectivity
 * - Block Tools: Semantic code block manipulation
 * - NPM Tools: Package management
 * - Search Tools: Tool and file discovery
 * 
 * Note: Edit tools were merged into File Tools on 2025-11-03
 */
// </block: readme>


// <block: tool_catalog_merged_registry>
export const toolCatalog = {

	// Merge all category tools (edit tools merged into fileTools on 2025-11-03)
	// Dev tools added as separate catalog on 2025-11-03
	...environmentTools,
	...systemTools,
	...fileTools,
	...networkTools,
	...blockTools,
	...npmTools,
	...searchTools,
	...devTools,
};
// </block: tool_catalog_merged_registry>