/**
 * dsh-obsidian-quote-panel — Host half.
 *
 * The Obsidian plugin in `../plugin` already owns the knowledge base: it chunks
 * notes, extracts rules and serves a read-only HTTP API on loopback. This half
 * adds nothing to that knowledge — it is a transport. The Client tab asks the
 * Host, the Host asks the Obsidian plugin, and the panel paints whatever came
 * back.
 *
 * Why go through the Host instead of fetching from the browser: the token that
 * authorizes the quote service lives in `~/.obsidian-quote/config.json`, and a
 * browser-side fetch would have to ship that token into page JavaScript. The
 * Host already reads that file for the MCP server, so the credential stays in
 * exactly one place and the page only ever sees the results.
 *
 * Two invariants:
 *
 *  1. **Fail-open.** The Obsidian app may be closed, the service may be off, the
 *     config may be missing. None of those may escape as a thrown error: a route
 *     that throws leaves the panel with a blank card and no explanation, and a
 *     tool that throws pollutes the model's context with a stack trace. Every
 *     path returns `{ ok: false, reason }` in words a human can act on.
 *  2. **Read-only.** The panel exposes `/health`, `/stats`, `/search`, `/rules`
 *     and `/brief` — every one of them a read. `/reindex` and `/rules` (POST)
 *     are deliberately not proxied: rebuilding the index mutates the Obsidian
 *     workspace, and that decision belongs in the Obsidian panel where the user
 *     can see what is being rebuilt.
 *
 * @module dsh-obsidian-quote-panel
 */
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export const inject = []

/** Route the Client half posts to. */
const RPC_PATH = '/dsh-obsidian-quote-panel/rpc'
/** The Obsidian plugin's own default, mirrored so this works before any config exists. */
const DEFAULT_URL = 'http://127.0.0.1:43117'
/** Ceiling for a browser-originated request body. */
const MAX_BODY = 256 * 1024
/** Ceiling for one upstream call; a hung service must not wedge the panel forever. */
const UPSTREAM_TIMEOUT_MS = 10000

/**
 * Resolve the service endpoint and token.
 *
 * Same precedence as the bundled MCP server (`OBSIDIAN_QUOTE_URL` /
 * `OBSIDIAN_QUOTE_TOKEN` first, then `~/.obsidian-quote/config.json`), so
 * pointing the environment at another vault moves both surfaces at once — a
 * panel showing one vault while the model queries another would be worse than no
 * panel at all.
 *
 * @returns the resolved connection, or a reason describing why there is none.
 */
function resolveConnection() {
  const envUrl = typeof process.env.OBSIDIAN_QUOTE_URL === 'string' ? process.env.OBSIDIAN_QUOTE_URL.trim() : ''
  const envToken = typeof process.env.OBSIDIAN_QUOTE_TOKEN === 'string' ? process.env.OBSIDIAN_QUOTE_TOKEN.trim() : ''
  let fileUrl = ''
  let fileToken = ''
  let configPath = join(homedir(), '.obsidian-quote', 'config.json')
  try {
    const raw = readFileSync(configPath, 'utf8')
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      if (typeof parsed.url === 'string') fileUrl = parsed.url.trim()
      if (typeof parsed.token === 'string') fileToken = parsed.token.trim()
    }
  } catch {
    /* no config file: the defaults below still let /health answer */
  }
  const url = (envUrl || fileUrl || DEFAULT_URL).replace(/\/+$/, '')
  const token = envToken || fileToken
  return { url, token, configPath: envUrl || fileUrl ? configPath : configPath }
}

/**
 * One upstream call with a deadline.
 *
 * `AbortSignal.timeout` is used rather than a manual race so the socket is
 * actually torn down when the deadline passes; a raced promise keeps the
 * connection open and the panel would slowly leak sockets.
 *
 * @param pathWithQuery - path (and query) to append to the service root.
 * @param init - fetch init; a token is added when one is configured.
 * @returns `{ ok, status, body }` or `{ ok: false, reason }`.
 */
async function callService(connection, pathWithQuery, init = {}) {
  if (!/^[\x21-\x7e]*$/.test(connection.token)) {
    return { ok: false, status: 0, reason: '接入令牌格式无效，请在 Obsidian 中重新生成并写入接入配置。' }
  }
  const headers = { accept: 'application/json', ...(init.headers || {}) }
  if (connection.token) headers.authorization = `Bearer ${connection.token}`
  if (init.body !== undefined) headers['content-type'] = 'application/json'
  let response
  try {
    response = await fetch(`${connection.url}${pathWithQuery}`, {
      ...init,
      headers,
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    })
  } catch (error) {
    const reason = describeFetchError(error, connection.url)
    return { ok: false, status: 0, reason }
  }
  const text = await response.text().catch(() => '')
  let body = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text ? { raw: text } : null
  }
  if (!response.ok) {
    const detail = body && typeof body === 'object' && typeof body.error === 'string' ? body.error : `HTTP ${response.status}`
    return { ok: false, status: response.status, reason: detail, body }
  }
  return { ok: true, status: response.status, body }
}

/**
 * Turn a fetch failure into one sentence a user can act on.
 *
 * `ECONNREFUSED` is by far the most common case — the Obsidian app is simply not
 * running — and "无法连接" alone would leave the user guessing which of the two
 * services is down.
 *
 * @param error - whatever fetch threw.
 * @param url - the endpoint that was attempted.
 * @returns a human-readable reason.
 */
function describeFetchError(error, url) {
  const code = error && typeof error === 'object' ? String(error.cause?.code || error.code || '') : ''
  const message = error && typeof error === 'object' ? String(error.message || '') : String(error)
  if (code === 'ECONNREFUSED' || /ECONNREFUSED/.test(message)) {
    return `无法连接 ${url}：Obsidian 似乎没有运行，或插件里的本地服务没启动。`
  }
  if (error && typeof error === 'object' && error.name === 'TimeoutError') {
    return `${url} 在 ${Math.round(UPSTREAM_TIMEOUT_MS / 1000)} 秒内没有响应。`
  }
  // Fetch/Headers errors can embed request header values, including credentials.
  return `请求 ${url} 失败：请检查服务地址和接入配置。`
}

/** Same-origin check for a browser-originated POST. */
function isSameOrigin(request) {
  const remoteAddress = request?.socket?.remoteAddress?.toLowerCase()
  if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remoteAddress)) return false
  const hostHeader = request?.headers?.host
  if (typeof hostHeader !== 'string') return false
  let host
  try {
    host = new URL(`http://${hostHeader}`)
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(host.hostname)) return false
    if (host.host !== hostHeader.toLowerCase()) return false
  } catch {
    return false
  }
  const origin = request?.headers?.origin
  if (!origin) return true
  try {
    const parsed = new URL(origin)
    return ['http:', 'https:'].includes(parsed.protocol) && parsed.host === host.host
  } catch {
    return false
  }
}

/** Read and parse a JSON body with a hard size ceiling. */
function readJsonBody(request, limit = MAX_BODY) {
  return new Promise((resolveBody) => {
    const chunks = []
    let size = 0
    let done = false
    const settle = (value) => {
      if (done) return
      done = true
      resolveBody(value)
    }
    request.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        settle({ __tooLarge: true })
        request.destroy()
        return
      }
      chunks.push(chunk)
    })
    request.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8').replace(/^\uFEFF/, '').trim()
      if (!text) {
        settle({})
        return
      }
      try {
        settle(JSON.parse(text))
      } catch {
        settle({ __badJson: true })
      }
    })
    request.on('error', () => settle(null))
  })
}

/** Write one JSON response. */
function writeJson(response, status, body) {
  const payload = JSON.stringify(body)
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(payload),
  })
  response.end(payload)
}

/** Clamp a caller-supplied number into a sane range. */
function asInt(value, fallback, min, max) {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''))
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, Math.round(parsed)))
}

/** Keep only non-empty strings, trimmed. */
function asStrings(value) {
  if (!Array.isArray(value)) return undefined
  const out = value.map((item) => String(item ?? '').trim()).filter((item) => item !== '')
  return out.length > 0 ? out : undefined
}

/**
 * Resolve one panel action against the quote service.
 *
 * Kept as one function so the route stays a thin adapter and every method's
 * argument handling is testable without HTTP.
 *
 * @param method - panel action name.
 * @param args - caller arguments (already shape-checked by the caller).
 * @returns `{ ok, ... }` — never throws.
 */
async function perform(method, args) {
  const connection = resolveConnection()
  if (method === 'config') {
    return {
      ok: true,
      config: {
        url: connection.url,
        // The token itself never crosses to the browser: only whether one exists.
        hasToken: connection.token !== '',
        configPath: connection.configPath,
      },
    }
  }
  if (method === 'status') {
    const health = await callService(connection, '/health')
    if (!health.ok) return { ok: false, offline: true, reason: health.reason, config: { url: connection.url, hasToken: connection.token !== '' } }
    const stats = await callService(connection, '/stats')
    const vaults = await callService(connection, '/vaults')
    return {
      ok: true,
      health: health.body,
      stats: stats.ok ? stats.body : null,
      vaults: vaults.ok ? vaults.body : null,
      config: { url: connection.url, hasToken: connection.token !== '' },
    }
  }
  if (method === 'search') {
    const query = String(args.query ?? '').trim()
    if (query === '') return { ok: false, reason: '请输入检索关键词。' }
    const result = await callService(connection, '/search', {
      method: 'POST',
      body: JSON.stringify({
        query,
        limit: asInt(args.limit, 8, 1, 50),
        maxChars: asInt(args.maxChars, 900, 120, 8000),
        ...(asStrings(args.sources) === undefined ? {} : { sources: asStrings(args.sources) }),
        ...(typeof args.profile === 'string' && args.profile.trim() !== '' ? { profile: args.profile.trim() } : {}),
      }),
    })
    return result.ok ? { ok: true, result: result.body } : { ok: false, reason: result.reason }
  }
  if (method === 'rules') {
    const params = new URLSearchParams()
    if (typeof args.query === 'string' && args.query.trim() !== '') params.set('q', args.query.trim())
    if (typeof args.topic === 'string' && args.topic.trim() !== '') params.set('topic', args.topic.trim())
    if (typeof args.priority === 'string' && ['must', 'should', 'tip'].includes(args.priority)) params.set('priority', args.priority)
    params.set('limit', String(asInt(args.limit, 20, 1, 100)))
    const sources = asStrings(args.sources)
    if (sources) for (const source of sources) params.append('source', source)
    if (typeof args.profile === 'string' && args.profile.trim() !== '') params.set('profile', args.profile.trim())
    const result = await callService(connection, `/rules?${params.toString()}`)
    return result.ok ? { ok: true, result: result.body } : { ok: false, reason: result.reason }
  }
  if (method === 'context') {
    // The one call the model relies on most: it returns *budgeted* markdown, not
    // a hit list. Exposing it keeps the panel at feature parity with the bundled
    // MCP server (`kb_context`), which is what the "panel feels incomplete"
    // report was about.
    const query = String(args.query ?? '').trim()
    if (query === '') return { ok: false, reason: '请输入检索关键词。' }
    const result = await callService(connection, '/context', {
      method: 'POST',
      body: JSON.stringify({
        query,
        budget: asInt(args.budget, 4000, 200, 20000),
        limit: asInt(args.limit, 6, 1, 50),
        ...(asStrings(args.sources) === undefined ? {} : { sources: asStrings(args.sources) }),
        ...(typeof args.profile === 'string' && args.profile.trim() !== '' ? { profile: args.profile.trim() } : {}),
      }),
    })
    return result.ok ? { ok: true, result: result.body } : { ok: false, reason: result.reason }
  }
  if (method === 'brief') {
    const stack = asStrings(args.stack) || []
    if (stack.length === 0) return { ok: false, reason: '请输入技术栈，例如 typescript, react。' }
    const result = await callService(connection, '/brief', {
      method: 'POST',
      body: JSON.stringify({
        stack,
        budget: asInt(args.budget, 4000, 500, 20000),
        limit: asInt(args.limit, 24, 1, 100),
        ...(typeof args.projectPath === 'string' && args.projectPath.trim() !== '' ? { projectPath: args.projectPath.trim() } : {}),
        ...(asStrings(args.sources) === undefined ? {} : { sources: asStrings(args.sources) }),
      }),
    })
    return result.ok ? { ok: true, result: result.body } : { ok: false, reason: result.reason }
  }
  return { ok: false, reason: `未知方法：${method}` }
}

/**
 * Cordis entry point.
 *
 * The route is registered through `ctx.inject(['webServer'])` rather than a
 * plain `ctx.get`: a headless Host has no web server at all, and injecting keeps
 * this a no-op there instead of a startup failure.
 *
 * @param ctx - the plugin context.
 */
export function apply(ctx) {
  const registerRoute = () => {
    const webServer = typeof ctx.get === 'function' ? ctx.get('webServer') : undefined
    if (!webServer || typeof webServer.register !== 'function') return () => {}
    return webServer.register({
      kind: 'exact',
      path: RPC_PATH,
      handler: async (request, response) => {
        if (!isSameOrigin(request)) {
          writeJson(response, 403, { ok: false, reason: '来源不匹配，已拒绝。' })
          return
        }
        const body = request.method === 'POST' ? await readJsonBody(request) : {}
        if (body && body.__tooLarge) {
          writeJson(response, 413, { ok: false, reason: '请求体过大。' })
          return
        }
        if (body && body.__badJson) {
          writeJson(response, 400, { ok: false, reason: '请求体不是合法 JSON。' })
          return
        }
        const method = String(body?.method || 'status')
        const args = body && typeof body.args === 'object' && body.args ? body.args : {}
        try {
          const result = await perform(method, args)
          writeJson(response, 200, result)
        } catch (error) {
          // A UI route must never surface an exception: the panel would show a
          // broken card with no explanation.
          writeJson(response, 200, { ok: false, reason: `内部错误：${String(error?.message || error)}` })
        }
      },
    })
  }

  if (typeof ctx.inject === 'function') {
    ctx.inject(['webServer'], (hostCtx) => hostCtx.effect(() => registerRoute(), 'dsh-obsidian-quote-panel: rpc route'))
  } else if (typeof ctx.effect === 'function') {
    ctx.effect(() => registerRoute(), 'dsh-obsidian-quote-panel: rpc route')
  }
}
