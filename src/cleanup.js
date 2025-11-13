// <file_info: cleanup.js>
/* 
- Project: Sampo-MCP
- File: src/cleanup.js
- Automatic cleanup of old files in Trash and json directories
*/
// </file_info: cleanup.js>


// <block: imports>
import fs from "node:fs/promises";
import path from "node:path";
import { _INITS } from "./inits.js";
import { log, logError } from "./logger.js";
// </block: imports>


// <block: readCleanupState>
async function readCleanupState() {
    try {
        const content = await fs.readFile(_INITS.package_path, "utf-8");
        const pkg = JSON.parse(content);
        return pkg.config?.cleanupState || { lastCleanup: null };
    } catch (err) {
        logError(`Failed to read cleanup state from package.json: ${err.message}`);
        return { lastCleanup: null };
    }
}
// </block: readCleanupState>

// <block: saveCleanupState>
async function saveCleanupState(state) {
    try {
        const content = await fs.readFile(_INITS.package_path, "utf-8");
        const pkg = JSON.parse(content);
        
        // Ensure config object exists
        if (!pkg.config) {
            pkg.config = {};
        }
        
        // Save cleanup state
        pkg.config.cleanupState = state;
        
        // Write back to file with pretty formatting
        await fs.writeFile(_INITS.package_path, JSON.stringify(pkg, null, 2), "utf-8");
        
        log("Cleanup state saved to package.json");
    } catch (err) {
        logError(`Failed to save cleanup state to package.json: ${err.message}`);
    }
}
// </block: saveCleanupState>


// <block: cleanupOldFiles>
async function cleanupOldFiles(dirPath, retentionDays, moveToTrash = false) {
    const stats = {
        scanned: 0,
        deleted: 0,
        moved: 0,
        errors: 0,
        freedBytes: 0
    };

    try {
        const now = Date.now();
        const maxAge = retentionDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds

        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            stats.scanned++;
            const fullPath = path.join(dirPath, entry.name);

            try {
                const stat = await fs.stat(fullPath);
                const age = now - stat.mtimeMs;

                if (age > maxAge) {
                    const size = stat.size;

                    if (entry.isDirectory()) {
                        // Recursively delete directory
                        await fs.rm(fullPath, { recursive: true, force: true });
                        stats.deleted++;
                        stats.freedBytes += size;
                        log(`Deleted directory: ${fullPath} (age: ${Math.floor(age / (24 * 60 * 60 * 1000))} days)`);
                    } else if (entry.isFile()) {
                        if (moveToTrash) {
                            // Move to trash with timestamp prefix
                            const trashPath = path.join(_INITS.trashPath, `${Date.now()}_${entry.name}`);
                            await fs.rename(fullPath, trashPath);
                            stats.moved++;
                            log(`Moved to trash: ${fullPath} -> ${trashPath}`);
                        } else {
                            // Permanently delete
                            await fs.unlink(fullPath);
                            stats.deleted++;
                            stats.freedBytes += size;
                            log(`Permanently deleted: ${fullPath} (age: ${Math.floor(age / (24 * 60 * 60 * 1000))} days, size: ${size} bytes)`);
                        }
                    }
                }
            } catch (err) {
                stats.errors++;
                logError(`Error processing ${fullPath}: ${err.message}`);
            }
        }
    } catch (err) {
        logError(`Error reading directory ${dirPath}: ${err.message}`);
    }

    return stats;
}
// </block: cleanupOldFiles >


// <block: cleanupTrash>
 async function cleanupTrash() {
    const retentionDays = _INITS.Sampo_MCP_config?.cleanup?.trashRetentionDays || 10;
    log(`Starting Trash cleanup (retention: ${retentionDays} days)`);
    
    const stats = await cleanupOldFiles(_INITS.trashPath, retentionDays, false);
    
    log(`Trash cleanup complete: scanned=${stats.scanned}, deleted=${stats.deleted}, errors=${stats.errors}, freed=${(stats.freedBytes / 1024 / 1024).toFixed(2)}MB`);
    return stats;
}
// </block: cleanupTrash>


// <block: cleanupJson>
 async function cleanupJson() {
    const retentionDays = _INITS.Sampo_MCP_config?.cleanup?.jsonRetentionDays || 10;
    log(`Starting json cleanup (retention: ${retentionDays} days)`);
    
    const stats = await cleanupOldFiles(_INITS.jsonPath, retentionDays, true);
    
    log(`JSON cleanup complete: scanned=${stats.scanned}, moved=${stats.moved}, errors=${stats.errors}`);
    return stats;
 }
// </block: cleanupJson >


// <block: runCleanup>
 export async function runCleanup() {
    log("=== Starting scheduled cleanup ===");
    
    const results = {
        trash: null,
        json: null,
        timestamp: new Date().toISOString()
    };

    try {
        results.json = await cleanupJson();
    } catch (err) {
        logError(`JSON cleanup failed: ${err.message}`);
    }

    try {
        results.trash = await cleanupTrash();
    } catch (err) {
        logError(`Trash cleanup failed: ${err.message}`);
    }

    // Save cleanup timestamp
    await saveCleanupState({
        lastCleanup: Date.now(),
        lastCleanupISO: new Date().toISOString(),
        results
    });

    log("=== Scheduled cleanup complete ===");
    return results;
}
// </block: runCleanup>


// <block: startPeriodicCleanup>
 export async function startPeriodicCleanup() {
    const intervalHours = _INITS.Sampo_MCP_config?.cleanup?.cleanupIntervalHours || 24;
    const intervalMs = intervalHours * 60 * 60 * 1000;

    log(`Starting periodic cleanup (interval: ${intervalHours} hours)`);

    // Check when we last ran cleanup
    const state = await readCleanupState();
    const now = Date.now();
    const timeSinceLastCleanup = state.lastCleanup ? now - state.lastCleanup : null;

    if (timeSinceLastCleanup === null) {
        // Never run before - run immediately
        log("No previous cleanup found - running initial cleanup");
        runCleanup().catch(err => {
            logError(`Initial cleanup failed: ${err.message}`);
        });
    } else if (timeSinceLastCleanup >= intervalMs) {
        // Last cleanup was too long ago - run now
        const hoursSince = (timeSinceLastCleanup / (60 * 60 * 1000)).toFixed(1);
        log(`Last cleanup was ${hoursSince} hours ago - running cleanup now`);
        runCleanup().catch(err => {
            logError(`Overdue cleanup failed: ${err.message}`);
        });
    } else {
        // Last cleanup was recent enough - schedule next one
        const hoursUntilNext = ((intervalMs - timeSinceLastCleanup) / (60 * 60 * 1000)).toFixed(1);
        log(`Last cleanup was recent (${state.lastCleanupISO}). Next cleanup in ${hoursUntilNext} hours`);
    }

    // Schedule periodic runs
    const intervalId = setInterval(() => {
        runCleanup().catch(err => {
            logError(`Periodic cleanup failed: ${err.message}`);
        });
    }, intervalMs);

    // Return interval ID so it can be cleared if needed
    return intervalId;
}
// </block: startPeriodicCleanup >