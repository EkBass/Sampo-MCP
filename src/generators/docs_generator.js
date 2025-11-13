// <file_info: docs_generator.js>
/* 
	- Project: Sampo-MCP
	- File: src/generators/docs_generator.js
	- Tool Documentation Loader
	- Loads and parses external documentation for tools
*/
// </file_info: docs_generator.js>


// <block: imports>
import fs from 'fs/promises';
import path from 'path';
// removed: import yaml from 'yaml';
import { _INITS } from '../inits.js';
import { serverMessageHandler } from '../logger.js';
// </block: imports>


// <block: parse_yaml>
function parseYamlDoc(content) {
	const doc = {
		description: '',
		content: '',
		// keep examples/tags/note even if empty for compatibility
		examples: [],
		tags: [],
		note: '',
	};

	try {
		// Split content into lines
		const lines = content.split(/\r?\n/);
		
		// Find the tool_description line
		const descIndex = lines.findIndex(line => /^\s*tool_description:/.test(line));
		
		if (descIndex !== -1) {
			// Extract description from the tool_description line
			const descLine = lines[descIndex];
			const colonIndex = descLine.indexOf(':');
			doc.description = descLine.slice(colonIndex + 1).trim();
			
			// Everything after the tool_description line is content
			doc.content = lines.slice(descIndex + 1).join('\n').trim();
		} else {
			// No tool_description line - entire file is content
			doc.content = content.trim();
		}

	} catch (e) {
		serverMessageHandler('warning', `[Doc Loader] Error parsing document: ${e.message}`);
	}

	return doc;
}
// </block: parse_yaml>



// <block: find_tool_doc_path>
async function findToolDocPath(toolName) {
	const docsPath = _INITS.toolDocsPath;
	
	try {
		// Get all catalog subdirectories
		const catalogs = await fs.readdir(docsPath, { withFileTypes: true });
		const catalogDirs = catalogs.filter(item => item.isDirectory()).map(item => item.name);
		
		// Search each catalog for the tool doc
		for (const catalog of catalogDirs) {
			const catalogPath = path.join(docsPath, catalog);
			
			// Check for .yaml file
			const yamlPath = path.join(catalogPath, `${toolName}.yaml`);
			try {
				await fs.access(yamlPath);
				return { path: yamlPath, format: 'yaml', catalog };
			} catch {}
		}
	} catch (error) {
		// serverMessageHandler('warning', `[Doc Loader] Error searching catalogs: ${error.message}`);
	}
	
	return null;
}
// </block: find_tool_doc_path>


// <block: load_tool_doc_minimal_helper>
async function loadToolDocMinimal(toolName) {
	const docInfo = await findToolDocPath(toolName);
	if (!docInfo) return null;

	try {
		const content = await fs.readFile(docInfo.path, 'utf8');
		const doc = { description: '', content: '', tags: [] };

		// Extract QUICK-GUIDE section if present (keeps it simple)
		const quickGuideMatch = content.match(/# QUICK-GUIDE\s*([\s\S]*?)\s*# \/QUICK-GUIDE/);
		if (quickGuideMatch) {
			const quickText = quickGuideMatch[1];

			// Try to extract a description line inside the QUICK-GUIDE (e.g. "description: ...")
			const descMatch = quickText.match(/^[ \t]*description:\s*(.+)$/m);
			if (descMatch) {
				doc.description = descMatch[1].trim();
			} else {
				// fallback: first non-empty line inside QUICK-GUIDE
				const firstLine = quickText.split(/\r?\n/).map(l => l.trim()).find(l => l.length > 0);
				if (firstLine) doc.description = firstLine;
			}

			// Try to extract tags: "tags: [a, b]" or "tags: tag1, tag2" or multiple "tags:" lines
			const tagsLine = quickText.match(/^[ \t]*tags:\s*(.+)$/m);
			if (tagsLine) {
				// simple split on comma if present, else single tag
				const raw = tagsLine[1].trim().replace(/^\[|\]$/g, '');
				doc.tags = raw.split(',').map(t => t.trim()).filter(Boolean);
			}
		} else {
			// No QUICK-GUIDE — try to find a tool_description line in the file (compat with full parser)
			const descLineMatch = content.match(/^[ \t]*tool_description:\s*(.*)$/m);
			if (descLineMatch) {
				doc.description = descLineMatch[1].trim();
			}
		}

		return doc;
	} catch (error) {
		// serverMessageHandler('warning', `[Doc Loader] Error reading ${toolName}.yaml: ${error.message}`);
		return null;
	}
}
// </block: load_tool_doc_minimal_helper>



// <block: load_all_docs>
export async function loadAllDocs() {
	const docsPath = _INITS.toolDocsPath;
	const docs = new Map();
	
	serverMessageHandler('info', `[Doc Loader] Looking for docs in: ${docsPath}`);
	
	try {
		// Get all catalog subdirectories
		const catalogs = await fs.readdir(docsPath, { withFileTypes: true });
		const catalogDirs = catalogs.filter(item => item.isDirectory()).map(item => item.name);
		
		serverMessageHandler('info', `[Doc Loader] Found ${catalogDirs.length} catalog folders: ${catalogDirs.join(', ')}`);
		
		// Get unique tool names from all catalogs
		const toolNames = new Set();
		
		for (const catalog of catalogDirs) {
			const catalogPath = path.join(docsPath, catalog);
			const files = await fs.readdir(catalogPath);
			
			for (const file of files) {
				if (file === 'README.md' || file === 'README.txt' || file === 'README.yaml') {
					// serverMessageHandler('info', `[Doc Loader] Skipping ${file} in ${catalog} (meta-documentation)`);
					continue;
				}
				
				if (file.endsWith('.yaml')) {
					const toolName = file.replace(/\.yaml$/, '');
					toolNames.add(toolName);
				}
			}
		}
		
		serverMessageHandler('info', `[Doc Loader] Found ${toolNames.size} unique tools across all catalogs`);
		
		// Load docs for each unique tool
		for (const toolName of toolNames) {
			const doc = await loadToolDocMinimal(toolName);
			if (doc) {
				docs.set(toolName, doc);
				// serverMessageHandler('info', `[Doc Loader] ✓ Loaded ${toolName} - description length: ${doc.description?.length || 0}`);
			}
		}
		
		serverMessageHandler('info', `[Doc Loader] Loaded ${docs.size} tool documentation files (minimal mode)`);
		return docs;
	} catch (error) {
		serverMessageHandler('warning', `[Doc Loader] Error loading docs: ${error.message}`);
		if (error.code !== 'ENOENT') {
			serverMessageHandler('warning', `[Doc Loader] WARNING: ${error.message}`);
		}
		return docs;
	}
}
// </block: load_all_docs>


// <block: load_tool_doc_full>
export async function loadToolDocFull(toolName) {
	const docInfo = await findToolDocPath(toolName);
	if (!docInfo) return null;
	
	try {
		const content = await fs.readFile(docInfo.path, 'utf8');
		const doc = parseYamlDoc(content); // Full parse with examples
		// serverMessageHandler('info', `[Doc Loader] Loaded FULL docs for ${toolName} (yaml) - ${doc.examples.length} examples`);
		return doc;
	} catch (error) {
		// serverMessageHandler('warning', `[Doc Loader] Error loading full docs for ${toolName}: ${error.message}`);
		return null;
	}
}
// </block: load_tool_doc_full>


// <block: merge_docs>
export function mergeToolDocs(catalogEntry, externalDocs) {
	if (!externalDocs) {
		return catalogEntry; // No external docs, use catalog as-is
	}

	return {
		...catalogEntry,
		// External docs override hardcoded
		description: externalDocs.description || catalogEntry.description,
		// keep examples/tags if present, otherwise fall back to catalog
		examples: (externalDocs.examples && externalDocs.examples.length) ? externalDocs.examples : (catalogEntry.examples || []),
		note: externalDocs.note || catalogEntry.note,
		tags: (externalDocs.tags && externalDocs.tags.length) ? externalDocs.tags : (catalogEntry.tags || []),
	};
}
// </block: merge_docs>
