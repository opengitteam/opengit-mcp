// Runs the built server against a local stand-in for opengit.cc/mcp.
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const BIN = new URL('../dist/index.js', import.meta.url).pathname

/** A fake upstream: JSON replies, SSE for one method, 202 for notifications. */
async function upstream() {
  const seen = []
  const server = createServer(async (req, res) => {
    let body = ''
    for await (const chunk of req) body += chunk
    const msg = JSON.parse(body)
    seen.push({ msg, headers: req.headers })
    if (msg.id === undefined) return res.writeHead(202).end()
    if (msg.method === 'initialize') {
      return res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { protocolVersion: '2025-06-18', capabilities: {}, serverInfo: { name: 'fake' } } }))
    }
    if (msg.method === 'tools/list') {
      res.writeHead(200, { 'content-type': 'text/event-stream' })
      return res.end(`event: message\ndata: ${JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { tools: [{ name: 'search_repos' }] } })}\n\n`)
    }
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ jsonrpc: '2.0', id: msg.id, error: { code: -32601, message: 'nope' } }))
  })
  server.listen(0)
  await once(server, 'listening')
  return { url: `http://127.0.0.1:${server.address().port}/mcp`, seen, close: () => server.close() }
}

/** Start the stdio server and collect its stdout lines as parsed JSON. */
function start(url) {
  const child = spawn(process.execPath, [BIN], { env: { ...process.env, OPENGIT_MCP_URL: url, OPENGIT_TIMEOUT_MS: '3000' } })
  const replies = []
  let buf = ''
  child.stdout.on('data', (d) => {
    buf += d
    let i
    while ((i = buf.indexOf('\n')) >= 0) {
      replies.push(JSON.parse(buf.slice(0, i)))
      buf = buf.slice(i + 1)
    }
  })
  const write = (m) => child.stdin.write(`${JSON.stringify(m)}\n`)
  const waitFor = async (id) => {
    for (let t = 0; t < 100; t++) {
      const r = replies.find((x) => x.id === id)
      if (r) return r
      await new Promise((ok) => setTimeout(ok, 30))
    }
    throw new Error(`no reply for id ${id}`)
  }
  return { child, write, waitFor, replies }
}

test('forwards requests, handles JSON and SSE replies, and skips notifications', async () => {
  const up = await upstream()
  const s = start(up.url)
  try {
    s.write({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } })
    assert.equal((await s.waitFor(1)).result.serverInfo.name, 'fake')

    s.write({ jsonrpc: '2.0', method: 'notifications/initialized' })
    s.write({ jsonrpc: '2.0', id: 2, method: 'tools/list' })
    assert.equal((await s.waitFor(2)).result.tools[0].name, 'search_repos')

    s.write({ jsonrpc: '2.0', id: 3, method: 'unknown' })
    assert.equal((await s.waitFor(3)).error.code, -32601)

    // Notifications produce no output; the negotiated version is sent after initialize.
    assert.equal(s.replies.length, 3)
    assert.equal(up.seen.find((x) => x.msg.method === 'tools/list').headers['mcp-protocol-version'], '2025-06-18')
  } finally {
    s.child.kill()
    up.close()
  }
})

test('answers with a JSON-RPC error when OpenGit is unreachable', async () => {
  const s = start('http://127.0.0.1:9/mcp')
  try {
    s.write({ jsonrpc: '2.0', id: 'a', method: 'tools/list' })
    const r = await s.waitFor('a')
    assert.equal(r.error.code, -32603)
    assert.match(r.error.message, /unreachable/)
  } finally {
    s.child.kill()
  }
})

test('reports a parse error for bad input', async () => {
  const s = start('http://127.0.0.1:9/mcp')
  try {
    s.child.stdin.write('not json\n')
    const r = await s.waitFor(null)
    assert.equal(r.error.code, -32700)
  } finally {
    s.child.kill()
  }
})
