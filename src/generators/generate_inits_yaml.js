// <file_info: generate_inits_yaml.js>
/* 
- Project: Sampo-MCP
- File: src/generators/generate_inits_yaml.js
- Auto-generates init-config.yaml documentation on server startup
- Documents _INITS object structure in YAML format
*/
// </file_info: generate_inits_yaml.js>


// <block: imports>
import fs from "node:fs/promises";
import path from "node:path";
import { _INITS } from "../inits.js";
import { serverMessageHandler } from "../logger.js";
// </block: imports>


// <block: load_package_configuration>
const packageJson = JSON.parse(await fs.readFile(_INITS.package_path, 'utf-8'));
// </block: load_package_configuration>


// <block: generate_init_yaml_content>
function generateInitYamlContent() {
    return `# SAMPO-MCP INITIALIZATION CONFIGURATION
# Generated: ${new Date().toISOString()}
# Auto-generated on server startup

# SYSTEM-INFO
system:
  platform: ${_INITS.platform}
  architecture: ${_INITS.arch}
  windows: ${_INITS.win}
  devMode: ${_INITS.devMode}

# PATHS
paths:
  _INITS.workspacePath: "${_INITS.workspacePath.replace(/\\/g, '/')}"
  _INITS.projectRoot: "${_INITS.projectRoot.replace(/\\/g, '/')}"
  _INITS.projectSrc: "${_INITS.projectSrc.replace(/\\/g, '/')}"
  _INITS.trashPath: "${_INITS.trashPath.replace(/\\/g, '/')}"
  _INITS.sampoDocsPath: "${_INITS.sampoDocsPath.replace(/\\/g, '/')}"
  _INITS.blockDocsPath: "${_INITS.blockDocsPath.replace(/\\/g, '/')}"
  _INITS.toolDocsPath: "${_INITS.toolDocsPath.replace(/\\/g, '/')}"
  _INITS.devDocsPath: "${_INITS.devDocsPath.replace(/\\/g, '/')}"
  _INITS.jsonPath: "${_INITS.jsonPath.replace(/\\/g, '/')}"
  _INITS.logsPath: "${_INITS.logsPath.replace(/\\/g, '/')}"
  _INITS.backupsPath: "${_INITS.backupsPath.replace(/\\/g, '/')}"
  _INITS.userDataPath: "${_INITS.userDataPath.replace(/\\/g, '/')}"

# PACKAGE-INFO
package:
  name: "${_INITS.Sampo_Name}"
  version: "${_INITS.Sampo_MCP_version}"
  description: "${_INITS.Sampo_MCP_description}"
  license: "${_INITS.Sampo_MCP_license}"
  homepage: "${_INITS.Sampo_MCP_homepage}"
  protocol_version: "${_INITS.Sampo_MCP_protocolVersion}"

# HTTP-CONFIG
http:
  enabled: ${_INITS.Sampo_MCP_enableHttp}
  url: "${_INITS.Sampo_MCP_http}"
  port: ${_INITS.Sampo_MCP_port}

# RUNTIME
runtime:
  startup_time: "${new Date(_INITS.startup_time).toISOString()}"
  server_root: "${_INITS.server_root.replace(/\\/g, '/')}"
  package_path: "${_INITS.package_path.replace(/\\/g, '/')}"

# DEPENDENCIES
dependencies:
${Object.entries(_INITS.Sampo_MCP_dependencies || {})
    .map(([name, version]) => `  ${name}: "${version}"`)
    .join('\n')}

# ENGINES
engines:
${Object.entries(_INITS.Sampo_MCP_engines || {})
    .map(([name, version]) => `  ${name}: "${version}"`)
    .join('\n')}

# CRITICAL-RULES
critical_rules:
  path_usage:
    never:
      - "Hardcode absolute paths"
      - "Use string literals like 'D:\\\\Sampo-Workspace\\\\...'"
      - "Assume workspace location"
    always:
      - "Use _INITS properties for ALL paths"
      - "Import { _INITS } from './inits.js'"
      - "Use path.join() for path construction"
  
  why_matters:
    - "Portability: Works on any system"
    - "Configuration: User can change paths in package.json"
    - "Cross-platform: Works on Windows, Linux, macOS"
    - "Maintainability: Paths managed centrally"
    - "Security: validateWorkspacePath() enforces boundaries"

# END
`;
}
// </block: generate_init_yaml_content>


// <block: generate_inits_yaml>
export async function generateInitsYaml() {
    try {
        const outputDir = _INITS.devDocsPath;
        const outputPath = path.join(outputDir, 'init-config.yaml');
        
        await fs.mkdir(outputDir, { recursive: true });
        
        const yamlContent = generateInitYamlContent();
        
        await fs.writeFile(outputPath, yamlContent, 'utf-8');
        
        serverMessageHandler('info', `Generated init configuration: ${outputPath}`);
        return outputPath;
        
    } catch (error) {
        serverMessageHandler('warning', `Failed to generate init-config.yaml: ${error.message}`);
        return null;
    }
}
// </block: generate_inits_yaml>