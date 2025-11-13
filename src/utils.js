// <file_info: utils.js>
/* 
- Project: Sampo-MCP
- File: utils.js
- Shared utility functions for all tools
*/
// </file_info: utils.js>


// <block: imports>
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { exec as _exec } from "node:child_process";
import { _INITS } from "./inits.js";
import { serverMessageHandler } from "./logger.js";
// </block: imports>


// <block: exec promisy>
export const exec = promisify(_exec);
// </block: exec promisy>


// <block: helper_isReadOnly>
export const isReadOnly = (filePath, _path) => {
    const basename = path.basename(filePath);
    
    // Files/folders starting with _ are read-only
    if (basename.startsWith('_')) {
        return true;
    }
    
    // If "devMode: false" Sampo-docs is read-only
    if (!_INITS.devMode) {
        const resolvedPath = path.resolve(filePath);
        const resolvedDocsPath = path.resolve(_INITS.sampoDocsPath);
        if (resolvedPath.startsWith(resolvedDocsPath)) {
            return true;
        }
    }
    return false;
};
// </block: helper_isReadOnly>


// <block: helper_createBackup>
export const createBackup = async (filePath, fs, path, logInfo) => {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = _INITS.backupsPath;  // Use _INITS.backupsPath instead of hardcoded
        await fs.promises.mkdir(backupDir, { recursive: true });

        const basename = path.basename(filePath);
        const backupPath = path.join(backupDir, `${basename}.${timestamp}.backup`);

        await fs.promises.copyFile(filePath, backupPath);
        if (logInfo) logInfo(`Backup created: ${backupPath}`);
        return backupPath;
    } catch (err) {
        serverMessageHandler('warning', `Backup failed: ${err.message}`);
        return null;
    }
};
// </block: helper_createBackup>


// <block: helper_readLines>
export const readLines = async (validatedPath) => {
    const content = await fs.readFile(validatedPath, "utf-8");
    return content.split("\n");
};

export const writeLines = async (validatedPath, lines) => {
    await fs.writeFile(validatedPath, lines.join("\n"), "utf-8");
};
// </block: helper_readLines>


// <block: getPackageJson>
let _cachedPkg = null;
let _pkgMtime = null;

export const getPackageJson = async (force = false) => {
    try {
        const stats = await fs.stat(_INITS.package_path);
        
        // Return cached version if available and not stale
        if (!force && _cachedPkg && stats.mtimeMs === _pkgMtime) {
            return _cachedPkg;
        }
        
        // Read and cache
        const content = await fs.readFile(_INITS.package_path, 'utf-8');
        _cachedPkg = JSON.parse(content);
        _pkgMtime = stats.mtimeMs;
        
        return _cachedPkg;
    } catch (err) {
        throw new Error(`Failed to read package.json: ${err.message}`);
    }
};
// Invalidate package.json cache (call after modifications)
export const invalidatePackageJsonCache = () => {
    _cachedPkg = null;
    _pkgMtime = null;
};
// </block: getPackageJson>


// <block: createError_createResponse>
export const createError = (code, message, data = null) => ({
    type: "error",
    code,
    message,
    ...(data && { data })
});

export const createResponse = (message, data = null, meta = {}) => ({
    type: "data",
    message,
    ...(data && { data }),
    ...(Object.keys(meta).length > 0 && { meta })
});
// </block: createError>


// <block: requireParam>
export const requireParam = (value, paramName, code = null) => {
    if (!value) {
        throw createError(
            code || `MISSING_${paramName.toUpperCase()}`,
            `${paramName} parameter is required`
        );
    }
    return value;
};
// </block: requireParam>


// <block: formatFileSize>
export const formatFileSize = (bytes) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
};
export const pathExists = async (filePath) => {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
};
// </block: formatFileSize>


// <block: getTimestamp_getFilenameTimestamp>
export const getTimestamp = () => new Date().toISOString();

export const getFilenameTimestamp = () => {
    return new Date().toISOString().replace(/[:.]/g, '-');
};
// </block: getTimestamp_getFilenameTimestamp>


// <block: formatLocalTime>
export const formatLocalTime = () => {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const day = days[now.getDay()];
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `${day} ${dd}.${mm}.${yyyy} around ${hh}:${min}`;
};
// </block: formatLocalTime>