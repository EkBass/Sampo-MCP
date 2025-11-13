// <file_info: tools_environment.js>
/* 
- Project: Sampo-MCP
- File: src/tool_implementations/tools_environment.js
- Detection for external programs
- Refactored to use shared utilities from utils.js
*/
// </file_info: tools_environment.js>


// <block: imports>
import { exec, createError, createResponse } from "../utils.js";
// </block: imports>


// <block: makeEnvironmentTool>
export const makeEnvironmentTool = (commands) => async (_args, ctx) => get_environment(commands, ctx);
// </block: makeEnvironmentTool>


// <block: get_environment>
// Add version parsing for common formats
export async function get_environment(commands, { clientReturn }) {
    const list = Array.isArray(commands) ? commands : [commands];
    let lastErr = null;

    for (const cmd of list) {
        try {
            const { stdout, stderr } = await exec(cmd);
            const out = (stdout || stderr || "").trim();
            if (out) {
                // Parse version number if possible
                const versionMatch = out.match(/(\d+\.\d+\.\d+)/);

                return clientReturn(createResponse(
                    "OS returned.",
                    {
                        command: cmd,
                        result: out,
                        semantic_version: versionMatch ? versionMatch[1] : null
                    }
                ));
            }
        } catch (e) {
            lastErr = e;
        }
    }

    return clientReturn(createError(
        "NOT_FOUND",
        "Executable not found in PATH.",
        { tried: list, error: lastErr?.message }
    ));
}
// </block: get_environment>