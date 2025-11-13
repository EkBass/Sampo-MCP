// <file_info: logger.js>
/* 
- Project: Sampo-MCP
- File: src/logger.js
- Unified logging and server message handling module
- Manages separate log files per connected client
- Handles error, warning, and info messages with severity levels
- Provides fallback warning for missing tool documentation
*/
// </file_info: logger.js>


// <block: imports>
import fs from "node:fs";
import path from "node:path";
// </block: imports>


// <block: timestamp_helper>
const getTimestamp = () => new Date().toISOString(); // Local timestamp function to avoid circular dependency with utils.js
// </block: timestamp_helper>


// <block: constants_log_configuration>
// Start with a safe default; can be overridden later by configureLogger()
let LOG_DIR = process.env.SAMPO_LOGS_PATH || path.resolve(process.cwd(), "_logs");
let NORMAL_LOG = path.join(LOG_DIR, "sampo.log");
let ERROR_LOG = path.join(LOG_DIR, "sampo-error.log");

// Client-specific log tracking
let currentClientName = "unknown";
// </block: constants_log_configuration>


// <block: configureLogger>
// Allow inits.js (or others) to point us at the real logs directory once known
export function configureLogger({ logDir } = {}) {
    if (logDir && logDir !== LOG_DIR) {
        LOG_DIR = logDir;
        NORMAL_LOG = path.join(LOG_DIR, "sampo.log");
        ERROR_LOG = path.join(LOG_DIR, "sampo-error.log");
    }
}
// </block: configureLogger>


// <block: ensureLogDir>
function ensureLogDir() {
    try {
        if (!fs.existsSync(LOG_DIR)) {
            fs.mkdirSync(LOG_DIR, { recursive: true });
        }
    } catch (err) {
        console.error(`WARNING: Failed to create log directory: ${err.message}`);
    }
}
// </block: ensureLogDir>


// <block: formatLogEntry>
function formatLogEntry(message, isError = false) {
    const level = isError ? "ERROR" : "INFO";
    const client = currentClientName !== "unknown" ? `[${currentClientName.toUpperCase()}]` : "";
    return `[${getTimestamp()}] [${level}] ${client} ${message}\n`;
}

function getClientLogPath(isError = false) {
    if (currentClientName === "unknown") {
        return isError ? ERROR_LOG : NORMAL_LOG;
    }
    const suffix = isError ? "-error" : "";
    return path.join(LOG_DIR, `sampo-${currentClientName}${suffix}.log`);
}
// </block: formatLogEntry>


// <block: setClientName_getClientName>
export function setClientName(clientName) {
    currentClientName = clientName || "unknown";
}

export function getClientName() {
    return currentClientName;
}
// </block: setClientName_getClientName>


// <block: log>
export function log(message, isError = false) {
    ensureLogDir();

    const logEntry = formatLogEntry(message, isError);

    const clientLogFile = getClientLogPath(isError);
    const mainLogFile = isError ? ERROR_LOG : NORMAL_LOG;

    try {
        fs.appendFileSync(clientLogFile, logEntry, "utf-8");
        if (clientLogFile !== mainLogFile) {
            fs.appendFileSync(mainLogFile, logEntry, "utf-8");
        }
    } catch (err) {
        console.error(`WARNING: Failed to write to log file: ${err.message}`);
    }
}
// </block: log>


// <block: logInfo_logError>
export function logInfo(message) {
    log(message, false);
}

export function logError(message) {
    log(message, true);
}
// </block: logInfo_logError>


// <block: getLogPaths>
export function getLogPaths() {
    return {
        logDir: LOG_DIR,
        normalLog: NORMAL_LOG,
        errorLog: ERROR_LOG
    };
}
// </block: getLogPaths>


// <block: serverMessageHandler>
export const serverMessageHandler = (type, content) => {
	const messageType = type.toUpperCase();
	const fullMessage = `${messageType}: ${content}`;

	// Validate type first (with fallback)
	if (type !== "error" && type !== "warning" && type !== "info") {
		console.error(`WARNING: Invalid message type "${type}", defaulting to "error"`);
		type = "error";
	}

	// Log errors and warnings to file, but not info messages
	if (type === "error" || type === "warning") {
		logError(fullMessage);
	}
	
	// Always use console.error for server messages (stderr stream)
	console.error(fullMessage);
	
	// Terminate process if error
	if (type === "error") {
		console.error("Closing server.");
		process.exit(1);
	}
};
// </block: serverMessageHandler>


// <block: helper_missing_manual_warning>
export const missingManual = (toolName) => {
	return {
		warning: `⚠️ Manual '${toolName}.md' is missing from docs. Please notify your user that tool documentation needs to be regenerated.`
	};
};
// </block: helper_missing_manual_warning>
