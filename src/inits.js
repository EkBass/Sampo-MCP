// <file_info: inits.js>
/* 
- Project: Sampo-MCP
- File: src/inits.js 
- Config & workspace initialization for server.js
- Refactored for efficiency and maintainability
*/
// </file_info: inits.js>


// <block: imports>
import { configureLogger, serverMessageHandler } from "./logger.js";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import { fileURLToPath } from "url";
// </block: imports>


// <block: esm_globals>
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packagePath = path.resolve(__dirname, "..", "package.json");
// </block: esm_globals>


// <block: load_package_json>
const package_json = (() => {
    try {
        serverMessageHandler("info", `Reading package.json from ${packagePath}`);
        return JSON.parse(fs.readFileSync(packagePath, "utf-8"));
    } catch (err) {
        serverMessageHandler("error", `'init.js' cannot read file 'package.json' at path: ${packagePath}`);
    }
})();
// </block: load_package_json>


// <block: verify_workspace_config>
const config = package_json.config || {};

// Verify project root first
const projectRoot = config.installRoot 
    ? path.resolve(config.installRoot)
    : path.resolve(__dirname, ".."); // Falls back to __dirname calculation for development environment

if (!fs.existsSync(projectRoot)) { 
    serverMessageHandler("error", `Installation root does not exist: ${projectRoot}. Check package.json config.`);
}
serverMessageHandler("info", `Installation root: ${projectRoot}`);

// Auto-generate workspaceRoot from projectRoot (not config.projectRoot!)
const workspaceRoot = config.workspaceRoot 
    ? config.workspaceRoot 
    : path.join(projectRoot, "Sampo-Workspace");

const workspacePath = path.resolve(workspaceRoot);

// Ensure workspace exists
if (!fs.existsSync(workspacePath)) {
    serverMessageHandler("info", `Workspace does not exist. Creating: ${workspacePath}`);
    fs.mkdirSync(workspacePath, { recursive: true });
}
serverMessageHandler("info", `Using workspace: ${workspacePath}`);
// </block: verify_workspace_config>


// <block: verify_project_root>
// Source location points to src directory
const sourceLocation = path.join(projectRoot, "src");
if (!fs.existsSync(sourceLocation)) { 
    serverMessageHandler("error", `Source directory does not exist: ${sourceLocation}`);
}
// </block: verify_project_root>


// <block: helper_ensure_directory>
const ensureDirectory = (dirPath, description) => {
    try {
        fs.accessSync(dirPath, fs.constants.R_OK | fs.constants.W_OK);
    } catch (err) {
        serverMessageHandler("info", `${description} does not exist. Creating: ${dirPath}`);
        fs.mkdirSync(dirPath, { recursive: true });
    }
    return dirPath;
};
// </block: helper_ensure_directory>


// <block: initialize_core_directories>
// Core workspace directories with fallback defaults
const trashRoot = config.trashRoot || "_Trash";
if (trashRoot === "_Trash") {
    serverMessageHandler("info", "Trash root not configured in package.json. Using default: '_Trash'");
}

const trashPath = ensureDirectory(
    path.join(workspacePath, trashRoot),
    "Trash directory"
);

const sampoDocsRoot = config.sampoDocs || "Sampo-docs";
const sampoDocsPath = ensureDirectory(
    path.join(projectRoot, sampoDocsRoot),
    "'docs' directory");
	
const userDataPath = path.join(workspacePath, config.userData);

// </block: initialize_core_directories>


// <block: initialize_docs_subdirectories>
// Documentation subdirectories within Sampo-docs
const docsDirectories = {
    blockDocsPath: {
        name: config.blockDocs || "Block-docs",
        desc: "Block documentation directory"
    },
    toolDocsPath: {
        name: config.toolDocs || "Tool-docs",
        desc: "Tool documentation directory"
    },
    devDocsPath: {
        name: config.devDocs || "Dev-docs",
        desc: "Dev documentation directory"
    },
    jsonPath: {
        name: config.jsonRoot || "json",
        desc: "JSON output directory"
    },
    logsPath: {
        name: config.logs || "_logs",
        desc: "Logs directory"
    }
};

const paths = {};
for (const [key, { name, desc }] of Object.entries(docsDirectories)) {
    paths[key] = ensureDirectory(path.join(sampoDocsPath, name), desc);
}

// Destructure for easier access
const { blockDocsPath, initsDocsPath, toolDocsPath, devDocsPath, jsonPath, logsPath } = paths;

// Configure logger after logsPath is set
configureLogger({ logDir: logsPath });
// </block: initialize_docs_subdirectories>


// <block: initialize_dev_backups>
// Backups folder in Sampo-docs (dev mode only)
const devMode = config.devMode || false;
const backupsPath = devMode 
    ? ensureDirectory(path.join(sampoDocsPath, "_backups"), "Dev mode backups directory")
    : path.join(sampoDocsPath, "_backups"); // Path exists even if not created
// </block: initialize_dev_backups>


// <block: initialize_user_directories>
// User data directories
const userDirectories = {
    userDataPath: {
        base: workspacePath,
        name: config.userData || "User-data",
        desc: "User data directory"
    }
};

const userPaths = {};
for (const [key, { base, name, desc }] of Object.entries(userDirectories)) {
    userPaths[key] = ensureDirectory(path.join(base, name), desc);
}
// </block: initialize_user_directories>


// <block: validate_workspace_path>
export const validateWorkspacePath = (filePath, workspaceRoot = workspacePath) => {
    if (!filePath) {
        throw new Error("File path is required");
    }

    const resolvedWorkspace = path.resolve(workspaceRoot);
    const resolvedProjectRoot = path.resolve(projectRoot);
    const resolvedDocsPath = path.resolve(sampoDocsPath);

    // Handle absolute paths
    if (path.isAbsolute(filePath)) {
        const resolvedFilePath = path.resolve(filePath);
        
        // In devMode: allow access to workspace, project root, and docs
        if (devMode) {
            if (resolvedFilePath.startsWith(resolvedWorkspace) ||
                resolvedFilePath.startsWith(resolvedProjectRoot) ||
                resolvedFilePath.startsWith(resolvedDocsPath)) {
                return resolvedFilePath;
            }
            throw new Error(`Access denied even in dev mode: path is outside allowed boundaries (attempted: ${resolvedFilePath})`);
        }

        // In production: allow workspace and docs only
        if (resolvedFilePath.startsWith(resolvedWorkspace) || 
            resolvedFilePath.startsWith(resolvedDocsPath)) {
            return resolvedFilePath;
        }
        throw new Error(`Access denied: path is outside workspace (attempted: ${resolvedFilePath})`);
    }

    // Handle relative paths
    // In devMode: try multiple base paths in order
    if (devMode) {
        const basePaths = [
            resolvedWorkspace,     // Try workspace first
            resolvedProjectRoot,   // Then project root (for src/ access)
            resolvedDocsPath       // Then docs
        ];

        // Try to find which base path makes sense
        for (const basePath of basePaths) {
            const candidatePath = path.resolve(path.join(basePath, filePath));
            
            // Check if this resolved path is within allowed boundaries
            if (candidatePath.startsWith(resolvedWorkspace) ||
                candidatePath.startsWith(resolvedProjectRoot) ||
                candidatePath.startsWith(resolvedDocsPath)) {
                return candidatePath;
            }
        }
        
        // If no valid base path found
        throw new Error(`Access denied in dev mode: could not resolve relative path within allowed boundaries (attempted: ${filePath})`);
    }

    // In production: relative paths always resolve against workspace
    const resolvedFilePath = path.resolve(path.join(resolvedWorkspace, filePath));
    
    if (resolvedFilePath.startsWith(resolvedWorkspace) || 
        resolvedFilePath.startsWith(resolvedDocsPath)) {
        return resolvedFilePath;
    }
    
	throw new Error(`Access denied: path is outside workspace (attempted: ${resolvedFilePath})`);
};
// </block: validate_workspace_path>


// <block: inits_exports>
export const _INITS = {
    // Paths
    "workspacePath": workspacePath,
    "projectRoot": projectRoot,
    "projectSrc": sourceLocation,
    "trashPath": trashPath,
    "jsonPath": jsonPath,
    "logsPath": logsPath,
    "backupsPath": backupsPath,
    "userDataPath": userDataPath,
    "sampoDocsPath": sampoDocsPath,
    "blockDocsPath": blockDocsPath,
    "toolDocsPath": toolDocsPath,
    "devDocsPath": devDocsPath,
    "logFile": path.join(logsPath, config.logFile),
    "errorLogFile": path.join(logsPath, config.errorLogFile),
    
    // System info
    "win": os.platform().startsWith("win"),
    "arch": os.arch(),
    "platform": os.platform(),
    "devMode": devMode,
    
    // Runtime info
    "startup_time": Date.now(),
    "server_root": __dirname,
    "package_path": packagePath,
    
    // Package.json metadata
    "Sampo_Name": package_json.name,
    "Sampo_MCP_version": package_json.version,
    "Sampo_MCP_description": package_json.description,
    "Sampo_MCP_homepage": package_json.homepage,
    "Sampo_MCP_license": package_json.license,
    "Sampo_MCP_author": package_json.author || {},
    "Sampo_MCP_repository": package_json.repository || {},
    "Sampo_MCP_dependencies": package_json.dependencies || {},
    "Sampo_MCP_engines": package_json.engines || {},
    
    // HTTP configuration
    "Sampo_MCP_http": config.httpUrl || "http://127.0.0.1",
    "Sampo_MCP_port": config.httpPort || 3000,
    "Sampo_MCP_enableHttp": config.enableHttp || false,
    
    // Protocol version
    "Sampo_MCP_protocolVersion": config.protocolVersion || "2024-11-05",
    
    // Full config object for advanced use
    "Sampo_MCP_config": config
};
// </block: inits_exports>