#!/usr/bin/env node
// opengit-mcp: a local stdio MCP server for OpenGit.
//
// It forwards every JSON-RPC message from the MCP client to the hosted OpenGit server
// (https://opengit.cc/mcp) and writes the replies back, so the tools always match the live
// index. For clients that support remote MCP servers, connecting to the URL directly works too.

import { createInterface } from 'node:readline'

const VERSION = '0.1.1'
const ENDPOINT = process.env.OPENGIT_MCP_URL ?? 'https://opengit.cc/mcp'
const TIMEOUT_MS = Number(process.env.OPENGIT_TIMEOUT_MS ?? 30_000)

type Id = string | number | null
type Message = { jsonrpc: '2.0'; id?: Id; method?: string; params?: Record<string, unknown> }

const log = (...args: unknown[]) => process.stderr.write(`[opengit-mcp] ${args.join(' ')}\n`)
const send = (msg: unknown) => process.stdout.write(`${JSON.stringify(msg)}\n`)
const isRequest = (m: Message) => m.id !== undefined && m.id !== null && typeof m.method === 'string'

/** The protocol version the client negotiated, passed on as the spec asks after initialize. */
let protocolVersion: string | undefined

/** Read JSON-RPC messages from a response that is either JSON or an SSE stream. */
async function readReplies(res: Response): Promise<unknown[]> {
  const type = res.headers.get('content-type') ?? ''
  const body = await res.text()
  if (!body.trim()) return []
  if (type.includes('text/event-stream')) {
    return body
      .split(/\r?\n\r?\n/)
      .map((event) =>
        event
          .split(/\r?\n/)
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trimStart())
          .join('\n'),
      )
      .filter(Boolean)
      .map((data) => JSON.parse(data))
  }
  const parsed = JSON.parse(body)
  return Array.isArray(parsed) ? parsed : [parsed]
}

async function forward(msg: Message) {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    accept: 'application/json, text/event-stream',
    'user-agent': `opengit-mcp/${VERSION}`,
  }
  if (protocolVersion) headers['mcp-protocol-version'] = protocolVersion

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(msg),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (res.status === 202) return
    if (!res.ok && !(res.headers.get('content-type') ?? '').includes('json')) throw new Error(`HTTP ${res.status}`)
    for (const reply of await readReplies(res)) {
      const r = reply as { result?: { protocolVersion?: string } }
      if (msg.method === 'initialize' && r.result?.protocolVersion) protocolVersion = r.result.protocolVersion
      send(reply)
    }
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    log(`request failed: ${reason}`)
    // Only requests get an error back; a dropped notification has no one to tell.
    if (isRequest(msg)) send({ jsonrpc: '2.0', id: msg.id, error: { code: -32603, message: `OpenGit is unreachable (${reason}). Try again shortly.` } })
  }
}

function main() {
  if (process.argv.includes('--version') || process.argv.includes('-v')) {
    process.stdout.write(`${VERSION}\n`)
    return
  }
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    process.stdout.write(
      [
        'opengit-mcp: local MCP server for OpenGit (stdio).',
        '',
        'Add it to your MCP client as a stdio server with the command: npx -y opengit-mcp',
        '',
        'Environment:',
        `  OPENGIT_MCP_URL     upstream server (default https://opengit.cc/mcp)`,
        `  OPENGIT_TIMEOUT_MS  request timeout in ms (default 30000)`,
        '',
      ].join('\n'),
    )
    return
  }

  log(`ready, forwarding to ${ENDPOINT}`)
  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity })
  const pending = new Set<Promise<void>>()

  rl.on('line', (line) => {
    if (!line.trim()) return
    let msg: Message | Message[]
    try {
      msg = JSON.parse(line)
    } catch {
      send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } })
      return
    }
    // Requests run concurrently; replies carry their ids, so order does not matter.
    for (const m of Array.isArray(msg) ? msg : [msg]) {
      const p = forward(m).finally(() => pending.delete(p))
      pending.add(p)
    }
  })

  // Let in-flight requests finish before exiting when the client closes stdin.
  rl.on('close', async () => {
    await Promise.allSettled(pending)
    process.exit(0)
  })
}

main()
