// <file_info: api_auth.js>
/* 
- Project: Sampo-MCP
- File: src/api_auth.js 
- API authentication and key management
*/
// </file_info: api_auth.js>


// <block: imports>
import crypto from "node:crypto";
import "dotenv/config";
// </block: imports>


// <block: api_keys_database>
function loadApiKeysFromEnv() {
	const keys = {};
	
	// Find all API_KEY_*_HASH variables
	const hashVars = Object.keys(process.env).filter(key => 
		key.startsWith('API_KEY_') && key.endsWith('_HASH')
	);
	
	hashVars.forEach(hashVar => {
		const keyHash = process.env[hashVar];
		const baseName = hashVar.replace('_HASH', '');
		const nameVar = `${baseName}_NAME`;
		const clientName = process.env[nameVar] || 'Unknown Client';
		
		keys[keyHash] = {
			name: clientName,
			type: clientName.includes('AI') ? 'ai' : 'user'
		};
	});
	
	return keys;
}

// Load keys on startup
const VALID_KEY_HASHES = loadApiKeysFromEnv();
// </block: api_keys_database>


// <block: validate_api_key>
export function validateApiKey(key) {
	if (!key || typeof key !== "string") {
		return null;
	}
	
	// Hash the incoming key
	const keyHash = crypto.createHash('sha256').update(key).digest('hex');
	
	// Check if hash exists in our database
	const clientInfo = VALID_KEY_HASHES[keyHash];
	
	if (!clientInfo) {
		return null;
	}
	
	return {
		name: clientInfo.name,
		type: clientInfo.type
	};
}
// </block: validate_api_key>