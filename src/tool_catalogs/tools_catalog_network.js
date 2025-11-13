// <file_info: tools_catalog_network.js>
/* 
- Project: Sampo-MCP
- File: src/tool_catalogs/tool_catalog_network.js
- Network and Connectivity Tools
- Tools for network diagnostics, connectivity testing, and bandwidth monitoring.
*/
// </file_info: tools_catalog_network.js>


// <block: imports>
import { serverMessageHandler, missingManual } from "../logger.js";
// </block: imports>


// <block: tool_definitions_network_diagnostics>
export const networkTools = {


	// <block: bandwidth_test>
	bandwidth_test: {
		schema: "SchemaBandwidthTest",
		impl: { type: "network", commands: ["bandwidth_test"] },
		description: "Test download bandwidth by fetching a file and measuring transfer speed.",
		tags: ["network", "bandwidth", "speed", "performance", "internet", "download"],
		examples: [
			{ "tool": "bandwidth_test", "args": { "url": "https://speed.cloudflare.com/__down?bytes=1000000" } },  // Updated example with url parameter
			missingManual("bandwidth_test")
		]
	},
	// </block: bandwidth_test>


	// <block: check_port>
	check_port: {
		schema: "SchemaCheckPort",
		impl: { type: "network", commands: ["check_port"] },
		description: "Check if a TCP port is open on a host.",
		tags: ["network", "port", "tcp", "connectivity", "firewall", "service"],
		examples: [
			{ "tool": "check_port", "args": { "url": "google.com", "port": 443 } },  // Changed from "host" to "url"
			missingManual("check_port")
		]
	},
	// </block: check_port>


	// <block: dns_lookup>
	dns_lookup: {
		schema: "SchemaDnsLookup",
		impl: { type: "network", commands: ["dns_lookup"] },
		description: "Perform DNS resolution returning IPv4, IPv6, mail servers, and name servers.",
		tags: ["network", "dns", "domain", "resolution", "lookup", "nameserver"],
		examples: [
			{ "tool": "dns_lookup", "args": { "url": "google.com" } },  // Changed from "hostname" to "url"
			missingManual("dns_lookup")
		]
	},
	// </block: dns_lookup>


	// <block: get_public_ip>
	get_public_ip: {
		schema: "SchemaSingle",
		impl: { type: "network", commands: ["get_public_ip"] },
		description: "Get the public-facing IP address (WAN IP).",
		tags: ["network", "ip", "public", "internet", "wan", "external"],
		examples: [
			{ "tool": "get_public_ip", "args": {} },
			missingManual("get_public_ip")
		]
	},
	// </block: get_public_ip>


	// <block: multi_ping>
	multi_ping: {
		schema: "SchemaMultiPing",
		impl: { type: "network", commands: ["multi_ping"] },
		description: "Perform multiple HTTP pings and calculate statistics including packet loss and response times.",
		tags: ["network", "connectivity", "ping", "statistics", "reliability", "http"],
		examples: [
			{ "tool": "multi_ping", "args": { "urls": ["https://google.com", "https://github.com", "https://cloudflare.com"] } },  // Changed to urls array
			missingManual("multi_ping")
		]
	},
	// </block: multi_ping>


	// <block: network_latency>
	network_latency: {
		schema: "SchemaNetworkLatency",
		impl: { type: "network", commands: ["network_latency"] },
		description: "Measure network latency using system's native ICMP ping.",
		tags: ["network", "latency", "ping", "performance", "icmp", "diagnostics"],
		examples: [
			{ "tool": "network_latency", "args": { "url": "google.com", "count": 5 } },  // Added url parameter
			missingManual("network_latency")
		]
	},
	// </block: network_latency>


	// <block: network_statistics>
	network_statistics: {
		schema: "SchemaSingle",
		impl: { type: "network", commands: ["network_statistics"] },
		description: "Get network protocol statistics including packets, bytes, errors, and connections for TCP, UDP, ICMP.",
		tags: ["network", "statistics", "diagnostics", "monitoring", "netstat", "protocols"],
		examples: [
			{ "tool": "network_statistics", "args": {} },
			missingManual("network_statistics")
		]
	},
	// </block: network_statistics>


	// <block: ping>
	ping: {
		schema: "SchemaPing",
		impl: { type: "network", commands: ["ping"] },
		description: "Test HTTP/HTTPS connectivity and measure response time.",
		tags: ["network", "connectivity", "internet", "ping", "http", "availability"],
		examples: [
			{ "tool": "ping", "args": { "url": "https://www.google.com" } },
			missingManual("ping")
		]
	},
	// </block: ping>


	// <block: scan_ports>
	scan_ports: {
		schema: "SchemaScanPorts",
		impl: { type: "network", commands: ["scan_ports"] },
		description: "Scan TCP ports on a host to discover open ports and running services.",
		tags: ["network", "port", "scan", "security", "diagnostics", "services", "audit"],
		examples: [
			{ "tool": "scan_ports", "args": { "url": "localhost", "start_port": 80, "end_port": 443 } },  // Changed from host to url, added port range
			missingManual("scan_ports")
		]
	},
	// </block: scan_ports>


	// <block: trace_route>
	trace_route: {
		schema: "SchemaTraceRoute",
		impl: { type: "network", commands: ["trace_route"] },
		description: "Trace network path showing intermediate routers and their response times.",
		tags: ["network", "routing", "diagnostics", "traceroute", "path", "hops"],
		examples: [
			{ "tool": "trace_route", "args": { "host": "google.com" } },
			missingManual("trace_route")
		]
	},
	// </block: trace_route>

};

// </block: tool_definitions_network_diagnostics>