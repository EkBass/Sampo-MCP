// <file_info: tools_network.js>
/*
- Project: Sampo-MCP
- File: src/tool_implementations/tool_network.js
- Network-related tools (ping, connectivity tests, network info)
*/
// </file_info: tools_network.js>


// <block: imports>
import { createConnection } from "node:net";
import { promises as dns } from "node:dns";
import { _INITS } from "../inits.js";
import { exec, createError, createResponse, requireParam } from "../utils.js";
// </block: imports>







// <block: helper_createTimeoutController>
const createTimeoutController = (timeoutMs) => {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
	
	return {
		controller,
		signal: controller.signal,
		clear: () => clearTimeout(timeoutId)
	};
};
// </block: helper_createTimeoutController>


// <block: helper_fetchWithTimeout>
const fetchWithTimeout = async (url, timeoutMs, options = {}) => {
	const { controller, signal, clear } = createTimeoutController(timeoutMs);
	
	try {
		const response = await fetch(url, { ...options, signal });
		clear();
		return response;
	} catch (err) {
		clear();
		if (err.name === "AbortError") {
			throw createError("TIMEOUT", `Request timeout after ${timeoutMs}ms`, { url, timeout: timeoutMs });
		}
		throw err;
	}
};

// <block: helper_extractHostname>
const extractHostname = (urlString) => {
	try {
		// Remove protocol if present
		let cleaned = urlString.replace(/^https?:\/\//, '');
		// Remove port if present
		cleaned = cleaned.split(':')[0];
		// Remove path if present
		cleaned = cleaned.split('/')[0];
		// Remove query string if present
		cleaned = cleaned.split('?')[0];
		return cleaned;
	} catch (err) {
		// If all else fails, return the original string
		return urlString;
	}
};
// </block: helper_extractHostname>


// </block: helper_fetchWithTimeout>


// <block: helper_executePing>
const executePing = async (url, timeout) => {
	const startTime = Date.now();
	const response = await fetchWithTimeout(url, timeout, { method: "HEAD", redirect: "follow" });
	const responseTime = Date.now() - startTime;
	
	return {
		response,
		responseTime,
		statusCode: response.status,
		statusText: response.statusText,
		isOnline: response.ok
	};
};
// </block: helper_executePing>


// <block: helper_parsePingStats>
const parsePingStats = (stdout, isWindows) => {
	let min = null, avg = null, max = null;
	
	if (isWindows) {
		const match = stdout.match(/Minimum = (\d+)ms, Maximum = (\d+)ms, Average = (\d+)ms/);
		if (match) {
			min = parseFloat(match[1]);
			max = parseFloat(match[2]);
			avg = parseFloat(match[3]);
		}
	} else {
		const match = stdout.match(/min\/avg\/max\/[^ ]+ = ([\d.]+)\/([\d.]+)\/([\d.]+)/);
		if (match) {
			min = parseFloat(match[1]);
			avg = parseFloat(match[2]);
			max = parseFloat(match[3]);
		}
	}
	
	return { min, avg, max };
};
// </block: helper_parsePingStats>


// <block: helper_calculateBandwidth>
const calculateBandwidth = (bytesReceived, durationMs) => {
	const durationSeconds = durationMs / 1000;
	return {
		bytes_received: bytesReceived,
		duration_seconds: durationSeconds.toFixed(2),
		speed_mbps: ((bytesReceived * 8) / 1000000 / durationSeconds).toFixed(2),
		speed_mbytes_per_sec: (bytesReceived / 1000000 / durationSeconds).toFixed(2)
	};
};
// </block: helper_calculateBandwidth>


// <block: helper_async_multiPing>
export async function multiPing(url, count = 4, timeout = 5000) {
	const results = [];
	
	for (let i = 0; i < count; i++) {
		const startTime = Date.now();
		try {
			await fetchWithTimeout(url, timeout, { method: "HEAD", redirect: "follow" });
			const responseTime = Date.now() - startTime;
			results.push({ success: true, time: responseTime });
		} catch (err) {
			results.push({ success: false, time: null, error: err.message });
		}
		
		// Small delay between pings
		if (i < count - 1) {
			await new Promise(resolve => setTimeout(resolve, 100));
		}
	}
	
	const successful = results.filter(r => r.success);
	const times = successful.map(r => r.time);
	
	return {
		sent: count,
		received: successful.length,
		lost: count - successful.length,
		loss_percent: ((count - successful.length) / count * 100).toFixed(1),
		min: times.length > 0 ? Math.min(...times) : null,
		max: times.length > 0 ? Math.max(...times) : null,
		avg: times.length > 0 ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1) : null,
		results
	};
}
// </block: helper_async_multiPing>


// <block: helper_async_checkPort>
export async function checkPort(host, port, timeout = 3000) {
	return new Promise((resolve) => {
		const socket = createConnection({ host, port, timeout });
		
		const cleanup = (result) => {
			socket.destroy();
			resolve(result);
		};

		socket.setTimeout(timeout);
		socket.once('error', () => cleanup(false));
		socket.once('timeout', () => cleanup(false));
		socket.once('connect', () => cleanup(true));
	});
}
// </block: helper_async_checkPort>


// <block: helper_async_resolveDNS>
export async function resolveDNS(hostname) {
	try {
		const [ipv4, ipv6, mx, ns] = await Promise.allSettled([
			dns.resolve4(hostname),
			dns.resolve6(hostname),
			dns.resolveMx(hostname),
			dns.resolveNs(hostname)
		]);

		return {
			ipv4: ipv4.status === 'fulfilled' ? ipv4.value : null,
			ipv6: ipv6.status === 'fulfilled' ? ipv6.value : null,
			mx_records: mx.status === 'fulfilled' ? mx.value : null,
			name_servers: ns.status === 'fulfilled' ? ns.value : null,
			timestamp: new Date().toISOString()
		};
	} catch (err) {
		throw new Error(`DNS lookup failed: ${err.message}`);
	}
}
// </block: helper_async_resolveDNS>


// <block: tool_factory_network>
export const makeNetworkTool = (commands) => async (_args, ctx) => {
	const { clientReturn } = ctx;
	const cmd = commands[0];

	switch (cmd) {

		// <block: case_bandwidth_test>
		case "bandwidth_test": {
			const testUrl = _args?.url;  // Changed from test_url to match schema
			const size = _args?.size || 1048576;  // Use size parameter from schema

			try {
				requireParam(testUrl, "url");
				
				// Append size parameter to URL if it's the cloudflare default
				const finalUrl = testUrl || `https://speed.cloudflare.com/__down?bytes=${size}`;
				
				const startTime = Date.now();
				const response = await fetchWithTimeout(finalUrl, 60000);

				if (!response.ok) {
					throw new Error(`HTTP ${response.status}: ${response.statusText}`);
				}

				const buffer = await response.arrayBuffer();
				const duration = Date.now() - startTime;
				const stats = calculateBandwidth(buffer.byteLength, duration);

				return clientReturn(createResponse(
					"Bandwidth test completed",
					{ ...stats, test_url: finalUrl }
				));
			} catch (err) {
				return clientReturn(err.type ? err : createError("BANDWIDTH_TEST_FAILED", err.message));
			}
		}
		// </block: case_bandwidth_test>


		// <block: case_check_port>
		case "check_port": {
			const host = _args?.url;  // Changed from _args?.host to match schema
			const port = _args?.port;
			const timeout = _args?.timeout || 5000;  // Changed default to match schema

			try {
				requireParam(host, "host", "MISSING_PARAMS");
				requireParam(port, "port", "MISSING_PARAMS");

				// Extract hostname from URL (remove protocol, port, path)
				const hostname = extractHostname(host);

				const isOpen = await checkPort(hostname, port, timeout);
				
				return clientReturn(createResponse(
					`Port ${port} is ${isOpen ? 'open' : 'closed'}`,
					{
						url: host,  // Original URL provided by user
						hostname,   // Extracted hostname that was checked
						port,
						is_open: isOpen,
						status: isOpen ? 'open' : 'closed'
					}
				));
			} catch (err) {
				const hostname = extractHostname(host);
				return clientReturn(err.type ? err : createError("PORT_CHECK_FAILED", err.message, { url: host, hostname, port }));
			}
		}
		// </block: case_check_port>


		// <block: case_dns_lookup>
		case "dns_lookup": {
			const urlInput = _args?.url;  // Changed from _args?.hostname to match schema

			try {
				requireParam(urlInput, "url");
				
				// Extract hostname from URL (remove protocol, port, path)
				const hostname = extractHostname(urlInput);
				
				const result = await resolveDNS(hostname);
				
				return clientReturn(createResponse(
					`DNS lookup completed for ${hostname}`,
					{ url: urlInput, hostname, ...result }
				));
			} catch (err) {
				const hostname = extractHostname(urlInput);
				return clientReturn(err.type ? err : createError("DNS_LOOKUP_FAILED", err.message, { url: urlInput, hostname }));
			}
		}
		// </block: case_dns_lookup>


		// <block: case_get_network_info>
		case "get_network_info": {
			try {
				const command = _INITS.win ? 'ipconfig' : 'ifconfig';
				const { stdout, stderr } = await exec(command);
				
				if (stderr) {
					throw new Error(stderr);
				}
				
				let adapters = [];
				
				if (_INITS.win) {
					const adapterBlocks = stdout.split('adapter ');
					
					for (const block of adapterBlocks.slice(1)) {
						const lines = block.split('\r\n');
						const name = lines[0].replace(':', '').trim();
						const adapter = { name, status: null, ipv4: null, ipv6: null, gateway: null, mac: null };
						
						for (const line of lines) {
							if (line.includes('Media State')) adapter.status = line.split(':')[1]?.trim();
							if (line.includes('IPv4 Address')) adapter.ipv4 = line.split(':')[1]?.trim().replace('(Preferred)', '').trim();
							if (line.includes('IPv6 Address')) adapter.ipv6 = line.split(':')[1]?.trim().replace('(Preferred)', '').trim();
							if (line.includes('Default Gateway')) adapter.gateway = line.split(':')[1]?.trim();
							if (line.includes('Physical Address')) adapter.mac = line.split(':')[1]?.trim();
						}
						
						if (adapter.status === 'Media disconnected' && !adapter.ipv4) continue;
						adapters.push(adapter);
					}
				} else {
					const blocks = stdout.split('\n\n');
					for (const block of blocks) {
						if (!block.trim()) continue;
						const lines = block.split('\n');
						const name = lines[0].split(':')[0].trim();
						const adapter = { name, status: 'up', ipv4: null, ipv6: null, mac: null };
						
						for (const line of lines) {
							if (line.includes('inet ') && !line.includes('inet6')) {
								const match = line.match(/inet\s+(\S+)/);
								if (match) adapter.ipv4 = match[1];
							}
							if (line.includes('inet6')) {
								const match = line.match(/inet6\s+(\S+)/);
								if (match) adapter.ipv6 = match[1];
							}
							if (line.includes('ether')) {
								const match = line.match(/ether\s+(\S+)/);
								if (match) adapter.mac = match[1];
							}
						}
						
						adapters.push(adapter);
					}
				}
				
				return clientReturn(createResponse(
					"Network information retrieved",
					{ 
						adapters,
						adapter_count: adapters.length
					}
				));
			} catch (err) {
				return clientReturn(createError("EFAIL", err.message));
			}
		}
		// </block: case_get_network_info>


		// <block: case_get_public_ip>
		case "get_public_ip": {
			try {
				const services = [
					'https://api.ipify.org?format=json',
					'https://api.my-ip.io/ip.json',
					'https://ifconfig.me/ip'
				];

				let ipData = null;
				let service = null;

				for (const url of services) {
					try {
						const response = await fetchWithTimeout(url, 10000);
						if (response.ok) {
							const text = await response.text();
							service = url;

							try {
								const json = JSON.parse(text);
								ipData = json.ip || json.ipAddress || text.trim();
							} catch {
								ipData = text.trim();
							}
							break;
						}
					} catch (err) {
						continue;
					}
				}

				if (!ipData) {
					throw new Error("Failed to retrieve public IP from all services");
				}

				return clientReturn(createResponse(
					"Public IP retrieved",
					{
						public_ip: ipData,
						service: service,
						timestamp: new Date().toISOString()
					}
				));
			} catch (err) {
				return clientReturn(err.type ? err : createError("PUBLIC_IP_FAILED", err.message));
			}
		}
		// </block: case_get_public_ip>


		// <block: case_multi_ping>
		case "multi_ping": {
			const urls = _args?.urls;  // Changed to match schema - expects array of URLs
			const timeout = _args?.timeout || 5000;

			try {
				requireParam(urls, "urls");
				
				if (!Array.isArray(urls)) {
					throw createError("INVALID_PARAMS", "urls must be an array");
				}
				
				if (urls.length === 0 || urls.length > 10) {
					throw createError("INVALID_PARAMS", "urls array must contain 1-10 URLs");
				}
				
				const results = [];
				
				// Ping each URL once
				for (const url of urls) {
					const startTime = Date.now();
					let result = {
						url,
						success: false,
						response_time_ms: null,
						status_code: null,
						error: null
					};
					
					try {
						const { response, responseTime, statusCode, isOnline } = await executePing(url, timeout);
						result.success = isOnline;
						result.response_time_ms = responseTime;
						result.status_code = statusCode;
					} catch (err) {
						result.error = err.message;
					}
					
					results.push(result);
				}
				
				// Calculate statistics
				const successful = results.filter(r => r.success);
				const times = successful.map(r => r.response_time_ms).filter(t => t !== null);
				
				const stats = {
					urls_tested: urls.length,
					successful: successful.length,
					failed: urls.length - successful.length,
					success_rate: ((successful.length / urls.length) * 100).toFixed(1) + '%',
					min_ms: times.length > 0 ? Math.min(...times) : null,
					max_ms: times.length > 0 ? Math.max(...times) : null,
					avg_ms: times.length > 0 ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1) : null,
					results
				};
				
				return clientReturn(createResponse(
					`Completed pinging ${urls.length} URL(s)`,
					stats
				));
			} catch (err) {
				return clientReturn(err.type ? err : createError("MULTI_PING_FAILED", err.message));
			}
		}
		// </block: case_multi_ping>


		// <block: case_network_latency>
		case "network_latency": {
			const host = _args?.url;  // Changed from _args?.host to match schema
			const count = _args?.count || 5;

			try {
				requireParam(host, "url");
				
				// Extract hostname from URL (remove protocol, port, path)
				const hostname = extractHostname(host);
				
				const command = _INITS.win 
					? `ping -n ${count} ${hostname}`
					: `ping -c ${count} ${hostname}`;
				
				const { stdout } = await exec(command);
				const { min, avg, max } = parsePingStats(stdout, _INITS.win);

				return clientReturn(createResponse(
					`Network latency test completed for ${hostname}`,
					{
						url: host,  // Original URL provided by user
						hostname,   // Extracted hostname that was pinged
						ping_count: count,
						min_ms: min,
						avg_ms: avg,
						max_ms: max,
						raw_output: stdout,
						timestamp: new Date().toISOString()
					}
				));
			} catch (err) {
				// Try to extract hostname for better error reporting
				const hostname = extractHostname(host);
				return clientReturn(err.type ? err : createError("LATENCY_TEST_FAILED", err.message, { url: host, hostname, count }));
			}
		}
		// </block: case_network_latency>


		// <block: case_network_statistics>
		case "network_statistics": {
			try {
				const command = _INITS.win ? 'netstat -e' : 'netstat -s';
				const { stdout } = await exec(command);

				return clientReturn(createResponse(
					"Network statistics retrieved",
					{
						statistics: stdout,
						timestamp: new Date().toISOString()
					}
				));
			} catch (err) {
				return clientReturn(createError("STATISTICS_FAILED", err.message));
			}
		}
		// </block: case_network_statistics>


		// <block: case_ping>
		case "ping": {
			const url = _args?.url;
			const timeout = _args?.timeout || 5000;

			try {
				requireParam(url, "url");

				if (timeout < 100 || timeout > 30000) {
					throw createError(
						"INVALID_TIMEOUT",
						"timeout must be between 100 and 30000 milliseconds"
					);
				}

				const { response, responseTime, statusCode, statusText, isOnline } = await executePing(url, timeout);

				return clientReturn(createResponse(
					"Ping successful",
					{
						url: url,
						status_code: statusCode,
						status_text: statusText,
						response_time_ms: responseTime,
						is_online: isOnline,
						headers: {
							content_type: response.headers.get("content-type"),
							content_length: response.headers.get("content-length"),
						}
					}
				));
			} catch (err) {
				return clientReturn(err.type ? err : createError("CONNECTION_FAILED", err.message, { url }));
			}
		}
		// </block: case_ping>


		// <block: case_scan_ports>
		case "scan_ports": {
			const host = _args?.url;  // Changed from _args?.host to match schema
			const startPort = _args?.start_port;  // Changed to match schema
			const endPort = _args?.end_port;  // Changed to match schema
			const timeout = _args?.timeout || 1000;

			try {
				requireParam(host, "url");
				requireParam(startPort, "start_port");
				requireParam(endPort, "end_port");
				
				if (startPort > endPort) {
					throw createError("INVALID_RANGE", "start_port must be less than or equal to end_port");
				}
				
				// Extract hostname from URL (remove protocol, port, path)
				const hostname = extractHostname(host);
				
				// Create port range array
				const ports = [];
				for (let port = startPort; port <= endPort; port++) {
					ports.push(port);
				}
				
				// Limit scan to reasonable number
				if (ports.length > 100) {
					throw createError("RANGE_TOO_LARGE", "Port range too large (max 100 ports)");
				}

				const results = [];
				for (const port of ports) {
					try {
						const isOpen = await checkPort(hostname, port, timeout);
						if (isOpen) {
							results.push({ port, status: 'open' });
						}
					} catch (err) {
						// Port closed or filtered
					}
				}

				return clientReturn(createResponse(
					`Scanned ${ports.length} ports on ${hostname}`,
					{
						url: host,  // Original URL provided by user
						hostname,   // Extracted hostname that was scanned
						port_range: `${startPort}-${endPort}`,
						ports_scanned: ports.length,
						open_ports: results.length,
						results
					}
				));
			} catch (err) {
				const hostname = extractHostname(host);
				return clientReturn(err.type ? err : createError("PORT_SCAN_FAILED", err.message, { url: host, hostname }));
			}
		}
		// </block: case_scan_ports>


		// <block: case_trace_route>
		case "trace_route": {
			const host = _args?.url;  // Changed from _args?.host to match schema
			const maxHops = _args?.max_hops || 30;

			try {
				requireParam(host, "url");

				// Extract hostname from URL (remove protocol, port, path)
				const hostname = extractHostname(host);

				const command = _INITS.win 
					? `tracert -h ${maxHops} ${hostname}`
					: `traceroute -m ${maxHops} ${hostname}`;
				
				const { stdout } = await exec(command, { timeout: 60000 });
				
				return clientReturn(createResponse(
					`Trace route completed to ${hostname}`,
					{
						url: host,  // Original URL provided by user
						hostname,   // Extracted hostname that was traced
						max_hops: maxHops,
						trace: stdout,
						timestamp: new Date().toISOString()
					}
				));
			} catch (err) {
				const hostname = extractHostname(host);
				return clientReturn(err.type ? err : createError("TRACE_ROUTE_FAILED", err.message, { url: host, hostname, max_hops: maxHops }));
			}
		}
		// </block: case_trace_route>


		default:
			return clientReturn(createError("UNKNOWN_NETWORK_TOOL", `Unknown network tool: ${cmd}`));
	}
};
// </block: tool_factory_network>
