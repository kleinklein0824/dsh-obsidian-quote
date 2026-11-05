/**
 * Probe: exercise the panel's Host half without a Harness process.
 *
 * Starts the plugin's `apply` on a fake cordis context that carries a minimal
 * `webServer`, then drives the RPC route over real HTTP. Checks:
 *   1. `config` never leaks the token.
 *   2. `status` reports the live service (or a readable offline reason).
 *   3. `search` returns real hits.
 *   4. `rules` and `brief` answer in their documented shapes.
 *   5. A cross-origin POST is refused with 403.
 *   6. An unknown method is a JSON failure, not a 500.
 *   7. `dispose` unregisters the route.
 */
import { createServer } from 'node:http'
import assert from 'node:assert/strict'

const { apply } = await import('./index.js')

const routes = new Map()
const webServer = {
  register(route) {
    routes.set(route.path, route)
    return () => routes.delete(route.path)
  },
}

let appliedDisposer = null
const effects = []
const ctx = {
  get(service) {
    if (service === 'webServer') return webServer
    return undefined
  },
  effect(factory, label) {
    const dispose = factory()
    effects.push({ dispose, label })
    return () => {
      try {
        if (typeof dispose === 'function') dispose()
      } catch {
        /* ignore */
      }
    }
  },
  inject(names, callback) {
    // Mirror cordis: the callback receives a restricted Context that still owns
    // `effect` — a face with only `get` would fail the real registration shape.
    const face = {
      get: (service) => ctx.get(service),
      effect: (factory, label) => ctx.effect(factory, label),
    }
    const dispose = callback(face)
    return () => {
      try {
        if (typeof dispose === 'function') dispose()
      } catch {
        /* ignore */
      }
    }
  },
}

apply(ctx)
appliedDisposer = () => {
  for (const entry of effects) {
    try {
      if (typeof entry.dispose === 'function') entry.dispose()
    } catch {
      /* ignore */
    }
  }
}

assert.equal(routes.size, 1, `expected exactly one route, got ${[...routes.keys()].join(',')}`)
const route = routes.get('/dsh-obsidian-quote-panel/rpc')
assert.ok(route, 'rpc route missing')
assert.equal(route.kind, 'exact')

const server = createServer((req, res) => {
  route.handler(req, res).catch((error) => {
    res.writeHead(500).end(String(error))
  })
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const port = server.address().port
const base = `http://127.0.0.1:${port}`
const post = async (body, headers = {}) => {
  const response = await fetch(base + '/dsh-obsidian-quote-panel/rpc', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
  const text = await response.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    json = { raw: text }
  }
  return { status: response.status, json }
}

const results = []
const record = (name, ok, detail) => {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`)
}

// 1. config
{
  const { status, json } = await post({ method: 'config' })
  const serialized = JSON.stringify(json)
  const probeToken = process.env.OBSIDIAN_QUOTE_TOKEN || ''
  const leaks = /"token"\s*:/.test(serialized) || Boolean(probeToken && serialized.includes(probeToken))
  record('config does not leak the token', status === 200 && json.ok === true && !leaks, `url=${json?.config?.url} hasToken=${json?.config?.hasToken} status=${status}`)
  record('config reports the resolved endpoint', typeof json?.config?.url === 'string' && json.config.url.startsWith('http'), json?.config?.url)
}

// 2. status
{
  const { status, json } = await post({ method: 'status' })
  const online = json?.ok === true
  record('status answers', status === 200, online ? `docs=${json.health?.docs} chunks=${json.health?.chunks} rules=${json.health?.rules}` : `offline: ${json?.reason}`)
  if (online) {
    record('status carries the service health', typeof json.health?.docs === 'number' && json.health.docs > 0, `docs=${json.health.docs}`)
    record('status carries the citation ledger', json.stats !== null && typeof json.stats === 'object', JSON.stringify(json.stats).slice(0, 120))
  }
}

// 3. search
{
  const { status, json } = await post({ method: 'search', args: { query: '命名规范', limit: 2 } })
  const ok = status === 200 && json?.ok === true && Array.isArray(json.result?.hits)
  record('search returns hits', ok, ok ? `total=${json.result.total} hits=${json.result.hits.length}` : `reason=${json?.reason}`)
  if (ok && json.result.hits.length > 0) {
    const hit = json.result.hits[0]
    record('search hit carries path/title/excerpt', typeof hit.path === 'string' && typeof hit.title === 'string' && typeof hit.excerpt === 'string', `${hit.path} :: ${hit.heading ?? ''}`)
  }
  const empty = await post({ method: 'search', args: { query: '   ' } })
  record('empty query is refused in words', empty.json?.ok === false && typeof empty.json.reason === 'string', empty.json?.reason)
}

// 3b. the sources facet: one query, narrowed to a vault or a folder in it
//
// The panel's scope chips send exactly this field, so the probe checks the wire
// end of that control: a real folder narrows the result set, and a folder that
// does not exist yields nothing instead of silently falling back to everything.
{
  const everywhere = await post({ method: 'search', args: { query: '命名', limit: 5 } })
  const scoped = await post({ method: 'search', args: { query: '命名', limit: 5, sources: ['Obsidian test1/Vue3'] } })
  const nowhere = await post({ method: 'search', args: { query: '命名', limit: 5, sources: ['不存在的库'] } })
  const wide = everywhere.json?.ok === true ? everywhere.json.result.total : -1
  const narrow = scoped.json?.ok === true ? scoped.json.result.total : -1
  record(
    'sources narrow a query to one folder',
    narrow >= 0 && narrow <= wide,
    `all=${wide} Vue3=${narrow}`,
  )
  record(
    'an unknown source returns nothing instead of everything',
    nowhere.json?.ok === true && nowhere.json.result.total === 0,
    `total=${nowhere.json?.result?.total}`,
  )
  const hitPaths = scoped.json?.ok === true ? scoped.json.result.hits.map((hit) => String(hit.path || '')) : []
  record(
    'every scoped hit really lives under the folder',
    hitPaths.length > 0 && hitPaths.every((path) => path.startsWith('Vue3/')),
    `${hitPaths.length} hit(s): ${hitPaths.slice(0, 2).join(', ')}`,
  )
}

// 4. rules
{
  const { status, json } = await post({ method: 'rules', args: { limit: 3 } })
  const ok = status === 200 && json?.ok === true && Array.isArray(json.result?.rules)
  record('rules returns clauses', ok, ok ? `total=${json.result.total ?? '?'} rules=${json.result.rules.length}` : `reason=${json?.reason}`)
  if (ok && json.result.rules.length > 0) {
    const rule = json.result.rules[0]
    record('rule carries id/text/priority', typeof rule.id === 'string' && typeof rule.text === 'string' && ['must', 'should', 'tip'].includes(rule.priority), `${rule.id} ${rule.priority}`)
  }
}

// 5. brief
{
  const { status, json } = await post({ method: 'brief', args: { stack: ['typescript', 'react'] } })
  const ok = status === 200 && json?.ok === true
  record('brief answers', ok, ok ? `stack=${JSON.stringify(json.result?.stack)} rules=${Array.isArray(json.result?.rules) ? json.result.rules.length : 'n/a'}` : `reason=${json?.reason}`)
  const empty = await post({ method: 'brief', args: { stack: [] } })
  record('empty stack is refused in words', empty.json?.ok === false && typeof empty.json.reason === 'string', empty.json?.reason)
}

// 5b. context — the budgeted-markdown call the model itself uses.
{
  const { status, json } = await post({ method: 'context', args: { query: '命名规范', limit: 3, budget: 1200 } })
  const ok = status === 200 && json?.ok === true && typeof json.result?.markdown === 'string'
  record(
    'context returns budgeted markdown',
    ok,
    ok ? `used=${json.result.used} hits=${Array.isArray(json.result.hits) ? json.result.hits.length : 'n/a'}` : `reason=${json?.reason}`,
  )
  if (ok) {
    record('context stays inside its budget', json.result.used <= 1200 * 2, `used=${json.result.used}`)
    record('context names the hits it used', Array.isArray(json.result.hits), typeof json.result.hits)
  }
  const empty = await post({ method: 'context', args: { query: '  ' } })
  record('empty context query is refused in words', empty.json?.ok === false && typeof empty.json.reason === 'string', empty.json?.reason)
}

// 5c. the status payload already carries what the panel now renders.
{
  const { json } = await post({ method: 'status' })
  const vaults = json?.vaults?.vaults
  record(
    'status carries the vault list for the panel',
    Array.isArray(vaults) && vaults.length > 0 && typeof vaults[0].name === 'string',
    Array.isArray(vaults) ? `${vaults.length} vault(s): ${vaults.map((v) => v.name).join(', ')}` : 'none',
  )
  const topNotes = json?.stats?.topNotes
  record(
    'status carries the most-cited notes',
    Array.isArray(topNotes) && (topNotes.length === 0 || typeof topNotes[0].count === 'number'),
    Array.isArray(topNotes) ? `${topNotes.length} note(s)` : 'none',
  )
}

// 6. cross-origin refusal
{
  const { status, json } = await post({ method: 'status' }, { origin: 'http://evil.example.com' })
  record('cross-origin POST is refused', status === 403 && json?.ok === false, `${status} ${json?.reason}`)
}

// 7. unknown method
{
  const { status, json } = await post({ method: 'destroyEverything' })
  record('unknown method is a JSON failure', status === 200 && json?.ok === false && /未知方法/.test(String(json.reason)), json?.reason)
}

// 8. malformed body
{
  const response = await fetch(base + '/dsh-obsidian-quote-panel/rpc', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{not json',
  })
  const json = await response.json()
  record('malformed body answers 400', response.status === 400 && json?.ok === false, JSON.stringify(json))
}

// 9. dispose removes the route
{
  appliedDisposer()
  await new Promise((resolve) => server.close(resolve))
  record('dispose unregisters the route', routes.size === 0, `routes=${routes.size}`)
}

const failed = results.filter((item) => item.ok !== true)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
if (failed.length > 0) {
  for (const item of failed) console.log(`  FAILED: ${item.name} — ${item.detail}`)
  process.exitCode = 1
}
