# Note:

At its current state, Sampo-MCP is developed with Claude AI and using it with other AI applications still requires a bit of tweaking


# Take Sampo-MCP in use:

1. Set proper path to your Sampo-MCP root at package.json ->  "installRoot": "D:\\Sampo-MCP",
2. Rename "env" as ".env"
3. Adjust "devMode" true/false depending if you want AI to access Sampo source.
4. Read "\Sampo-docs\Tool-docs" and "\Sampo-docs\Dev-docs"

# Sampo-MCP about

**A comprehensive workspace-centric MCP server for AI assistants**

## Introduction

Sampo-MCP emerged from hands-on exploration of the Model Context Protocol (MCP) and experimentation with various Claude-compatible tools. After playing around with existing solutions, I decided to build something tailored to my own workflow and philosophy: workspace on your computer that AI can interact with naturally and powerfully.

## Current State

This project is actively evolving and somewhat "self-discovering" - the architecture and features are being refined through real-world use. Major structural changes may occur as the system matures. Built in my free time for personal use and exploration, Sampo-MCP prioritizes functionality and learning over rigid timelines.

**Key Features:**
- **65+ specialized tools** across 8 categories (blocks, files, editing, network, system, npm, search, environment)
- **Block-based code editing** using named markers for precise, refactoring-resistant modifications
- **Dual operation modes**: restricted production mode and unrestricted development mode
- **Dynamic HTML GUI** for human interaction alongside AI access
- **Comprehensive system introspection** - CPU, RAM, disk, network, GPU info
- **Built for Windows**, with Linux compatibility as a testing priority

## Roadmap

### Upcoming Features
- **Email & Calendar Integration**: POP3 support and full Google Calendar functionality (read, edit, add, delete)
- **Code Execution**: Direct Node.js and Python program execution (pending security framework)
- **OpenAI Protocol Support**: Tool ID compatibility and deployment documentation

## Contributing

All contributions are welcome! I'm especially interested in:
- **Linux testing and compatibility reports** - this is the biggest gap right now
- Bug reports and feature suggestions
- Documentation improvements
- Code reviews and architectural feedback

## Philosophy

This is a passion project built for learning and practical use. I don't stress about perfection - the goal is to create something genuinely useful while enjoying the journey of building it.

---

**Developer:** Kristian "Krisu" Virtanen  
**License:** [Choose your license]  
**Node.js** | **MCP Protocol** | **Built with ☕ in Finland**
