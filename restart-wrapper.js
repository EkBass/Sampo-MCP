#!/usr/bin/env node

/**
 * Sampo-MCP Restart Wrapper (ES Module Version)
 * 
 * Manages automatic server restarts when exit code 42 is received.
 * Works cross-platform (Windows, Linux, macOS).
 * 
 * Usage: node restart-wrapper.js
 */

import { spawn, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FILE_MAP_GENERATOR = join(__dirname, 'src', 'generators', 'file_map_generator.js');
const SERVER_PATH = join(__dirname, 'src', 'server.js');
const RESTART_CODE = 42;
const RESTART_DELAY_MS = 1000;

let restartCount = 0;
let startTime = Date.now();

function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

function generateFilePaths() {
    console.error('\n--- Generating file_paths.js ---');
    
    const result = spawnSync('node', [FILE_MAP_GENERATOR], {
        cwd: __dirname,
        stdio: 'inherit',
        env: { ...process.env }
    });
    
    if (result.error) {
        console.error('Failed to generate file paths:', result.error.message);
        process.exit(1);
    }
    
    if (result.status !== 0) {
        console.error(`File path generation failed with exit code: ${result.status}`);
        process.exit(1);
    }
    
    console.error('--- file_paths.js generated successfully ---\n');
}

function startServer() {
    const serverStartTime = Date.now();
    
    console.error(`\n${'='.repeat(60)}`);
    console.error(`Starting Sampo-MCP Server...`);
    console.error(`   Time: ${new Date().toLocaleString()}`);
    if (restartCount > 0) {
        console.error(`   Restart #${restartCount}`);
        console.error(`   Total uptime: ${formatUptime(Date.now() - startTime)}`);
    }
    console.error(`${'='.repeat(60)}\n`);
    
    const child = spawn('node', [SERVER_PATH], {
        stdio: 'inherit',
        cwd: __dirname,
        env: { ...process.env, SAMPO_WRAPPER: 'true' }
    });
    
    child.on('error', (err) => {
        console.error('\nFailed to start server:', err.message);
        process.exit(1);
    });
    
    child.on('exit', (code, signal) => {
        const uptimeMs = Date.now() - serverStartTime;
        const uptime = formatUptime(uptimeMs);
        
        console.error(`\n${'='.repeat(60)}`);
        
        if (signal) {
            console.error(`Server killed by signal: ${signal}`);
            console.error(`   Uptime: ${uptime}`);
            console.error(`${'='.repeat(60)}\n`);
            process.exit(1);
        }
        
        if (code === RESTART_CODE) {
            restartCount++;
            console.error(`Restart requested (exit code ${RESTART_CODE})`);
            console.error(`   Session uptime: ${uptime}`);
            console.error(`   Restarting in ${RESTART_DELAY_MS}ms...`);
            console.error(`${'='.repeat(60)}`);
            
            setTimeout(startServer, RESTART_DELAY_MS);
        } else if (code === 0) {
            console.error(`Server shut down gracefully`);
            console.error(`   Uptime: ${uptime}`);
            console.error(`   Total restarts: ${restartCount}`);
            console.error(`${'='.repeat(60)}\n`);
            process.exit(0);
        } else {
            console.error(`Server crashed with exit code: ${code}`);
            console.error(`   Uptime: ${uptime}`);
            console.error(`${'='.repeat(60)}\n`);
            process.exit(code);
        }
    });
}

// Handle wrapper termination signals
process.on('SIGINT', () => {
    console.error('\n\n  Wrapper received SIGINT - shutting down...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.error('\n\n️  Wrapper received SIGTERM - shutting down...');
    process.exit(0);
});

// Start the server
console.error('🚀 Sampo-MCP Restart Wrapper initialized');
console.error(`   File map generator: ${FILE_MAP_GENERATOR}`);
console.error(`   Server path: ${SERVER_PATH}`);
console.error(`   Restart code: ${RESTART_CODE}`);

// Generate file_paths.js before starting server
//generateFilePaths();

startServer();
