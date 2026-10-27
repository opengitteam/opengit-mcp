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
  <a href="https://opengit.cc/repo/opengitteam/opengit-mcp"><img src="https://opengit.cc/badge/opengitteam/opengit-mcp.svg" alt="OpenGit" /></a>
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
| `search_repos` | `query`, `category?`, `interface?`, `ecosystem?`, `claimed?`, `limit?` | Find repos for a task, ranked by match and then OG score |
| `get_repo` | `owner`, `name` | Description, interfaces, stars, OG score, ecosystems, license, links, and a claimed repo's payout address |
| `tip_repo` | `owner`, `name`, `amount_usd?`, `network?` | An x402 link that tips a claimed repo, paid straight to its maintainer |
| `list_categories` | none | Every category in the index, with repo counts |
| `list_ecosystems` | none | Chains in the index (Solana, Base, Robinhood Chain), with repo counts |
| `list_builders` | `ecosystem?` | Featured builders, the chains they build on and the repos they ship |
| `trending` | `limit?`, `ecosystem?` | Fastest-rising repos by stars gained this week |

`interface` is one of `MCP`, `CLI`, `Skill`, `Plugin`, `SDK`, `API`, `App`, `Harness`, `Library`.
`ecosystem` is one of `solana`, `base`, `robinhood-chain`.

The tools come from the hosted server, so new ones show up without updating this package.

Try asking your agent:

> Find me an MCP I can use to decompile an Android APK.

> What are the top security audit tools for coding agents right now?

> Which agent kits and MCPs are there for Solana?

> Who are the featured builders on Base, and what do they ship?

> Tip $0.50 to the maintainers of the MCP servers I used today.

## Tipping with x402

Claimed repos (those with an `opengit.json` payout address) can be tipped by agents. `tip_repo` returns a link such as `https://opengit.cc/pay/<owner>/<repo>?amount=1`, which answers `402 Payment Required` with options on Robinhood Chain (USDG), Base (USDC) and Solana (USDC). Pay it with any x402 client or agent wallet: the payment settles straight to the maintainer, and OpenGit holds nothing.

## How it works

`opengit-mcp` is a small stdio bridge with no dependencies. It forwards each MCP message to the hosted OpenGit server at `https://opengit.cc/mcp` and writes the replies back, so the tools always match the live index. Nothing about your project or files is sent; only the tool calls your agent makes.

| Variable | Default | |
|---|---|---|
| `OPENGIT_MCP_URL` | `https://opengit.cc/mcp` | Upstream server |
| `OPENGIT_TIMEOUT_MS` | `30000` | Request timeout |

Requires Node.js 18.17 or later.

## What is OpenGit?

OpenGit lists, rates and surfaces open source for AI agents (4,700+ repos and growing). A collector indexes agent-ready repos from GitHub every 15 minutes, and every repo gets an **OG score** from how an agent can call it and how fast it is moving. Repos are grouped by category and by ecosystem (Solana, Base, Robinhood Chain), with crypto repos checked for bots, drainers and fake copies before they are listed. Maintainers claim their repo by adding an `opengit.json` with their wallet ([opengit.cc/claim](https://opengit.cc/claim)), and then people and agents can tip them directly.

- Site: [opengit.cc](https://opengit.cc)
- Ecosystems: [opengit.cc/ecosystems](https://opengit.cc/ecosystems)
- Featured builders: [opengit.cc/builders](https://opengit.cc/builders)
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
