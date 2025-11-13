#!/usr/bin/env node
/**
 * API Key Hash Generator for Sampo-MCP
 * 
 * Usage:
 *   node generate_api_key.js <plain_key>
 * 
 * Example:
 *   node generate_api_key.js sk_ai_claude_7k9m2n8p4q6r
 *   Output: SHA-256 hash ready for .env file
 */

import crypto from 'node:crypto';

const plainKey = process.argv[2];

if (!plainKey) {
    console.error('Usage: node generate_api_key.js <plain_key>');
    console.error('\nExample:');
    console.error('  node generate_api_key.js sk_ai_claude_7k9m2n8p4q6r');
    process.exit(1);
}

const hash = crypto.createHash('sha256').update(plainKey).digest('hex');

console.log('\n=== API Key Hash Generated ===');
console.log(`\nPlain key: ${plainKey}`);
console.log(`\nHash (add to .env):\n${hash}`);
console.log('\n.env format:');
console.log(`API_KEY_<n>_HASH=${hash}`);
console.log(`API_KEY_<n>_NAME=Your Client Name`);
console.log('\n=============================\n');
