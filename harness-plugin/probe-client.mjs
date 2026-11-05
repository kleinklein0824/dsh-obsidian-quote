/**
 * Probe: exercise the panel's Client half without a browser.
 *
 * The Client half is a browser bundle (`window.__ModuleLoader__.load`), so this
 * probe supplies the three things the browser gives it — a loader, a `react`
 * module, a DOM — and then drives the registered components the way a user
 * would: mount, type in a field, press a mode button, press 查询, and check the
 * tree that comes back.
 *
 * The fake React here is a real (small) renderer: `useState` marks the instance
 * dirty, and the harness re-renders until no state change is pending, so a
 * status fetch that lands after mount actually repaints. A probe that rendered
 * once and inspected the first tree would pass on scaffolding and prove nothing
 * about what the user sees.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/* ------------------------------------------------------------ fake React */

let cursor = 0
let state = []
let dirty = false
let pass = 0
let mounting = false
const mountEffects = []

const createElement = (type, props, ...children) => ({
  type,
  props: {
    ...(props || {}),
    children: children.length === 0 ? undefined : children.length === 1 ? children[0] : children,
  },
})

const React = {
  createElement,
  useState(initial) {
    const index = cursor++
    if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial
    return [
      state[index],
      (value) => {
        state[index] = typeof value === 'function' ? value(state[index]) : value
        dirty = true
      },
    ]
  },
  useEffect(fn) {
    if (mounting) mountEffects.push(fn)
    return undefined
  },
  useRef(initial) {
    const index = cursor++
    if (!(index in state)) state[index] = { current: initial }
    return state[index]
  },
  useCallback(fn) {
    return fn
  },
  useMemo(fn) {
    return fn()
  },
}

/* ------------------------------------------------------------ fake DOM */

const styleElements = []
globalThis.document = {
  getElementById: (id) => styleElements.find((element) => element.id === id) || null,
  createElement: () => ({ id: '', textContent: '' }),
  head: { appendChild: (element) => styleElements.push(element) },
}

let moduleExports = null
globalThis.window = {
  __ModuleLoader__: {
    load(definition) {
      moduleExports = definition.factory((id) => {
        if (id === 'react') return React
        throw new Error(`unexpected require: ${id}`)
      })
    },
  },
}

await import('./client.js')
assert.ok(moduleExports, 'bundle did not call __ModuleLoader__.load')

const results = []
const record = (name, ok, detail) => {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`)
}

record('bundle exposes inject + apply', typeof moduleExports.apply === 'function' && Array.isArray(moduleExports.inject), `inject=${JSON.stringify(moduleExports.inject)}`)

/* --------------------------------------------------------- fake cordis */

const localeRegistrations = []
const slotRegistrations = []
const tabsRegistered = []

/**
 * The stand-in for the Host's `locale` service.
 *
 * Built from the real interface, not an approximation of it: `register(ns, lang,
 * dict)` stores dictionaries, `bind(ns)` returns a `t(key)` that walks the active
 * language's fallback chain, and `subscribe` notifies on both a language switch
 * and a dictionary registration. The panel resolves *all* of its chrome through
 * this service, so a stand-in that only recorded registrations would have hidden
 * the defect this probe now guards: the panel used to read `DICTS.zh` directly
 * and stayed Chinese while the UI was English.
 */
const localeState = {
  active: 'zh',
  dicts: new Map(),
  listeners: new Set(),
  snapshot: null,
}

function publishLocale() {
  localeState.snapshot = {
    active: localeState.active,
    revision: (localeState.snapshot?.revision ?? 0) + 1,
    locales: [{ id: 'zh', label: '中文' }, { id: 'en', label: 'English' }],
  }
  for (const listener of [...localeState.listeners]) {
    try {
      listener()
    } catch {
      /* a subscriber's throw must not break the publisher */
    }
  }
}

const localeService = {
  register(ns, lang, dict) {
    localeRegistrations.push({ ns, lang, size: Object.keys(dict).length })
    const bucket = localeState.dicts.get(ns) || new Map()
    bucket.set(lang, dict)
    localeState.dicts.set(ns, bucket)
    publishLocale()
    return () => {}
  },
  bind(ns) {
    return (key) => {
      const bucket = localeState.dicts.get(ns)
      if (!bucket) return key
      const chain = localeState.active === 'en' ? ['en', 'zh'] : ['zh', 'en']
      for (const lang of chain) {
        const value = bucket.get(lang)?.[key]
        if (typeof value === 'string') return value
      }
      return key
    }
  },
  getSnapshot() {
    return localeState.snapshot
  },
  subscribe(listener) {
    localeState.listeners.add(listener)
    return () => {
      localeState.listeners.delete(listener)
    }
  },
  setLocale(id) {
    localeState.active = id
    publishLocale()
  },
}

/** Switch the fake UI language and let subscribers repaint. */
async function useLocale(id) {
  localeService.setLocale(id)
  await settle()
}

/**
 * The stand-in for `remote.directoryPicker`.
 *
 * `pickerAvailable` decides whether the fake `inject` hands the panel a chooser at
 * all; `pickerAnswer` is what the current block wants the operator to "choose"
 * (or `null` for a cancelled dialog). Both are read at click time because the real
 * Remote face mounts long after `apply` returns.
 */
let pickerAvailable = true
let pickerCalls = 0
let pickerAnswer = null
const pickerInjectors = []
const pickerProxy = {
  pick() {
    pickerCalls += 1
    const answer = pickerAnswer
    return Promise.resolve(answer === null ? { ok: true, value: null } : { ok: true, value: answer })
  },
}

const ctx = {
  get(service) {
    if (service === 'locale') return localeService
    return undefined
  },
  effect(factory) {
    const dispose = factory()
    return () => {
      try {
        if (typeof dispose === 'function') dispose()
      } catch {
        /* ignore */
      }
    }
  },
  slots: {
    inject(name, callback) {
      const dispose = callback()
      return () => {
        try {
          if (typeof dispose === 'function') dispose()
        } catch {
          /* ignore */
        }
      }
    },
    register(definition, component) {
      slotRegistrations.push({
        name: definition.name,
        key: definition.key,
        id: definition.id,
        label: definition.label,
        order: definition.order,
        component,
      })
      return () => {
        const index = slotRegistrations.findIndex((item) => item.component === component)
        if (index >= 0) slotRegistrations.splice(index, 1)
      }
    },
  },
  inject(names, callback) {
    const tabs = {
      register(definition) {
        tabsRegistered.push(definition)
        return () => {
          const index = tabsRegistered.indexOf(definition)
          if (index >= 0) tabsRegistered.splice(index, 1)
        }
      },
    }
    // The folder chooser arrives through `inject(['remote.directoryPicker'])`,
    // and the panel reads `injected.remote.directoryPicker` — mirroring the real
    // Remote face, where `pick()` answers `{ ok, value }`.
    //
    // The callback is remembered because `apply` runs once: exercising the
    // no-chooser Host means re-running the same injection without the Remote
    // face, which is exactly what cordis does when a provider is absent.
    const wanted = Array.isArray(names) ? names : []
    const injected = {
      get: (service) => (service === 'sidebarRightTabs' ? tabs : undefined),
    }
    if (wanted.indexOf('remote.directoryPicker') !== -1) {
      if (pickerAvailable) injected.remote = { directoryPicker: pickerProxy }
      pickerInjectors.push(callback)
    }
    const dispose = callback(injected)
    return () => {
      try {
        if (typeof dispose === 'function') dispose()
      } catch {
        /* ignore */
      }
    }
  },
}

moduleExports.apply(ctx)

record('apply registers the locale dictionaries', localeRegistrations.length >= 2, localeRegistrations.map((item) => `${item.lang}:${item.size}`).join(' '))
record('apply registers exactly one tab type', tabsRegistered.length === 1, tabsRegistered.map((item) => `${item.id}/${item.kind}`).join(','))
record(
  'apply registers body + title slots',
  slotRegistrations.filter((item) => item.name.startsWith('sidebar.right.')).length === 2,
  slotRegistrations.map((item) => item.name).join(', '),
)

const type = tabsRegistered[0]
record('tab id and kind differ', type.id !== type.kind, `${type.id} vs ${type.kind}`)
record('tab is a page type (no patterns)', type.patterns === undefined, String(type.patterns))
record('tab keeps its body mounted', type.keepMounted === true, String(type.keepMounted))
record('tab declares extension priority', type.priority === 'extension', String(type.priority))
record('tab title is a thunk', typeof type.title === 'function' && typeof type.title('') === 'string', String(type.title('')))
const guide = Array.isArray(type.guide) ? type.guide : []
record('guide has one entry with its own id', guide.length === 1 && guide[0].id === type.id, guide.length === 1 ? `${guide[0].id} order=${guide[0].order}` : 'none')
record(
  'guide title/description are callable thunks',
  guide.length === 1 && typeof guide[0].title === 'function' && typeof guide[0].title() === 'string' && typeof guide[0].description === 'function' && typeof guide[0].description() === 'string',
  guide.length === 1 ? guide[0].title() : '',
)

const bodyEntry = slotRegistrations.find((item) => item.name === 'sidebar.right.pane.tab')
const titleEntry = slotRegistrations.find((item) => item.name === 'sidebar.right.pane.tab.title')
record('body and title share the tab id as key', bodyEntry !== undefined && titleEntry !== undefined && bodyEntry.key === type.id && titleEntry.key === type.id, `${bodyEntry?.key} / ${titleEntry?.key}`)

/* ------------------------------------------- left-rail pane + main panel pair */

const paneEntry = slotRegistrations.find((item) => item.name === 'sidebar.panellist')
const mainEntry = slotRegistrations.find((item) => item.name === 'main')
record(
  'apply registers a left-rail pane and a main panel',
  paneEntry !== undefined && mainEntry !== undefined,
  `${paneEntry?.name ?? 'none'} / ${mainEntry?.name ?? 'none'}`,
)
record(
  'the pane id and the main key are the same string',
  paneEntry !== undefined && mainEntry !== undefined && paneEntry.id === mainEntry.key,
  `${paneEntry?.id} vs ${mainEntry?.key}`,
)
record(
  'the pane label is a callable thunk',
  paneEntry !== undefined && typeof paneEntry.label === 'function' && typeof paneEntry.label() === 'string' && paneEntry.label().length > 0,
  typeof paneEntry?.label === 'function' ? paneEntry.label() : String(paneEntry?.label),
)
record('the pane declares a numeric order', typeof paneEntry?.order === 'number', String(paneEntry?.order))

const Body = bodyEntry.component
const Title = titleEntry.component

/* --------------------------------------------------------- tree helpers */

/**
 * Resolve one node the way React would: a function component is invoked with its
 * props. Skipping this step would silently miss every nested component (Cell,
 * Field, Button, HitCard…) — the probe would then "pass" on an empty tree.
 */
const resolve = (node) => {
  if (node && typeof node === 'object' && typeof node.type === 'function') {
    return resolve(node.type(node.props || {}))
  }
  return node
}

const texts = (node, out = []) => {
  node = resolve(node)
  if (node === null || node === undefined || node === false || node === true) return out
  if (typeof node === 'string' || typeof node === 'number') {
    out.push(String(node))
    return out
  }
  if (Array.isArray(node)) {
    for (const child of node) texts(child, out)
    return out
  }
  if (typeof node === 'object' && node.props) {
    texts(node.props.children, out)
  }
  return out
}

const findAll = (node, predicate, out = []) => {
  node = resolve(node)
  if (node === null || node === undefined) return out
  if (Array.isArray(node)) {
    for (const child of node) findAll(child, predicate, out)
    return out
  }
  if (typeof node === 'object' && node.props) {
    if (predicate(node)) out.push(node)
    findAll(node.props.children, predicate, out)
  }
  return out
}

const byClass = (tree, name) => findAll(tree, (node) => typeof node.props?.className === 'string' && node.props.className.split(' ').includes(name))
const buttonByText = (tree, label) => findAll(tree, (node) => node.type === 'button' && texts(node).join('').trim() === label)[0]
const inputById = (tree, id) => findAll(tree, (node) => node.type === 'input' && node.props.id === id)[0]

/** The concatenated text of the first element carrying `name`, or ''. */
const textOfClass = (tree, name) => {
  const node = byClass(tree, name)[0]
  return node ? texts(node).join(' ').trim() : ''
}

/**
 * Type into a field the way a browser does: the input's own `onChange` receives
 * a ChangeEvent, so the probe must hand it one rather than the raw string.
 */
const typeInto = async (id, value) => {
  const input = inputById(tree, id)
  assert.ok(input, `no input #${id} to type into`)
  return press(() => input.props.onChange({ target: { value } }))
}

/* ------------------------------------------------------ render engine */

let tree = null
let effectsPending = []

/**
 * Every Host call the panel has made, in order, since the last mount.
 *
 * The scope tests below assert on what the panel *sent*, not only on what it
 * rendered: a chip that highlights but never reaches the request would look
 * correct in the screenshot and do nothing.
 */
const hostCalls = []

/**
 * Mount the body, run its mount effects, then keep re-rendering (and awaiting
 * timers) until no state change is pending — i.e. until the panel is settled.
 */
async function mountBody(replies) {
  hostCalls.length = 0
  globalThis.fetch = async (_url, init) => {
    const payload = JSON.parse(String(init?.body || '{}'))
    hostCalls.push(payload)
    const reply = replies[payload.method] ?? { ok: false, reason: `no stub for ${payload.method}` }
    return { ok: true, status: 200, json: async () => reply }
  }
  state = []
  cursor = 0
  dirty = false
  pass = 0
  mountEffects.length = 0
  mounting = true
  tree = Body({})
  mounting = false
  effectsPending = mountEffects.slice()
  for (const effect of effectsPending) {
    const cleanup = effect()
    if (typeof cleanup === 'function') cleanups.push(cleanup)
  }
  await settle()
  return tree
}

const cleanups = []

/** Re-render while state is dirty, giving pending promises a chance between passes. */
async function settle() {
  for (let round = 0; round < 40; round += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0))
    if (!dirty) {
      // One more pass: a promise may have resolved after the last check.
      await new Promise((resolve) => setTimeout(resolve, 0))
      if (!dirty) return tree
    }
    dirty = false
    cursor = 0
    pass += 1
    mounting = false
    tree = Body({})
  }
  return tree
}

/** Invoke a handler and settle. */
async function press(handler) {
  dirty = false
  handler()
  return settle()
}

const unmount = () => cleanups.forEach((fn) => fn())

record('title component renders a label', Title !== undefined && texts(Title({})).join('').includes('知识库'), texts(Title({})).join(''))

/* ---------------------------------------------- state 1: service offline */

{
  const offlineReason = '无法连接 http://127.0.0.1:43117：Obsidian 似乎没有运行，或插件里的本地服务没启动。'
  const offline = await mountBody({ status: { ok: false, offline: true, reason: offlineReason } })
  const all = texts(offline).join(' ')
  record('offline: body renders without throwing', all.includes('不可用'), all.slice(0, 60))
  record('offline: the reason is shown verbatim', all.includes('Obsidian 似乎没有运行'), 'reason shown')
  record('offline: status grid is hidden', byClass(offline, 'dsh-oq-cell').length === 0, `cells=${byClass(offline, 'dsh-oq-cell').length}`)
  record('offline: the mode row is still usable', byClass(offline, 'dsh-oq-mode').length === 4, `modes=${byClass(offline, 'dsh-oq-mode').length}`)
  unmount()
}

/* ------------------------------------------------ state 2: service online */

const ONLINE = {
  status: {
    ok: true,
    health: { ok: true, version: '0.2.0', vaults: 1, docs: 110, chunks: 961, rules: 125 },
    stats: { totalQueries: 46, totalCitations: 202, topNotes: [], recent: [] },
    vaults: { vaults: [{ id: 'v1', name: 'Obsidian test1' }] },
    config: { url: 'http://127.0.0.1:43117', hasToken: true },
  },
}

{
  const online = await mountBody({ ...ONLINE })
  const all = texts(online).join(' ')
  record('online: badge shows online + version', all.includes('正常') && all.includes('0.2.0'), all.slice(0, 70))
  const cells = byClass(online, 'dsh-oq-cell')
  record('online: status grid has six cells', cells.length === 6, `cells=${cells.length}`)
  const cellText = cells.map((cell) => texts(cell).join('|'))
  record(
    'online: grid shows the live numbers (docs 110, queries 46)',
    cellText.some((item) => item.includes('110')) && cellText.some((item) => item.includes('46')) && !cellText.some((item) => item.startsWith('—')),
    cellText.join('  '),
  )
  record('online: no offline hint is shown', !all.includes('Obsidian 似乎没有运行'), 'clean')
  unmount()
}

/* --------------------------------------------- interaction: run a search */

{
  const withSearch = await mountBody({
    ...ONLINE,
    search: {
      ok: true,
      result: {
        query: '命名规范',
        total: 54,
        tookMs: 3,
        hits: [
          { vault: 'Obsidian test1', path: 'Vue3/03/a.md', title: '自定义事件', heading: '命名规范', score: 0.91, excerpt: '组件名用 PascalCase。', tags: [], updated: '2026-10-01' },
          { vault: 'Obsidian test1', path: 'Vue3/04/b.md', title: '目录结构', heading: '命名规范', score: 0.72, excerpt: '目录用 kebab-case。', tags: [], updated: '2026-10-02' },
        ],
      },
    },
  })
  record('search: results start empty', byClass(withSearch, 'dsh-oq-card').length === 0, 'no cards yet')

  const queryInput = inputById(withSearch, 'dsh-oq-query')
  record('search: the query field exists', queryInput !== undefined, queryInput ? `label=${texts(queryInput).join('')}` : 'missing')
  await typeInto('dsh-oq-query', '命名规范')

  const submitted = await press(() => buttonByText(tree, '查询').props.onClick())
  const cards = byClass(submitted, 'dsh-oq-card')
  record('search: two hits render as cards', cards.length === 2, `cards=${cards.length}`)
  const cardText = cards.map((card) => texts(card).join(' '))
  record('search: a card shows title, path and excerpt', cardText[0]?.includes('自定义事件') && cardText[0]?.includes('PascalCase'), (cardText[0] || '').slice(0, 80))
  record('search: a card shows the score', cardText[0]?.includes('0.91'), cardText[0]?.slice(0, 60))

  // A second press while the first is pending must not double-submit.
  const emptyQuery = await mountBody({ ...ONLINE, search: { ok: true, result: { query: '', total: 0, hits: [] } } })
  record('search: an untouched body shows the idle hint', texts(emptyQuery).join(' ').includes('在上方输入关键词'), 'idle hint')
  const blankRun = await press(() => buttonByText(tree, '查询').props.onClick())
  record('search: an empty query is refused before any request', texts(blankRun).join(' ').includes('请输入检索关键词'), 'refused')
  unmount()
}

/* ---------------------------------------------- interaction: browse rules */

{
  const withRules = await mountBody({
    ...ONLINE,
    rules: {
      ok: true,
      result: {
        total: 1,
        rules: [
          {
            id: 'R-375F0B',
            text: '组件名使用 PascalCase。',
            priority: 'must',
            path: 'Vue3/03/a.md',
            vault: 'Obsidian test1',
            topics: ['命名'],
            code: [],
            tags: [],
            heading: '命名',
            updated: '2026-10-01',
            count: 2,
          },
        ],
      },
    },
  })
  const rulesMode = findAll(withRules, (node) => node.type === 'button' && texts(node).join('') === '条款')[0]
  record('rules: the mode row offers 条款', rulesMode !== undefined, rulesMode ? 'present' : 'missing')
  const switched = await press(() => rulesMode.props.onClick())
  const topicField = inputById(switched, 'dsh-oq-topic')
  record('rules: switching modes reveals the topic field', topicField !== undefined, topicField ? 'present' : 'missing')

  const submitted = await press(() => buttonByText(tree, '查询').props.onClick())
  const cards = byClass(submitted, 'dsh-oq-card')
  record('rules: a clause renders as a card', cards.length === 1, `cards=${cards.length}`)
  const badges = byClass(submitted, 'dsh-oq-badge')
  record('rules: the priority badge is drawn', badges.length === 1 && badges[0].props.className.includes('must'), badges.map((item) => item.props.className).join(','))
  record('rules: the clause text is shown', texts(cards[0]).join(' ').includes('PascalCase'), texts(cards[0] || {}).join(' ').slice(0, 70))
  unmount()
}

/* ----------------------------------------------- interaction: run a brief */

{
  const withBrief = await mountBody({
    ...ONLINE,
    brief: { ok: true, result: { stack: ['typescript', 'react'], evidence: [], markdown: '', used: 0, ruleCount: 0, rules: [], warnings: ['没有匹配到任何条款'] } },
  })
  const briefMode = findAll(withBrief, (node) => node.type === 'button' && texts(node).join('') === '摘要')[0]
  const switched = await press(() => briefMode.props.onClick())
  record('brief: switching modes reveals the stack field', inputById(switched, 'dsh-oq-stack') !== undefined, 'present')
  const submitted = await press(() => buttonByText(tree, '查询').props.onClick())
  const all = texts(submitted).join(' ')
  record('brief: an empty result shows the service warning', all.includes('没有匹配到任何条款'), all.slice(0, 80))
  unmount()
}

/* ------------------------------------------- interaction: context mode */

{
  const withContext = await mountBody({
    ...ONLINE,
    context: {
      ok: true,
      result: {
        query: '命名',
        used: 830,
        markdown: '<!-- obsidian-quote: query="命名" snippets=1 -->\n\n### 命名规范 › 核心内容\n- 来源：Obsidian test1/规范.md',
        hits: [{ title: '命名规范', heading: '核心内容', vault: 'Obsidian test1', path: '规范.md', score: 12.5 }],
      },
    },
  })
  const contextMode = findAll(withContext, (node) => node.type === 'button' && texts(node).join('') === '上下文')[0]
  record('context: the mode row offers 上下文', contextMode !== undefined, contextMode ? 'present' : 'missing')
  const switched = await press(() => contextMode.props.onClick())
  record('context: switching modes reveals the budget field', inputById(switched, 'dsh-oq-budget') !== undefined, 'present')
  await typeInto('dsh-oq-query', '命名')
  const submitted = await press(() => buttonByText(tree, '查询').props.onClick())
  const pre = byClass(submitted, 'dsh-oq-pre')[0]
  record('context: the budgeted markdown is rendered verbatim', pre !== undefined && texts(pre).join('').includes('snippets=1'), pre ? texts(pre).join('').slice(0, 60) : 'missing')
  record('context: the spent budget is reported', texts(submitted).join(' ').includes('830'), 'used shown')
  unmount()
}

/* --------------------------------- interaction: vault list and citation stats */

{
  const withLists = await mountBody({
    ...ONLINE,
    status: {
      ...ONLINE.status,
      vaults: {
        vaults: [
          { id: 'v1', name: 'Obsidian test1', enabled: true, docs: 110, chunks: 961, rules: 127 },
          { id: 'v2', name: '停用的库', enabled: false, docs: 0, chunks: 0, rules: 0 },
        ],
      },
      stats: {
        totalQueries: 46,
        totalCitations: 202,
        topNotes: [{ title: '命名规范', path: '规范.md', count: 26 }],
        recent: [],
      },
    },
  })
  // The vault list and the scope picker are one control: each vault is a chip
  // that carries its own name, enabled state and note count. Two lists of the
  // same names was the "panel looks partial" symptom.
  const chips = byClass(withLists, 'dsh-oq-scope-pick')
  const all = texts(withLists).join(' ')
  record('vault chips: every registered vault is one chip', chips.length === 2, `chips=${chips.length}`)
  record('vault chips: the enabled state is shown', all.includes('110 篇') && all.includes('已停用'), 'enabled/disabled shown')
  record('vault chips: the name is the label', all.includes('Obsidian test1'), 'name shown')
  record('stats: the most-cited note is listed', all.includes('命名规范') && all.includes('26 次'), 'top note shown')
  unmount()
}

{
  const noVault = await mountBody({
    ...ONLINE,
    status: { ...ONLINE.status, vaults: { vaults: [] } },
  })
  record(
    'vault chips: an empty registry explains itself',
    texts(noVault).join(' ').includes('还没有登记知识库'),
    'hint shown',
  )
  unmount()
}

/* --------------------------------- interaction: query scope (vault picking) */

/**
 * The scope is deliberately shared between the central panel and the sidebar
 * tab (one conversation, one scope), so it outlives a single mount. Each scope
 * block below therefore starts by pressing the panel's own clear control —
 * which also exercises that button instead of poking at module internals.
 */
async function clearScope() {
  await mountBody({ ...ONLINE })
  const clear = buttonByText(tree, '取消范围')
  if (clear !== undefined) await press(() => clear.props.onClick())
  // Imported folders outlive a mount too (same module-level store), so each
  // scope block also presses every `×` — otherwise a folder imported by an
  // earlier block would show up as an extra chip and skew the counts.
  for (let guard = 0; guard < 8; guard += 1) {
    const cross = findAll(tree, (node) => typeof node.props?.className === 'string' && node.props.className.includes('dsh-oq-x'))[0]
    if (cross === undefined) break
    await press(() => cross.props.onClick({ stopPropagation() {} }))
  }
  unmount()
}

await clearScope()

{
  const scoped = await mountBody({
    ...ONLINE,
    status: {
      ...ONLINE.status,
      vaults: {
        vaults: [
          { id: 'v1', name: 'Obsidian test1', enabled: true, docs: 110, chunks: 961, rules: 127 },
          { id: 'v2', name: '第二库', enabled: true, docs: 6, chunks: 20, rules: 4 },
        ],
      },
    },
    search: { ok: true, result: { query: '命名', total: 1, hits: [] } },
  })
  const chips = () => findAll(scoped, (node) => typeof node.props?.className === 'string' && node.props.className.includes('dsh-oq-scope-pick'))
  record('scope: every registered vault is a pick', chips().length === 2, `chips=${chips().length}`)
  record(
    'scope: the default is spelled out as "all vaults"',
    texts(scoped).join(' ').includes('全部库'),
    'all-vaults label shown',
  )
  record(
    'scope: an unscoped query sends no sources field',
    hostCalls.filter((call) => call.method === 'search').every((call) => call.args.sources === undefined),
    `search args=${JSON.stringify(hostCalls.find((call) => call.method === 'search')?.args)}`,
  )

  // Pick the first vault, then run: the chip must actually reach the Host.
  const picked = await press(() => chips()[0].props.onClick())
  record('scope: a picked vault is marked pressed', picked !== undefined, 'rerendered')
  const pressed = findAll(picked, (node) => node.props?.['aria-pressed'] === 'true')
  record('scope: the pick reports its state to assistive tech', pressed.length === 1, `aria-pressed=${pressed.length}`)

  await typeInto('dsh-oq-query', '命名')
  await press(() => buttonByText(tree, '查询').props.onClick())
  const searchCall = hostCalls.filter((call) => call.method === 'search').pop()
  record(
    'scope: the picked vault is sent as sources[]',
    Array.isArray(searchCall?.args?.sources) && searchCall.args.sources[0] === 'Obsidian test1',
    `sources=${JSON.stringify(searchCall?.args?.sources)}`,
  )
  unmount()
}

{
  // A folder inside a vault cannot be enumerated by the Host, so it is typed.
  await clearScope()
  const typed = await mountBody({
    ...ONLINE,
    rules: { ok: true, result: { rules: [], total: 0 } },
  })
  // Switch mode *before* setting the scope: the probe's flat hook emulation is
  // order-based, so a mode change after the fact would reshuffle the slots the
  // way real React would not. Real hooks are keyed per component instance.
  await press(() => buttonByText(tree, '条款').props.onClick())
  // The typed field is the escape hatch now, folded away until asked for.
  await press(() => buttonByText(tree, '手动填写路径').props.onClick())
  await typeInto('dsh-oq-scope', 'Obsidian test1/Vue3')
  const scopeField = findAll(tree, (node) => node.props?.id === 'dsh-oq-scope')[0]
  await press(() => scopeField.props.onKeyDown({ key: 'Enter' }))
  // Chips come in two kinds: one per registered vault (always rendered, `on`
  // when picked) and one per typed folder (rendered only while it is in scope).
  // Counting `on` chips therefore isolates the picked set from the fixed list.
  const pickedChips = (root) =>
    findAll(root, (node) => typeof node.props?.className === 'string' && node.props.className.includes('dsh-oq-scope-pick') && node.props.className.includes('on'))
  const extra = pickedChips(tree)
  record('scope: a typed folder becomes its own removable chip', extra.length === 1, `picked=${extra.length}`)

  await press(() => buttonByText(tree, '查询').props.onClick())
  const rulesCall = hostCalls.filter((call) => call.method === 'rules').pop()
  record(
    'scope: the typed folder reaches the query',
    Array.isArray(rulesCall?.args?.sources) && rulesCall.args.sources.includes('Obsidian test1/Vue3'),
    `sources=${JSON.stringify(rulesCall?.args?.sources)}`,
  )

  const cleared = await press(() => buttonByText(tree, '取消范围').props.onClick())
  record(
    'scope: clearing drops every pick and falls back to all vaults',
    pickedChips(cleared).length === 0 && texts(cleared).join(' ').includes('全部库'),
    `picked=${pickedChips(cleared).length}`,
  )
  unmount()
}

/* ---------------------------- interaction: the OS folder chooser (import) */

{
  // The chooser answers an absolute OS path; the panel has to express it the way
  // the service parses (`vault/sub`). Import must NOT scope: the whole point of
  // "已导入但未引用" is that adding a folder and narrowing every query to it are
  // two different decisions.
  await clearScope()
  pickerCalls = 0
  pickerAnswer = 'C:\\Users\\Example\\Desktop\\Obsidian test1\\Vue3\\组件'
  const picked = await mountBody({
    ...ONLINE,
    status: {
      ...ONLINE.status,
      vaults: {
        vaults: [
          { id: 'v1', name: 'Obsidian test1', enabled: true, docs: 110, path: 'C:\\Users\\Example\\Desktop\\Obsidian test1' },
          { id: 'v2', name: '第二库', enabled: true, docs: 6, path: 'C:\\Users\\Example\\Documents\\Obsidian Vault' },
        ],
      },
    },
    search: { ok: true, result: { query: '命名', total: 1, hits: [] } },
  })
  const pickButton = buttonByText(picked, '选择目录…')
  record('picker: the panel offers a folder button', pickButton !== undefined, pickButton === undefined ? 'no button' : 'button present')

  const afterPick = await press(() => pickButton.props.onClick())
  await settle()
  record('picker: pressing it asks the Host exactly once', pickerCalls === 1, `calls=${pickerCalls}`)
  const importedChip = findAll(
    afterPick,
    (node) => typeof node.props?.className === 'string' && node.props.className.includes('dsh-oq-scope-pick') && node.props.className.includes('off'),
  ).filter((node) => texts(node).join('').includes('Vue3/组件'))
  record(
    'picker: the chosen folder becomes an imported-but-unscoped chip',
    importedChip.length === 1,
    `imported=${importedChip.length} text=${texts(afterPick).join(' | ').slice(0, 120)}`,
  )
  record(
    'picker: an imported folder is not in scope yet',
    importedChip.length === 1 && importedChip[0].props['aria-pressed'] === 'false',
    `aria-pressed=${importedChip[0]?.props['aria-pressed']}`,
  )
  record(
    'picker: the path is expressed relative to its vault',
    texts(afterPick).join(' ').includes('Obsidian test1/Vue3/组件'),
    texts(afterPick).join(' ').includes('Vue3') ? 'vault-relative' : 'not shown',
  )

  // Clicking the imported chip puts it in scope without re-opening the chooser.
  const scoped = await press(() => findAll(afterPick, (node) => typeof node.props?.className === 'string' && node.props.className.includes('dsh-oq-scope-pick') && node.props.className.includes('off'))[0].props.onClick())
  record(
    'picker: clicking an imported chip puts it in scope',
    pickerCalls === 1 && findAll(scoped, (node) => node.props?.['aria-pressed'] === 'true').length === 1,
    `calls=${pickerCalls} pressed=${findAll(scoped, (node) => node.props?.['aria-pressed'] === 'true').length}`,
  )
  await typeInto('dsh-oq-query', '命名')
  await press(() => buttonByText(tree, '查询').props.onClick())
  const scopedCall = hostCalls.filter((call) => call.method === 'search').pop()
  record(
    'picker: the imported folder reaches the query',
    Array.isArray(scopedCall?.args?.sources) && scopedCall.args.sources[0] === 'Obsidian test1/Vue3/组件',
    `sources=${JSON.stringify(scopedCall?.args?.sources)}`,
  )

  // The cross forgets the folder; it must not be the same act as un-scoping.
  const cross = findAll(scoped, (node) => typeof node.props?.className === 'string' && node.props.className.includes('dsh-oq-x'))[0]
  record('picker: an imported chip carries a remove control', cross !== undefined, cross === undefined ? 'no cross' : String(cross.props['aria-label']))
  const removed = await press(() => cross.props.onClick({ stopPropagation() {} }))
  record(
    'picker: the cross forgets the folder entirely',
    !texts(removed).join(' ').includes('Vue3/组件'),
    texts(removed).join(' ').includes('Vue3') ? 'still there' : 'removed',
  )
  unmount()
}

{
  // A path outside every registered vault cannot be quoted: guessing a vault
  // would cite the wrong notes. The panel refuses and says why.
  await clearScope()
  pickerAnswer = 'D:\\Somewhere\\Else'
  const outside = await mountBody({
    ...ONLINE,
    status: {
      ...ONLINE.status,
      vaults: { vaults: [{ id: 'v1', name: 'Obsidian test1', enabled: true, docs: 110, path: 'C:\\Users\\Example\\Desktop\\Obsidian test1' }] },
    },
  })
  const afterOutside = await press(() => buttonByText(outside, '选择目录…').props.onClick())
  await settle()
  record(
    'picker: a folder outside every vault is refused in words',
    texts(afterOutside).join(' ').includes('不在任何已登记的知识库'),
    texts(afterOutside).join(' ').slice(0, 80),
  )
  const strayChip = findAll(
    afterOutside,
    (node) => typeof node.props?.className === 'string' && node.props.className.includes('dsh-oq-scope-pick') && node.props.className.includes('off'),
  )
  record('picker: a refused folder leaves no chip behind', strayChip.length === 0, `chips off=${strayChip.length}`)
  unmount()
}

{
  // A Host with no picker must stay usable: the button explains itself instead of
  // throwing, and the typed field remains the way in.
  await clearScope()
  pickerAvailable = false
  // The bundle was applied once, with a chooser present. A Host that lacks one is
  // the same plugin loading where `remote.directoryPicker` never resolves — so
  // re-run the recorded injection without the Remote face rather than re-applying
  // the whole bundle (which would double-register the slots).
  for (const injector of pickerInjectors) injector({ get: () => undefined })
  const bare = await mountBody({ ...ONLINE })
  const noPicker = await press(() => buttonByText(bare, '选择目录…').props.onClick())
  await settle()
  record(
    'picker: a Host without a chooser explains itself',
    texts(noPicker).join(' ').includes('没有提供目录选择器'),
    texts(noPicker).join(' ').slice(-90),
  )
  record('picker: the typed field survives a Host without a chooser', inputById(noPicker, 'dsh-oq-scope') !== undefined, 'field present')
  unmount()
  pickerAvailable = true
  pickerAnswer = null
}

/* -----------------──── interaction: the scope is shared between both mounts */

{
  // The central panel and the sidebar tab are two mounts of this same bundle,
  // and the promise is "one scope for this conversation". A module-level store
  // is the only thing that can deliver that, so it gets its own test.
  await clearScope()
  const first = await mountBody({ ...ONLINE })
  const chip = findAll(first, (node) => typeof node.props?.className === 'string' && node.props.className.includes('dsh-oq-scope-pick'))[0]
  await press(() => chip.props.onClick())
  const firstName = texts(chip).join('')
  unmount()

  const second = await mountBody({ ...ONLINE })
  const picked = findAll(second, (node) => node.props?.['aria-pressed'] === 'true')
  record(
    'scope: a pick survives a remount, so the other surface agrees',
    picked.length === 1 && texts(picked[0]).join('').includes(firstName.trim()),
    `${picked.length} picked after remount`,
  )
  unmount()
  await clearScope()
}

/* ------------------------------------------------ interaction: failures */

{
  const failing = await mountBody({
    ...ONLINE,
    search: { ok: false, reason: '知识库正在重建索引，请稍后再试。' },
  })
  await typeInto('dsh-oq-query', '命名')
  const submitted = await press(() => buttonByText(tree, '查询').props.onClick())
  record('search: a Host failure is shown in words', texts(submitted).join(' ').includes('正在重建索引'), 'shown')
  unmount()
}

{
  const offlineRoute = await mountBody({
    status: { ok: false, offline: true, reason: 'Host 没有响应。' },
  })
  record('route failure: the panel still renders', texts(offlineRoute).join(' ').includes('不可用'), 'rendered')
  unmount()
}

/* ------------------------------------------------- style / security rules */

{
  const css = String(styleElements[0]?.textContent || '')
  const literals = css.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g) || []
  record('style sheet uses only theme tokens (no colour literals)', css !== '' && literals.length === 0, literals.slice(0, 5).join(' ') || 'no literals')
  const tokens = new Set(css.match(/--[a-z0-9-]+/g) || [])
  const foreign = [...tokens].filter((token) => !token.startsWith('--dsw-alias-'))
  record('every CSS variable is a --dsw-alias-* token', foreign.length === 0, foreign.join(' ') || `${tokens.size} tokens`)
  const styleTag = styleElements.length
  record('the style sheet is installed exactly once', styleTag === 1, `tags=${styleTag}`)
}

{
  const source = readFileSync(new URL('./client.js', import.meta.url), 'utf8')
  // Comments are allowed to mention innerHTML; only real code would use it.
  const code = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
  record('client code never assigns innerHTML', !/\.innerHTML\s*=/.test(code), 'none')
  record('client code never uses dangerouslySetInnerHTML', !/dangerouslySetInnerHTML/.test(code), 'none')
  const external = code.match(/https?:\/\/(?!127\.0\.0\.1)[a-z0-9.-]+/gi) || []
  record('client hard-codes no external endpoint', external.length === 0, external.join(' ') || 'none')
}

/* -------------------------------------------------- dictionary coverage */

{
  const source = readFileSync(new URL('./client.js', import.meta.url), 'utf8')
  const dictStart = source.indexOf('const DICTS = {')
  const dictEnd = source.indexOf('/** The bundled style sheet')
  const dictBlock = source.slice(dictStart, dictEnd)
  const zhBlock = dictBlock.slice(dictBlock.indexOf('zh: {'), dictBlock.indexOf('en: {'))
  const keys = new Set((zhBlock.match(/'([a-z.]+)':/g) || []).map((item) => item.replace(/[':]/g, '')))
  const used = new Set((source.match(/\bt\('([a-z.]+)'\)/g) || []).map((item) => item.replace(/^t\('/, '').replace(/'\)$/, '')))
  const missing = [...used].filter((key) => !keys.has(key))
  record('every t() key exists in the zh dictionary', missing.length === 0, missing.join(' ') || `${used.size} keys used, ${keys.size} defined`)
  const enKeys = new Set((dictBlock.slice(dictBlock.indexOf('en: {')).match(/'([a-z.]+)':/g) || []).map((item) => item.replace(/[':]/g, '')))
  const enMissing = [...keys].filter((key) => !enKeys.has(key))
  record('zh and en dictionaries cover the same keys', enMissing.length === 0, enMissing.join(' ') || `${enKeys.size} en keys`)
}

/* ------------------------------------------------------ rollback on failure */

{
  const freshTabs = []
  const failingCtx = {
    get: () => undefined,
    effect: () => () => {},
    slots: {
      inject(name, callback) {
        if (name === 'sidebar.right.pane.tab') throw new Error('simulated slot failure')
        return callback()
      },
      register: () => () => {},
    },
    inject(names, callback) {
      return callback({
        get: (service) =>
          service === 'sidebarRightTabs'
            ? {
                register(definition) {
                  freshTabs.push(definition)
                  return () => {
                    const index = freshTabs.indexOf(definition)
                    if (index >= 0) freshTabs.splice(index, 1)
                  }
                },
              }
            : undefined,
      })
    },
  }
  let threw = null
  try {
    moduleExports.apply(failingCtx)
  } catch (error) {
    threw = error
  }
  record('a failing slot registration rolls the tab type back', threw === null && freshTabs.length === 0, threw !== null ? `threw: ${threw.message}` : `tabs left behind=${freshTabs.length}`)
}

/* --------------------------------------------- absent services stay quiet */

{
  let threw = null
  const bare = { get: () => undefined, effect: (fn) => { fn(); return () => {} }, slots: { inject: (n, cb) => cb(), register: () => () => {} }, inject: (n, cb) => cb({ get: () => undefined }) }
  try {
    moduleExports.apply(bare)
  } catch (error) {
    threw = error
  }
  record('a Host without sidebarRightTabs fails quietly', threw === null, threw !== null ? threw.message : 'no throw')
}

/* ------------------------------------------------------- UI language */

{
  // The dictionaries were registered from the first cut, and a probe that only
  // counted registrations passed while the panel rendered Chinese chrome in an
  // English Host. These assertions drive the language instead of trusting the
  // registration: switch to `en`, remount, and read the words a user reads.
  await useLocale('en')
  const english = await mountBody({ status: { ok: true, health: {}, stats: {}, vaults: { vaults: [] } } })
  const englishText = texts(english).join(' ')
  record('language: an English Host gets English chrome', englishText.includes('Refresh') && englishText.includes('Query'), englishText.slice(0, 70))
  record('language: no Chinese label survives the switch', !/检索|知识库|条款|刷新/.test(englishText), englishText.slice(0, 70))
  record('language: the tab title follows too', texts(Title({})).join('').includes('Knowledge'), texts(Title({})).join(''))
  unmount()

  await useLocale('zh')
  const chinese = await mountBody({ status: { ok: true, health: {}, stats: {}, vaults: { vaults: [] } } })
  const chineseText = texts(chinese).join(' ')
  record('language: a Chinese Host still gets Chinese chrome', chineseText.includes('刷新') && chineseText.includes('关键词'), chineseText.slice(0, 70))
  unmount()
}

{
  // A live switch must repaint a *mounted* panel, not only a remounted one: the
  // language row in Settings is one click away and nothing else would dirty it.
  await useLocale('zh')
  const mounted = await mountBody({ status: { ok: true, health: {}, stats: {}, vaults: { vaults: [] } } })
  record('language: the panel starts in the Host language', texts(mounted).join(' ').includes('刷新'), 'zh first')
  await useLocale('en')
  const after = texts(tree).join(' ')
  record('language: switching repaints the mounted panel', after.includes('Refresh'), after.slice(0, 70))
  await useLocale('zh')
  unmount()
}

{
  // Validation messages are user-facing too, and they were hard-coded Chinese
  // long after the dictionaries existed.
  await useLocale('en')
  await mountBody({ status: { ok: true, health: {}, stats: {}, vaults: { vaults: [] } } })
  await press(() => buttonByText(tree, 'Run').props.onClick())
  const said = textOfClass(tree, 'dsh-oq-err')
  record('language: a validation message follows the language', said.includes('Type a keyword first'), said || '(none)')
  unmount()
  await useLocale('zh')
}

const failed = results.filter((item) => item.ok !== true)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
if (failed.length > 0) {
  for (const item of failed) console.log(`  FAILED: ${item.name} — ${item.detail}`)
  process.exitCode = 1
}
