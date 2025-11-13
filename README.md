# Note:

At its current state, Sampo-MCP is developed for and with Claude AI/Claude Desktop so using it with other AI applications still requires a bit of tweaking


# Take Sampo-MCP in use:

1. Read *https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop*
2. Set proper path to your Sampo-MCP root at package.json ->  *"installRoot": "D:\\Sampo-MCP",*
3. Rename *"env"* as *".env"*
4. Adjust *"devMode"* true/false depending if you want AI to access Sampo source.
5. *npm install*
6. Read *"\Sampo-docs\Tool-docs"* and *"\Sampo-docs\Dev-docs"*

# Sampo-MCP about

## Introduction

Sampo-MCP emerged from hands-on exploration of the Model Context Protocol (MCP) and experimentation with various Claude-compatible tools. After playing around with existing solutions, I decided to build something tailored to my own workflow and philosophy: workspace on your computer that AI can interact with naturally and powerfully.

Although I have been programming since the ancient BASIC home computers and completed a professional degree in software development in 2013, coding has remained just a hobby and curiosity.

I am a behind of development in many things, but I don't let it get in the way.

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
**License:** MIT
**Node.js** | **MCP Protocol** | **Built with ☕ in Finland**
