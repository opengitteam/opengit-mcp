<p align="center">
  <img src="https://raw.githubusercontent.com/opengitteam/opengit-mcp/main/logo.png" width="120" alt="OpenGit" />
</p>

<h1 align="center">opengit-mcp</h1>

<p align="center">
  MCP server for <a href="https://opengit.cc">OpenGit</a>, the index of open source that agents can use.<br/>
  Let your agent find the right tool for a task, by what it does, how it can be called and its OG score.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/opengit-mcp"><img src="https://img.shields.io/npm/v/opengit-mcp?style=flat-square&color=d9f970&labelColor=0a0a0a" alt="npm" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-d9f970?style=flat-square&labelColor=0a0a0a" alt="MIT" /></a>
</p>

---

## Quick start

### Claude Code

```bash
claude mcp add opengit -- npx -y opengit-mcp
```

### Cursor

`~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "opengit": { "command": "npx", "args": ["-y", "opengit-mcp"] }
  }
}
```

### Codex

`~/.codex/config.toml`

```toml
[mcp_servers.opengit]
command = "npx"
args = ["-y", "opengit-mcp"]
```

### Claude Desktop, Windsurf and other MCP clients

Add a stdio server with command `npx` and args `["-y", "opengit-mcp"]`.

### Prefer a remote server?

Clients that support Streamable HTTP can skip the package and connect straight to:

```
https://opengit.cc/mcp
```

## Tools

| Tool | Arguments | What it does |
|---|---|---|
| `search_repos` | `query`, `category?`, `interface?`, `limit?` | Find repos for a task, ranked by match and then OG score |
| `get_repo` | `owner`, `name` | Description, interfaces, stars, OG score, license and links for one repo |
| `list_categories` | none | Every category in the index, with repo counts |
| `trending` | `limit?` | Fastest-rising repos by stars gained this week |

`interface` is one of `MCP`, `CLI`, `Skill`, `Plugin`, `SDK`, `API`, `App`, `Harness`, `Library`.

Try asking your agent:

> Find me an MCP I can use to decompile an Android APK.

> What are the top security audit tools for coding agents right now?

## How it works

`opengit-mcp` is a small stdio bridge with no dependencies. It forwards each MCP message to the hosted OpenGit server at `https://opengit.cc/mcp` and writes the replies back, so the tools always match the live index. Nothing about your project or files is sent; only the tool calls your agent makes.

| Variable | Default | |
|---|---|---|
| `OPENGIT_MCP_URL` | `https://opengit.cc/mcp` | Upstream server |
| `OPENGIT_TIMEOUT_MS` | `30000` | Request timeout |

Requires Node.js 18.17 or later.

## What is OpenGit?

OpenGit lists, rates and surfaces open source for AI agents. Every repo gets an **OG score** from how an agent can call it and how fast it is moving. Maintainers will be able to claim their repo, connect a wallet and earn when agents use it, paid per call over x402.

- Site: [opengit.cc](https://opengit.cc)
- For agents: [opengit.cc/agents](https://opengit.cc/agents)
- Whitepaper: [opengit.cc/whitepaper](https://opengit.cc/whitepaper)

## Development

```bash
npm install
npm run build
npm test
```

## License

[MIT](LICENSE)
