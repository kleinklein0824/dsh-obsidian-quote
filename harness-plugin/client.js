/**
 * dsh-obsidian-quote-panel — Client half.
 *
 * One tab in the right Sidebar. It answers two questions the model already asks
 * the MCP tools: *is the knowledge base reachable, and what does it say about X?*
 * The difference is who gets the answer — the model gets it as a tool result,
 * a human gets it as something readable, and both read the same service, so the
 * two can never disagree.
 *
 * Three rules the harness's plugin guidance imposes, kept deliberately:
 *
 *  - Only host theme tokens colour the chrome (`--dsw-alias-*`). A hard-coded
 *    colour is invisible in the other theme, and a plugin that looks foreign
 *    reads as untrusted.
 *  - Every piece of text is a React child, i.e. a text node. Nothing goes
 *    through `innerHTML`: note titles, rule ids, excerpts and error strings all
 *    end up on screen and every one of them originates outside this plugin.
 *  - The factory is side-effect free. Styles and registrations are mounted in
 *    `apply` through `ctx.effect` / `ctx.slots.inject`, so unloading the plugin
 *    removes them.
 *
 * Fail-open throughout: a Host that does not answer, or an Obsidian app that is
 * closed, leaves the tab explaining why instead of throwing. A tab body that
 * throws would blank the whole right Sidebar.
 */
window.__ModuleLoader__.load({
  id: 'dsh-obsidian-quote-panel',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const NS = 'obsidian-quote'
    const RPC = '/dsh-obsidian-quote-panel/rpc'
    /** Tab type id — also the key the body and chip title register under. */
    const TAB_ID = 'dsh-obsidian-quote-panel:kb'
    /** Tab kind — the discriminator `openTab` names. */
    const TAB_KIND = 'dsh-obsidian-quote:kb'
    /**
     * The left-rail entry id, used twice on purpose: as the pane-list `id` and as
     * the `main` entry `key`. `layout.selectPanel` and the central dispatch both
     * compare those two strings, so they must stay identical.
     */
    const PANEL_ID = 'dsh-obsidian-quote'
    /**
     * Printed in the panel header so a screenshot answers "which build is this"
     * without anyone reading devtools. Bump it whenever the rendered shape
     * changes in a way a user would notice.
     */
    const BUILD_TAG = 'v0.5.1 · i18n'

    /**
     * Dictionaries live in the bundle: the Client half is one plain-JS file
     * served as-is, with no JSON loader in front of it.
     */
    const DICTS = {
      zh: {
        'tab.title': '知识库',
        'guide.title': 'Obsidian 知识库',
        'guide.description': '查看本地知识库状态、按关键词检索、浏览规范条款。',
        'status.title': '服务状态',
        'status.online': '正常',
        'status.offline': '不可用',
        'status.vaults': '知识库',
        'status.docs': '笔记',
        'status.chunks': '段落',
        'status.rules': '条款',
        'status.searches': '检索次数',
        'status.citations': '引用片段',
        'mode.search': '检索',
        'mode.context': '上下文',
        'mode.rules': '条款',
        'mode.brief': '摘要',
        'field.budget': '字符预算',
        'sources.title': '引用范围',
        'sources.hint': '不勾选任何库时，检索范围是全部已启用的知识库。',
        'sources.all': '全部库',
        'sources.selected': '已选',
        'sources.pathHint': '可以写成「库名/子目录」只引用该目录，例如 Obsidian test1/Vue3。',
        'sources.apply': '应用范围',
        'sources.clear': '取消范围',
        'sources.pick': '选择目录…',
        'sources.picking': '正在选择…',
        'sources.imported': '已导入',
        'sources.picked': '已引用',
        'sources.unpicked': '已导入，未引用',
        'sources.remove': '移除这个引用范围',
        'sources.noPicker': '宿主没有提供目录选择器，请在下面的输入框里手动填写路径。',
        'sources.outsideVault': '这个目录不在任何已登记的知识库里。请先在 Obsidian 的插件面板登记该知识库，再回来选择它里面的目录。',
        'sources.pickFailed': '目录选择没有完成。',
        'sources.manual': '手动填写路径',
        'sources.manualHide': '收起手填',
        'sources.howto': '点知识库或文件夹来选中（选中高亮），再查询；「选择目录…」把某个子目录加进来，加进来但没点的就是「已导入，未引用」。',
        'context.used': '已用字符',
        'context.hint': '预算内的规范上下文，可直接交给模型。',
        'vaults.title': '知识库清单',
        'vaults.enabled': '已启用',
        'vaults.disabled': '已停用',
        'stats.title': '引用统计',
        'stats.topNotes': '被引用最多的笔记',
        'stats.recent': '最近引用',
        'state.noVaults': '还没有登记知识库：请在 Obsidian 的插件面板里添加。',
        'field.query': '关键词',
        'field.queryPlaceholder': '例如：命名规范、目录结构',
        'field.topic': '主题',
        'field.topicPlaceholder': '例如：命名、测试',
        'field.stack': '技术栈',
        'field.stackPlaceholder': '例如：typescript, react',
        'field.limit': '条数',
        'action.run': '查询',
        'action.refresh': '刷新',
        'action.clear': '清空',
        'state.loading': '加载中…',
        'state.empty': '没有结果。换个关键词试试。',
        'state.idle': '在上方输入关键词后点击查询。',
        'hit.heading': '章节',
        'hit.score': '相关度',
        'hint.noToken': '没有读到接入令牌：请在 Obsidian 的插件面板复制接入配置。',
        'hint.offline': '本地服务没有响应。请确认 Obsidian 已启动，且「Obsidian Quote」插件已启用本地服务。',
        'hint.readonly': '只读：这里不会修改你的知识库。',
        'error.needQuery': '请输入检索关键词。',
        'error.queryFailed': '查询失败。',
        'error.buildFailed': '生成失败。',
        'error.needStack': '请输入技术栈，例如 typescript, react。',
        'vaults.docs': '篇',
        'stats.citations': '次',
        'context.snippets': '段',
      },
      en: {
        'tab.title': 'Knowledge',
        'guide.title': 'Obsidian knowledge base',
        'guide.description': 'Live status, keyword search and rule browsing for the local vault.',
        'status.title': 'Service',
        'status.online': 'online',
        'status.offline': 'offline',
        'status.vaults': 'Vaults',
        'status.docs': 'Notes',
        'status.chunks': 'Chunks',
        'status.rules': 'Rules',
        'status.searches': 'Searches',
        'status.citations': 'Cited',
        'mode.search': 'Search',
        'mode.context': 'Context',
        'mode.rules': 'Rules',
        'mode.brief': 'Brief',
        'field.budget': 'Budget',
        'sources.title': 'Scope',
        'sources.hint': 'With nothing checked, queries run across every enabled vault.',
        'sources.all': 'All vaults',
        'sources.selected': 'selected',
        'sources.pathHint': 'Use "vault/folder" to narrow to one folder, e.g. Obsidian test1/Vue3.',
        'sources.apply': 'Apply scope',
        'sources.clear': 'Clear scope',
        'sources.pick': 'Choose a folder…',
        'sources.picking': 'Choosing…',
        'sources.imported': 'imported',
        'sources.picked': 'in scope',
        'sources.unpicked': 'imported, not in scope',
        'sources.remove': 'Remove this scope',
        'sources.noPicker': 'The Host exposes no directory picker; type the path in the field below instead.',
        'sources.outsideVault': 'That folder is not inside any registered vault. Register the vault in the Obsidian plugin panel first, then pick a folder inside it.',
        'sources.pickFailed': 'The folder chooser did not finish.',
        'sources.manual': 'Type a path instead',
        'sources.manualHide': 'Hide the path field',
        'sources.howto': 'Click a vault or folder to put it in scope (highlighted = in scope), then run the query. “Choose a folder…” imports a subfolder; imported but not clicked means “imported, not in scope”.',
        'context.used': 'chars used',
        'context.hint': 'Budgeted markdown, ready to hand to the model.',
        'vaults.title': 'Vaults',
        'vaults.enabled': 'enabled',
        'vaults.disabled': 'disabled',
        'stats.title': 'Citation stats',
        'stats.topNotes': 'Most-cited notes',
        'stats.recent': 'Recent citations',
        'state.noVaults': 'No vault is registered yet: add one in the Obsidian plugin panel.',
        'field.query': 'Query',
        'field.queryPlaceholder': 'e.g. naming, folder layout',
        'field.topic': 'Topic',
        'field.topicPlaceholder': 'e.g. naming, tests',
        'field.stack': 'Stack',
        'field.stackPlaceholder': 'e.g. typescript, react',
        'field.limit': 'Limit',
        'action.run': 'Run',
        'action.refresh': 'Refresh',
        'action.clear': 'Clear',
        'state.loading': 'Loading…',
        'state.empty': 'Nothing found. Try another keyword.',
        'state.idle': 'Type a keyword above, then run the query.',
        'hit.heading': 'Section',
        'hit.score': 'Score',
        'hint.noToken': 'No access token was found: copy the connection settings from the Obsidian plugin panel.',
        'hint.offline': 'The local service did not answer. Check that Obsidian is running and that the "Obsidian Quote" plugin has its local server enabled.',
        'hint.readonly': 'Read-only: nothing here modifies your vault.',
        'error.needQuery': 'Type a keyword first.',
        'error.queryFailed': 'The query failed.',
        'error.buildFailed': 'The request failed.',
        'error.needStack': 'Name a stack, for example typescript, react.',
        'vaults.docs': 'notes',
        'stats.citations': 'uses',
        'context.snippets': 'snippets',
      },
    }

    /**
     * The picked `sources`, shared by every mount of this bundle.
     *
     * The same panel is mounted twice — as the central `main` panel and as a
     * right-sidebar tab — and each mount has its own React state. A module-level
     * store is what makes a choice made in one surface apply to the other, which
     * is the whole point of "one scope for this conversation": pick once, then
     * query from wherever you happen to be looking.
     */
    let sharedSources = []
    const scopeListeners = new Set()

    function readSharedSources() {
      return sharedSources
    }

    function writeSharedSources(next) {
      sharedSources = Array.isArray(next) ? next.slice() : []
      for (const listener of scopeListeners) listener(sharedSources)
    }

    /**
     * Folders the user brought in through the Host's folder chooser.
     *
     * Two states, on purpose. "Imported" is the short list of directories this
     * conversation knows about; "in scope" is the subset a query is actually
     * limited to. A folder lands here imported-but-not-in-scope so that adding a
     * directory is not silently the same act as narrowing every query to it —
     * the user clicks a chip to put it in scope, and can drop it again.
     *
     * Registered vaults are not in this list: they live in the Obsidian plugin
     * registry, which this panel only reads.
     */
    let sharedImported = []
    const importedListeners = new Set()

    function readSharedImported() {
      return sharedImported
    }

    function writeSharedImported(next) {
      sharedImported = Array.isArray(next) ? next.slice() : []
      for (const listener of importedListeners) listener(sharedImported)
    }

    /**
     * The Host's `remote.directoryPicker` face, once the Client has mounted it.
     *
     * `ctx.inject` resolves after `apply` returns, and a headless Host has no
     * picker at all, so this starts as `null` and the panel degrades to the text
     * field. Readers subscribe instead of reading once, because the service can
     * arrive (or go away) long after the first render.
     */
    let pickerBridge = null
    const pickerListeners = new Set()

    function readPicker() {
      return pickerBridge
    }

    function writePicker(next) {
      pickerBridge = next
      for (const listener of pickerListeners) listener(pickerBridge)
    }

    /**
     * The active UI language, as the Host's locale service reports it.
     *
     * The panel used to read `DICTS.zh` unconditionally, which meant an English
     * operator saw Chinese chrome while `locale/en.json` was correctly exposed on
     * the plugin page — the dictionaries were registered but never consulted.
     * Resolving through the service (`bind(NS)` returns a `t(key)` that walks the
     * active language's fallback chain) keeps the panel in step with the UI
     * language, including when the operator switches it without a reload.
     *
     * `readLocale()` is the fallback for a Host without the service: it returns
     * the raw dictionary for a language id, so `t()` still works.
     */
    let localeBridge = null
    const localeListeners = new Set()

    function readLocale() {
      return localeBridge
    }

    function writeLocale(next) {
      localeBridge = next
      for (const listener of localeListeners) listener(localeBridge)
    }

    /**
     * Resolve `key` against whatever the locale service currently reports.
     *
     * Order matters: a bound translator from the service wins, because it already
     * followed the fallback chain; otherwise pick the dictionary named by the
     * active locale id; otherwise Chinese, which is this plugin's source language.
     */
    function translate(key) {
      const bridge = readLocale()
      if (bridge !== null && typeof bridge.translate === 'function') {
        const value = bridge.translate(key)
        if (typeof value === 'string' && value !== '') return value
      }
      const active = bridge !== null && typeof bridge.locale === 'string' ? bridge.locale : ''
      const dict = DICTS[active] || DICTS.zh
      const value = dict[key]
      if (typeof value === 'string') return value
      return key
    }

    /**
     * Read the chosen path out of whatever the picker resolved to.
     *
     * The Client Remote face answers `{ ok: true, value }` / `{ ok: false, error }`,
     * but a direct provider may resolve the bare string, and a cancelled dialog
     * resolves `null`. All three are treated as data here rather than branched on
     * at every call site.
     */
    function pickedPath(reply) {
      if (typeof reply === 'string') return reply
      if (reply === null || typeof reply !== 'object') return ''
      if (reply.ok === false) return ''
      const value = reply.value
      return typeof value === 'string' ? value : ''
    }

    /**
     * Turn an absolute directory path into the wire form the service parses.
     *
     * The service takes either a bare vault name or `vault/sub/folder`
     * (`plugin/src/server.ts` `asSources`), so a picked OS path has to be
     * expressed relative to the vault that owns it. Returns `null` when the
     * directory is outside every registered vault: guessing a vault there would
     * quote the wrong notes, which is worse than refusing.
     */
    function sourceForPickedPath(path, vaults) {
      const normalize = (value) => String(value || '').replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase()
      const target = normalize(path)
      if (target === '') return null
      let best = null
      for (const vault of vaults) {
        const root = normalize(vault && vault.path)
        if (root === '') continue
        if (target !== root && !target.startsWith(root + '/')) continue
        // Deepest root wins: a vault nested inside another would otherwise be
        // read through its parent's name.
        if (best === null || root.length > normalize(best.path).length) best = vault
      }
      if (best === null) return null
      const name = String(best.name || best.id || '')
      if (name === '') return null
      const root = normalize(best.path)
      const rest = String(path || '').replace(/\\/g, '/').replace(/\/+$/, '').slice(root.length)
      const tail = rest.replace(/^\/+/, '')
      return tail === '' ? name : `${name}/${tail}`
    }
    const STYLE_ID = 'dsh-oq-styles'
    const CSS = `
.dsh-oq-root { display:flex; flex-direction:column; gap:10px; height:100%; min-height:0; padding:10px 12px 14px; box-sizing:border-box; font-size:12px; color:var(--dsw-alias-label-primary); }
.dsh-oq-main { height:100%; min-height:0; overflow:auto; background:var(--dsw-alias-bg-layer-0); }
.dsh-oq-main .dsh-oq-root { max-width:760px; margin:0 auto; height:auto; min-height:100%; }
.dsh-oq-main .dsh-oq-list { flex:0 0 auto; }
.dsh-oq-head { display:flex; align-items:baseline; justify-content:space-between; gap:8px; }
.dsh-oq-title { font-size:13px; font-weight:600; }
.dsh-oq-sub { color:var(--dsw-alias-label-secondary); font-size:11px; word-break:break-all; }
.dsh-oq-dot { display:inline-block; width:7px; height:7px; border-radius:50%; margin-right:5px; vertical-align:middle; background:var(--dsw-alias-label-secondary); }
.dsh-oq-dot.ok { background:var(--dsw-alias-state-success-primary); }
.dsh-oq-dot.bad { background:var(--dsw-alias-state-error-primary); }
.dsh-oq-build { flex:0 0 auto; padding:1px 6px; border-radius:5px; border:1px solid var(--dsw-alias-border-secondary); color:var(--dsw-alias-label-secondary); font-size:9px; font-variant-numeric:tabular-nums; white-space:nowrap; }
.dsh-oq-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; }
.dsh-oq-cell { background:var(--dsw-alias-bg-layer-1); border:1px solid var(--dsw-alias-border-l1); border-radius:6px; padding:6px 8px; min-width:0; }
.dsh-oq-cell b { display:block; font-size:14px; font-weight:600; font-variant-numeric:tabular-nums; }
.dsh-oq-cell span { color:var(--dsw-alias-label-secondary); font-size:10px; }
.dsh-oq-modes { display:flex; gap:4px; }
.dsh-oq-mode { flex:1 1 0; padding:4px 6px; font-size:11px; border-radius:5px; cursor:pointer; border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-secondary); }
.dsh-oq-mode.on { color:var(--dsw-alias-label-primary); border-color:var(--dsw-alias-brand-primary); background:var(--dsw-alias-bg-layer-2); }
.dsh-oq-field { display:flex; flex-direction:column; gap:3px; }
.dsh-oq-field label { color:var(--dsw-alias-label-secondary); font-size:10px; }
.dsh-oq-input { width:100%; box-sizing:border-box; padding:5px 7px; font-size:12px; border-radius:5px; border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-primary); font-family:inherit; }
.dsh-oq-input:focus { outline:none; border-color:var(--dsw-alias-brand-primary); }
.dsh-oq-actions { display:flex; gap:6px; }
.dsh-oq-btn { padding:5px 12px; font-size:11px; border-radius:5px; cursor:pointer; border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-primary); }
.dsh-oq-btn.primary { border-color:var(--dsw-alias-brand-primary); }
.dsh-oq-btn:disabled { opacity:.5; cursor:default; }
.dsh-oq-hint { margin:0; color:var(--dsw-alias-label-secondary); font-size:11px; line-height:1.5; }
.dsh-oq-err { margin:0; color:var(--dsw-alias-state-error-primary); font-size:11px; line-height:1.5; word-break:break-word; }
.dsh-oq-list { flex:1 1 auto; min-height:0; overflow:auto; display:flex; flex-direction:column; gap:8px; }
.dsh-oq-card { border:1px solid var(--dsw-alias-border-l1); border-radius:6px; background:var(--dsw-alias-bg-layer-1); padding:7px 9px; min-width:0; }
.dsh-oq-card h4 { margin:0 0 3px; font-size:12px; font-weight:600; word-break:break-word; }
.dsh-oq-meta { color:var(--dsw-alias-label-secondary); font-size:10px; margin:0 0 4px; word-break:break-all; }
.dsh-oq-excerpt { margin:0; font-size:11px; line-height:1.55; white-space:pre-wrap; word-break:break-word; color:var(--dsw-alias-label-primary); }
.dsh-oq-pre { margin:0; padding:8px 10px; border:1px solid var(--dsw-alias-border-l1); border-radius:6px; background:var(--dsw-alias-bg-layer-1); font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; font-size:11px; line-height:1.55; white-space:pre-wrap; word-break:break-word; overflow-x:auto; color:var(--dsw-alias-label-primary); }
.dsh-oq-sec { margin:2px 0 0; color:var(--dsw-alias-label-secondary); font-size:10px; font-weight:600; letter-spacing:.04em; }
.dsh-oq-rows { display:flex; flex-direction:column; gap:3px; }
.dsh-oq-row { display:flex; align-items:baseline; gap:6px; min-width:0; font-size:11px; }
.dsh-oq-row-name { flex:1 1 auto; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.dsh-oq-row-meta { flex:0 0 auto; color:var(--dsw-alias-label-secondary); font-size:10px; font-variant-numeric:tabular-nums; }
.dsh-oq-pill { flex:0 0 auto; padding:0 5px; border-radius:4px; font-size:9px; line-height:15px; border:1px solid var(--dsw-alias-border-l1); color:var(--dsw-alias-label-secondary); }
.dsh-oq-pill.on { color:var(--dsw-alias-state-success-primary); border-color:var(--dsw-alias-state-success-primary); }
.dsh-oq-scope { display:flex; flex-direction:column; gap:4px; border:1px solid var(--dsw-alias-border-l1); border-radius:6px; padding:6px 8px; background:var(--dsw-alias-bg-layer-1); }
.dsh-oq-scope-head { display:flex; align-items:baseline; justify-content:space-between; gap:6px; }
.dsh-oq-scope-btn { padding:1px 6px; font-size:10px; line-height:15px; border-radius:4px; cursor:pointer; border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-primary); }
.dsh-oq-scope-list { display:flex; flex-wrap:wrap; gap:4px; }
.dsh-oq-scope-pick { display:inline-flex; align-items:center; gap:4px; padding:1px 6px; font-size:10px; line-height:16px; border-radius:4px; cursor:pointer; border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-secondary); max-width:100%; }
.dsh-oq-scope-pick.on { color:var(--dsw-alias-label-primary); border-color:var(--dsw-alias-brand-primary); background:var(--dsw-alias-bg-layer-3); }
.dsh-oq-tick { width:8px; flex:0 0 8px; text-align:center; font-size:9px; line-height:1; color:var(--dsw-alias-brand-primary); }
.dsh-oq-scope-pick.off { opacity:.55; }
.dsh-oq-scope-pick span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.dsh-oq-scope-meta { flex:0 0 auto; font-style:normal; font-size:9px; color:var(--dsw-alias-label-secondary); font-variant-numeric:tabular-nums; }
.dsh-oq-check { width:11px; height:11px; margin:0; accent-color:var(--dsw-alias-brand-primary); }
.dsh-oq-pick { display:inline-flex; align-items:center; gap:4px; padding:2px 8px; font-size:10px; line-height:16px; border-radius:4px; cursor:pointer; border:1px dashed var(--dsw-alias-border-l1); background:transparent; color:var(--dsw-alias-label-primary); }
.dsh-oq-pick:disabled { opacity:.55; cursor:default; }
.dsh-oq-scope-pick .dsh-oq-x { flex:0 0 auto; width:12px; height:12px; margin-left:2px; border-radius:50%; line-height:11px; text-align:center; font-size:10px; opacity:.65; }
.dsh-oq-scope-pick .dsh-oq-x:hover { opacity:1; background:var(--dsw-alias-bg-layer-4); }
.dsh-oq-scope-note { margin:0; color:var(--dsw-alias-label-secondary); font-size:10px; line-height:1.45; }
.dsh-oq-badge { display:inline-block; padding:0 5px; margin-right:4px; border-radius:4px; font-size:9px; line-height:15px; border:1px solid var(--dsw-alias-border-l1); color:var(--dsw-alias-label-secondary); }
.dsh-oq-badge.must { color:var(--dsw-alias-state-error-primary); border-color:var(--dsw-alias-state-error-primary); }
.dsh-oq-badge.should { color:var(--dsw-alias-state-warn-primary); border-color:var(--dsw-alias-state-warn-primary); }
.dsh-oq-foot { display:flex; align-items:center; justify-content:space-between; gap:8px; color:var(--dsw-alias-label-secondary); font-size:10px; }
`

    /** Mount the style sheet once; returns the disposer. */
    function insertStyles() {
      if (typeof document === 'undefined') return () => {}
      if (document.getElementById(STYLE_ID)) return () => {}
      const element = document.createElement('style')
      element.id = STYLE_ID
      element.textContent = CSS
      document.head.appendChild(element)
      return () => {
        element.remove()
      }
    }

    /**
     * One request to the Host.
     *
     * @returns the parsed reply, or `{ ok:false, offline:true }` when the route
     *   itself is unreachable (the Host may still be starting).
     */
    function callHost(method, args) {
      return fetch(RPC, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ method, args: args || {} }),
      })
        .then((response) => (response.ok ? response.json() : { ok: false, reason: `HTTP ${response.status}` }))
        .catch(() => ({ ok: false, offline: true, reason: 'Host 没有响应。' }))
    }

    /* ------------------------------------------------------------- fragments */

    const Cell = (props) => h('div', { className: 'dsh-oq-cell' }, h('b', null, props.value), h('span', null, props.label))

    const Field = (props) =>
      h(
        'div',
        { className: 'dsh-oq-field' },
        h('label', { htmlFor: props.id }, props.label),
        h('input', {
          id: props.id,
          className: 'dsh-oq-input',
          type: 'text',
          value: props.value,
          placeholder: props.placeholder,
          spellCheck: false,
          autoComplete: 'off',
          onChange: (event) => props.onChange(String(event.target.value || '')),
          onKeyDown: (event) => {
            if (event.key === 'Enter') props.onSubmit()
          },
        }),
      )

    const Button = (props) =>
      h(
        'button',
        {
          type: 'button',
          className: `dsh-oq-btn${props.primary ? ' primary' : ''}`,
          disabled: props.disabled === true,
          onClick: props.onClick,
        },
        props.children,
      )

    /* ---------------------------------------------------------------- bodies */

    /** One search hit, rendered from the service's own field names. */
    const HitCard = (props) => {
      const hit = props.hit || {}
      const heading = typeof hit.heading === 'string' ? hit.heading : ''
      const title = typeof hit.title === 'string' && hit.title !== '' ? hit.title : hit.path || '—'
      const score = typeof hit.score === 'number' ? hit.score.toFixed(2) : ''
      return h(
        'div',
        { className: 'dsh-oq-card' },
        h('h4', null, title),
        h(
          'p',
          { className: 'dsh-oq-meta' },
          [hit.vault, heading].filter((part) => typeof part === 'string' && part !== '').join(' · ') +
            (score !== '' ? `  ·  ${props.t('hit.score')} ${score}` : ''),
        ),
        typeof hit.excerpt === 'string' && hit.excerpt !== '' ? h('p', { className: 'dsh-oq-excerpt' }, hit.excerpt) : null,
      )
    }

    /** One extracted rule, with its priority badge. */
    const RuleCard = (props) => {
      const rule = props.rule || {}
      const priority = typeof rule.priority === 'string' ? rule.priority : ''
      return h(
        'div',
        { className: 'dsh-oq-card' },
        h(
          'p',
          { className: 'dsh-oq-meta' },
          priority !== '' ? h('span', { className: `dsh-oq-badge ${priority}` }, priority) : null,
          typeof rule.id === 'string' ? rule.id : '',
        ),
        h('p', { className: 'dsh-oq-excerpt' }, typeof rule.text === 'string' ? rule.text : ''),
        typeof rule.path === 'string' && rule.path !== ''
          ? h('p', { className: 'dsh-oq-meta' }, [rule.vault, rule.path].filter((part) => typeof part === 'string' && part !== '').join(' · '))
          : null,
      )
    }

    /**
     * The tab body.
     *
     * Self-contained on purpose: it owns its own state and its own polling, and
     * needs nothing from the tab machinery beyond being mounted. That keeps the
     * `sidebar.right.pane.tab` registration free of an `inject` face — one fewer
     * contract to keep in step with the Host.
     */
    function KnowledgePanel(props) {
      // Re-render on a language switch: the translator reads the module-level
      // bridge, so without a subscription a mounted panel would keep the strings
      // it rendered with until something else happened to repaint it.
      const [, setLocaleRevision] = React.useState(0)
      const t = translate
      React.useEffect(() => {
        const listener = () => setLocaleRevision((value) => value + 1)
        localeListeners.add(listener)
        return () => {
          localeListeners.delete(listener)
        }
      }, [])
      const [mode, setMode] = React.useState('search')
      const [query, setQuery] = React.useState('')
      const [topic, setTopic] = React.useState('')
      const [stack, setStack] = React.useState('typescript, react')
      const [limit, setLimit] = React.useState('8')
      const [busy, setBusy] = React.useState('')
      const [error, setError] = React.useState('')
      const [status, setStatus] = React.useState(null)
      const [hits, setHits] = React.useState(null)
      const [context, setContext] = React.useState(null)
      const [budget, setBudget] = React.useState('4000')
      const [rules, setRules] = React.useState(null)
      const [brief, setBrief] = React.useState(null)
      /**
       * Which vaults (or `vault/folder` folders) the next query is limited to.
       *
       * The service has always accepted `sources` on search/context/rules/brief —
       * and the Host half forwards it — but the first cut of this panel never
       * exposed it, so a machine with several registered vaults could only ever
       * query all of them at once. The value lives in the module-level store so
       * the central panel and the sidebar tab agree on one scope.
       */
      const [sources, setSourcesState] = React.useState(readSharedSources())
      const [imported, setImportedState] = React.useState(readSharedImported())
      const [picker, setPickerState] = React.useState(readPicker())
      const [picking, setPicking] = React.useState(false)
      const [pickNote, setPickNote] = React.useState('')
      const [scopeText, setScopeText] = React.useState('')
      /**
       * The typed-path field is the escape hatch, not the front door.
       *
       * It stayed open in the first cut and made the whole scope area read as
       * "type a path here" — which is exactly the shape the picker was added to
       * replace. Collapsed by default, and it opens on its own when the Host has
       * no chooser to offer.
       */
      const [manualOpen, setManualOpen] = React.useState(false)
      const setSources = (next) => {
        setSourcesState(next)
        writeSharedSources(next)
      }
      /**
       * Import a folder: remember it, but leave the scope alone.
       *
       * This is the "已导入但未引用" state the picker exists for. Adding several
       * directories and then choosing which ones a query actually reads is the
       * whole workflow; making import imply scoping would force the user to undo
       * it every time.
       */
      const importSource = (source) => {
        const next = imported.slice()
        if (next.indexOf(source) === -1) next.push(source)
        setImportedState(next)
        writeSharedImported(next)
        return next
      }
      const forgetSource = (source) => {
        const nextImported = imported.filter((item) => item !== source)
        setImportedState(nextImported)
        writeSharedImported(nextImported)
        if (sources.indexOf(source) !== -1) setSources(sources.filter((item) => item !== source))
      }
      const toggleSource = (source) => {
        const at = sources.indexOf(source)
        if (at === -1) setSources(sources.concat([source]))
        else setSources(sources.filter((item) => item !== source))
      }
      React.useEffect(() => {
        const listener = (value) => setSourcesState(value)
        scopeListeners.add(listener)
        return () => {
          scopeListeners.delete(listener)
        }
      }, [])
      React.useEffect(() => {
        const listener = (value) => setImportedState(value)
        importedListeners.add(listener)
        return () => {
          importedListeners.delete(listener)
        }
      }, [])
      React.useEffect(() => {
        const listener = (value) => setPickerState(value)
        pickerListeners.add(listener)
        return () => {
          pickerListeners.delete(listener)
        }
      }, [])
      const alive = React.useRef(true)

      React.useEffect(() => {
        alive.current = true
        return () => {
          alive.current = false
        }
      }, [])

      const refresh = React.useCallback(() => {
        setBusy((current) => (current === '' ? 'status' : current))
        return callHost('status', {}).then((reply) => {
          if (!alive.current) return
          setStatus(reply)
          setBusy('')
          setError(reply.ok ? '' : String(reply.reason || ''))
        })
      }, [])

      React.useEffect(() => {
        refresh()
        // The service is a local app that can start or stop at any moment; a slow
        // poll keeps the badge honest without asking the user to press anything.
        const timer = setInterval(() => {
          if (alive.current) refresh()
        }, 30000)
        return () => clearInterval(timer)
      }, [refresh])

      const run = () => {
        const numericLimit = Math.max(1, Math.min(50, Number.parseInt(limit, 10) || 8))
        // `undefined` (not `[]`) when nothing is picked: the Host treats an empty
        // list as "no filter" anyway, but sending nothing keeps the request shape
        // identical to what the MCP tools send for an unscoped query.
        const scope = sources.length > 0 ? sources : undefined
        setError('')
        if (mode === 'search') {
          if (query.trim() === '') {
            setError(t('error.needQuery'))
            return
          }
          setBusy('run')
          callHost('search', { query, limit: numericLimit, sources: scope }).then((reply) => {
            if (!alive.current) return
            setBusy('')
            if (reply.ok) {
              setHits(Array.isArray(reply.result?.hits) ? reply.result.hits : [])
              setRules(null)
              setContext(null)
            } else {
              setError(String(reply.reason || t('error.queryFailed')))
            }
          })
          return
        }
        if (mode === 'context') {
          if (query.trim() === '') {
            setError(t('error.needQuery'))
            return
          }
          setBusy('run')
          callHost('context', {
            query,
            limit: numericLimit,
            budget: Math.max(200, Math.min(20000, Number.parseInt(budget, 10) || 4000)),
            sources: scope,
          }).then((reply) => {
            if (!alive.current) return
            setBusy('')
            if (reply.ok) {
              setContext(reply.result)
              setHits(null)
              setRules(null)
              setBrief(null)
            } else {
              setError(String(reply.reason || t('error.buildFailed')))
            }
          })
          return
        }
        if (mode === 'rules') {
          setBusy('run')
          callHost('rules', { query, topic, limit: numericLimit * 4, sources: scope }).then((reply) => {
            if (!alive.current) return
            setBusy('')
            if (reply.ok) {
              setRules(Array.isArray(reply.result?.rules) ? reply.result.rules : [])
              setHits(null)
              setContext(null)
            } else {
              setError(String(reply.reason || t('error.queryFailed')))
            }
          })
          return
        }
        const stackList = stack
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item !== '')
        if (stackList.length === 0) {
          setError(t('error.needStack'))
          return
        }
        setBusy('run')
        callHost('brief', { stack: stackList, budget: 4000, limit: 24, sources: scope }).then((reply) => {
          if (!alive.current) return
          setBusy('')
          if (reply.ok) {
            setBrief(reply.result)
            setHits(null)
            setRules(null)
            setContext(null)
          } else {
            setError(String(reply.reason || t('error.buildFailed')))
          }
        })
      }

      const online = status !== null && status.ok === true
      const health = online ? status.health || {} : {}
      const stats = online ? status.stats || {} : {}
      const vaultList = online && status.vaults && Array.isArray(status.vaults.vaults) ? status.vaults.vaults : []
      const topNotes = online && Array.isArray(stats.topNotes) ? stats.topNotes : []
      const number = (value) => (typeof value === 'number' ? String(value) : '—')

      const header = h(
        'div',
        { className: 'dsh-oq-head' },
        h('div', null, h('div', { className: 'dsh-oq-title' }, t('tab.title')), h(
          'div',
          { className: 'dsh-oq-sub' },
          h('span', { className: `dsh-oq-dot ${online ? 'ok' : 'bad'}` }),
          online ? `${String(health.version || '')} · ${t('status.online')}` : t('status.offline'),
        )),
        h('span', { className: 'dsh-oq-build' }, BUILD_TAG),
        h(Button, { onClick: refresh, disabled: busy !== '' }, t('action.refresh')),
      )

      const grid = h(
        'div',
        { className: 'dsh-oq-grid' },
        h(Cell, { label: t('status.docs'), value: number(health.docs) }),
        h(Cell, { label: t('status.chunks'), value: number(health.chunks) }),
        h(Cell, { label: t('status.rules'), value: number(health.rules) }),
        h(Cell, { label: t('status.vaults'), value: number(health.vaults) }),
        // Field names mirror `StatsResponse` in ../plugin/src/types.ts — the
        // service's own spelling, not a paraphrase that would silently render "—".
        h(Cell, { label: t('status.searches'), value: number(stats.totalQueries) }),
        h(Cell, { label: t('status.citations'), value: number(stats.totalCitations) }),
      )

      /**
       * Which vaults and folders this panel's queries are limited to.
       *
       * `sources` is exactly the wire shape the service parses (`server.ts`
       * `asSources`): a bare `vault` or a `vault/folder` prefix, split on the
       * first `/`. The chips are the registered vaults; the text field is the
       * escape hatch for a folder inside a vault, which the Host cannot
       * enumerate without walking the whole tree.
       *
       * This one block is also the vault list: name, enabled state and per-vault
       * counts all live on the chip. Showing the same vaults twice — once as a
       * read-only list, once as a picker — was what made the panel look partial.
       *
       * Nothing picked means "all enabled vaults", which is also what the MCP
       * tools do when called without `sources` — same default, one mental model.
       */
      const scopeChips = vaultList.map((vault, index) => {
        const name = String(vault.name || vault.id || '')
        const on = name !== '' && sources.indexOf(name) !== -1
        const enabled = vault.enabled !== false
        return h(
          'button',
          {
            key: `scope-${index}`,
            type: 'button',
            className: `dsh-oq-scope-pick${on ? ' on' : ''}${enabled ? '' : ' off'}`,
            title: `${String(vault.path || name)}\n${on ? t('sources.picked') : t('sources.unpicked')}`,
            'aria-pressed': on ? 'true' : 'false',
            onClick: () => toggleSource(name),
          },
          h('span', { className: 'dsh-oq-tick', 'aria-hidden': 'true' }, on ? '✓' : ''),
          h('span', null, name === '' ? '—' : name),
          h(
            'em',
            { className: 'dsh-oq-scope-meta' },
            enabled
              ? `${number(vault.docs)} ${t('vaults.docs')}`
              : t('vaults.disabled'),
          ),
        )
      })

      const vaultNames = vaultList.map((vault) => String(vault.name || vault.id || ''))

      /**
       * Ask the Host for its OS folder chooser, then translate the picked
       * absolute path into the `vault/sub/folder` form the service parses.
       *
       * Picking imports; it does not scope. See `importSource`.
       */
      const pickFolder = () => {
        if (!picker || typeof picker.pick !== 'function') {
          setPickNote(t('sources.noPicker'))
          // No chooser to offer: the typed field is the only way through, so
          // unfold it rather than leaving the user with a message and no door.
          setManualOpen(true)
          return
        }
        setPicking(true)
        setPickNote('')
        Promise.resolve()
          .then(() => picker.pick())
          .then((reply) => {
            if (!alive.current) return
            setPicking(false)
            const path = pickedPath(reply)
            if (path === '') return
            const source = sourceForPickedPath(path, vaultList)
            if (source === null) {
              setPickNote(t('sources.outsideVault'))
              return
            }
            importSource(source)
          })
          .catch(() => {
            if (!alive.current) return
            setPicking(false)
            setPickNote(t('sources.pickFailed'))
          })
      }

      // Imported folders are the ones the picker (or the field) brought in. Each
      // chip toggles scope; the `×` on it forgets the folder altogether.
      const folderChips = imported
        .filter((source) => source !== '' && vaultNames.indexOf(source) === -1)
        .map((source, index) => {
          const on = sources.indexOf(source) !== -1
          return h(
            'button',
            {
              key: `scope-extra-${index}`,
              type: 'button',
              className: `dsh-oq-scope-pick${on ? ' on' : ' off'}`,
              title: on ? t('sources.picked') : t('sources.unpicked'),
              'aria-pressed': on ? 'true' : 'false',
              onClick: () => toggleSource(source),
            },
            h('span', { className: 'dsh-oq-tick', 'aria-hidden': 'true' }, on ? '✓' : ''),
            h('span', null, source),
            h(
              'span',
              {
                className: 'dsh-oq-x',
                role: 'button',
                'aria-label': t('sources.remove'),
                title: t('sources.remove'),
                onClick: (event) => {
                  // The chip toggles scope; the cross forgets the folder. Those
                  // are different promises, so the cross must not bubble.
                  if (event && typeof event.stopPropagation === 'function') event.stopPropagation()
                  forgetSource(source)
                },
              },
              '×',
            ),
          )
        })

      const scopeBlock = h(
        'div',
        { className: 'dsh-oq-scope' },
        h(
          'div',
          { className: 'dsh-oq-scope-head' },
          h('p', { className: 'dsh-oq-sec', style: { margin: 0 } }, t('sources.title')),
          h(
            'span',
            { className: 'dsh-oq-row-meta' },
            sources.length === 0 ? t('sources.all') : `${t('sources.selected')} ${sources.length}`,
          ),
          sources.length === 0
            ? null
            : h(
                'button',
                {
                  type: 'button',
                  className: 'dsh-oq-scope-btn',
                  onClick: () => {
                    setSources([])
                    setScopeText('')
                  },
                },
                t('sources.clear'),
              ),
        ),
        // The picker is the primary way in; the field below stays as the escape
        // hatch for paths the Host cannot reach (and for headless Hosts), so it
        // is folded away until asked for.
        h(
          'div',
          { className: 'dsh-oq-actions' },
          h(
            'button',
            { type: 'button', className: 'dsh-oq-pick', disabled: picking, onClick: pickFolder },
            picking ? t('sources.picking') : t('sources.pick'),
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'dsh-oq-scope-btn',
              'aria-expanded': manualOpen ? 'true' : 'false',
              onClick: () => setManualOpen(!manualOpen),
            },
            manualOpen ? t('sources.manualHide') : t('sources.manual'),
          ),
        ),
        pickNote === '' ? null : h('p', { className: 'dsh-oq-scope-note' }, pickNote),
        h('p', { className: 'dsh-oq-scope-note' }, t('sources.howto')),
        vaultList.length === 0 && folderChips.length === 0
          ? h('p', { className: 'dsh-oq-hint' }, t('state.noVaults'))
          : h('div', { className: 'dsh-oq-scope-list' }, ...scopeChips, ...folderChips),
        manualOpen
          ? h(Field, {
              id: 'dsh-oq-scope',
              label: t('sources.pathHint'),
              placeholder: 'Obsidian test1/Vue3',
              value: scopeText,
              onChange: setScopeText,
              onSubmit: () => {
                const extra = scopeText
                  .split(/[,\n;]/)
                  .map((item) => item.trim())
                  .filter((item) => item !== '')
                if (extra.length === 0) return
                // Typing a path is an explicit request to use it, so unlike
                // picking a folder it lands in scope as well as in the imports.
                for (const item of extra) importSource(item)
                setSources(sources.concat(extra.filter((item) => sources.indexOf(item) === -1)))
                setScopeText('')
              },
            })
          : null,
      )

      const topNotesBlock =
        topNotes.length === 0
          ? null
          : h(
              'div',
              { className: 'dsh-oq-rows' },
              h('p', { className: 'dsh-oq-sec' }, t('stats.topNotes')),
              topNotes.slice(0, 5).map((note, index) =>
                h(
                  'div',
                  { key: `note-${index}`, className: 'dsh-oq-row' },
                  h('span', { className: 'dsh-oq-row-name' }, String(note.title || note.path || '—')),
                  // `/stats` spells this `count`; `citations` guards a later rename.
                  h('span', { className: 'dsh-oq-row-meta' }, `${number(note.count ?? note.citations)} ${t('stats.citations')}`),
                ),
              ),
            )

      const modes = h(
        'div',
        { className: 'dsh-oq-modes' },
        ...[
          ['search', t('mode.search')],
          ['context', t('mode.context')],
          ['rules', t('mode.rules')],
          ['brief', t('mode.brief')],
        ].map(([value, label]) =>
          h(
            'button',
            {
              key: value,
              type: 'button',
              className: `dsh-oq-mode${mode === value ? ' on' : ''}`,
              onClick: () => {
                setMode(value)
                setError('')
              },
            },
            label,
          ),
        ),
      )

      const fields = h(
        'div',
        { className: 'dsh-oq-field' },
        mode === 'brief'
          ? h(Field, { id: 'dsh-oq-stack', label: t('field.stack'), placeholder: t('field.stackPlaceholder'), value: stack, onChange: setStack, onSubmit: run })
          : h(Field, { id: 'dsh-oq-query', label: t('field.query'), placeholder: t('field.queryPlaceholder'), value: query, onChange: setQuery, onSubmit: run }),
        mode === 'rules'
          ? h(Field, { id: 'dsh-oq-topic', label: t('field.topic'), placeholder: t('field.topicPlaceholder'), value: topic, onChange: setTopic, onSubmit: run })
          : null,
        mode === 'context'
          ? h(Field, { id: 'dsh-oq-budget', label: t('field.budget'), placeholder: '4000', value: budget, onChange: setBudget, onSubmit: run })
          : null,
        mode !== 'brief'
          ? h(Field, { id: 'dsh-oq-limit', label: t('field.limit'), placeholder: '8', value: limit, onChange: setLimit, onSubmit: run })
          : null,
      )

      const actions = h(
        'div',
        { className: 'dsh-oq-actions' },
        h(Button, { primary: true, onClick: run, disabled: busy !== '' }, busy === 'run' ? t('state.loading') : t('action.run')),
        h(
          Button,
          {
            onClick: () => {
              setHits(null)
              setRules(null)
              setContext(null)
              setBrief(null)
              setError('')
            },
          },
          t('action.clear'),
        ),
      )

      let body = null
      if (hits !== null) {
        body =
          hits.length === 0
            ? h('p', { className: 'dsh-oq-hint' }, t('state.empty'))
            : hits.map((hit, index) => h(HitCard, { key: `hit-${index}`, hit, t }))
      } else if (rules !== null) {
        body =
          rules.length === 0
            ? h('p', { className: 'dsh-oq-hint' }, t('state.empty'))
            : rules.map((rule, index) => h(RuleCard, { key: `rule-${index}`, rule }))
      } else if (context !== null) {
        // `/context` is the only endpoint that returns *ready-to-use* markdown
        // rather than a hit list, and it is the one the model itself consumes
        // through the MCP `kb_context` tool. Rendering it verbatim — no
        // re-wrapping, no truncation — is the point: what the human reads is
        // byte-for-byte what the model would receive.
        const markdown = typeof context.markdown === 'string' ? context.markdown : ''
        const used = typeof context.used === 'number' ? context.used : 0
        const contextHits = Array.isArray(context.hits) ? context.hits : []
        body =
          markdown === ''
            ? h('p', { className: 'dsh-oq-hint' }, t('state.empty'))
            : [
                h(
                  'p',
                  { key: 'ctx-meta', className: 'dsh-oq-meta' },
                  `${t('context.used')} ${used} · ${contextHits.length} ${t('context.snippets')} · ${t('context.hint')}`,
                ),
                h('pre', { key: 'ctx-md', className: 'dsh-oq-pre' }, markdown),
              ]
      } else if (brief !== null) {
        const briefRules = Array.isArray(brief.rules) ? brief.rules : []
        const stackLabel = Array.isArray(brief.stack) ? brief.stack.join(', ') : ''
        // `BriefResponse` (../plugin/src/types.ts) reports an unhonoured request
        // through `error`/`warnings`, not a `message` field.
        const briefNote =
          typeof brief.error === 'string' && brief.error !== ''
            ? brief.error
            : Array.isArray(brief.warnings) && brief.warnings.length > 0
              ? brief.warnings.join(' · ')
              : t('state.empty')
        body =
          briefRules.length === 0
            ? h('p', { className: 'dsh-oq-hint' }, briefNote)
            : [h('p', { key: 'brief-head', className: 'dsh-oq-meta' }, stackLabel)].concat(
                briefRules.map((rule, index) => h(RuleCard, { key: `brief-rule-${index}`, rule })),
              )
      } else {
        body = h('p', { className: 'dsh-oq-hint' }, busy === 'status' ? t('state.loading') : t('state.idle'))
      }

      return h(
        'div',
        { className: 'dsh-oq-root' },
        header,
        online ? grid : null,
        online ? scopeBlock : null,
        online ? topNotesBlock : null,
        error !== '' ? h('p', { className: 'dsh-oq-err' }, error) : null,
        !online && status !== null && error === '' ? h('p', { className: 'dsh-oq-hint' }, t('hint.offline')) : null,
        modes,
        fields,
        actions,
        h('div', { className: 'dsh-oq-list' }, body),
        h(
          'div',
          { className: 'dsh-oq-foot' },
          h('span', null, t('hint.readonly')),
          online && status.config && status.config.hasToken === false ? h('span', null, t('hint.noToken')) : null,
        ),
      )
    }

    /** The tab chip. Small: it is drawn in a narrow rail. */
    function KnowledgeTabTitle() {
      return h('span', { title: translate('guide.title') }, `◈ ${translate('tab.title')}`)
    }

    /**
     * The left-rail glyph.
     *
     * `sidebar.panellist` draws its occupant inside a 16–18px span with no text,
     * so the occupant must be a bare glyph: a `<span>` here would be laid out as
     * an inline box and shift the icon off-centre in the rail.
     */
    function KnowledgeGlyph(props) {
      const size = typeof props.size === 'number' ? props.size : 18
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.8,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
        },
        h('path', { d: 'M4 5.5A1.5 1.5 0 0 1 5.5 4H10l1.6 2H19a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5.5A1.5 1.5 0 0 1 4 16.5Z' }),
        h('path', { d: 'M8 11h8' }),
        h('path', { d: 'M8 14.5h5' }),
      )
    }

    /**
     * Wrapper for the central `main` seat.
     *
     * The central column is much wider than the sidebar rail, so the body is
     * width-capped and centred; without the cap every card stretches across a
     * full window and the excerpt lines become unreadably long.
     */
    function KnowledgeMainPanel(props) {
      return h('div', { className: 'dsh-oq-main' }, h(KnowledgePanel, props))
    }

    /* ----------------------------------------------------------------- apply */

    /**
     * Register the tab type, then its body and chip-title slots.
     *
     * The order and the rollback matter: the slot registration can fail after
     * the type registration succeeded, and the Host refuses a second
     * registration of the same id — so a leaked type would permanently make this
     * kind render the Host's "nothing can view this" face. The type is therefore
     * released if a slot registration throws.
     *
     * Waiting on `ctx.inject(['sidebarRightTabs'])` (a SERVICE) rather than on the
     * slot declaration is deliberate: the native seat declares
     * `sidebar.right.pane.tab` BEFORE it provides `sidebarRightTabs`, so a
     * declaration-triggered registration would read the registry as missing and,
     * because the declaration never collapses, register nothing — permanently.
     */
    function registerTab(ctx) {
      const seat = ctx.inject(['sidebarRightTabs'], (injected) => {
        const tabs = typeof injected.get === 'function' ? injected.get('sidebarRightTabs') : undefined
        if (!tabs || typeof tabs.register !== 'function') return

        let disposeType = null
        try {
          disposeType = tabs.register({
            id: TAB_ID,
            kind: TAB_KIND,
            keepMounted: true,
            priority: 'extension',
            // A page type: no `patterns`, so it is opened by kind and claims no
            // address. Omitting `guide` would hide it from the Sidebar's guide
            // page, which is the only place a user discovers a tab they have
            // never opened.
            title: () => translate('tab.title'),
            guide: [
              {
                id: TAB_ID,
                order: 40,
                title: () => translate('guide.title'),
                description: () => translate('guide.description'),
              },
            ],
          })
        } catch (error) {
          // Another plugin owns this id/kind: stay quiet rather than breaking
          // the Sidebar. The failure is visible as a missing guide entry.
          void error
          return
        }

        const disposers = []
        try {
          disposers.push(
            ctx.slots.inject('sidebar.right.pane.tab', () =>
              ctx.slots.register({ name: 'sidebar.right.pane.tab', key: TAB_ID }, KnowledgePanel),
            ),
          )
          disposers.push(
            ctx.slots.inject('sidebar.right.pane.tab.title', () =>
              ctx.slots.register({ name: 'sidebar.right.pane.tab.title', key: TAB_ID }, KnowledgeTabTitle),
            ),
          )
        } catch (error) {
          for (const dispose of disposers.reverse()) {
            try {
              dispose()
            } catch {
              /* keep releasing the rest */
            }
          }
          try {
            if (disposeType) disposeType()
          } catch {
            /* nothing else to do */
          }
          void error
          return
        }

        return () => {
          for (const dispose of disposers.reverse()) {
            try {
              dispose()
            } catch {
              /* keep releasing the rest */
            }
          }
          try {
            if (disposeType) disposeType()
          } catch {
            /* nothing else to do */
          }
        }
      })
      return () => {
        try {
          if (typeof seat === 'function') seat()
        } catch {
          /* nothing else to do */
        }
      }
    }

    /**
     * Register the LEFT-rail entry: an icon in `sidebar.panellist` paired with the
     * central panel in `main`.
     *
     * Why a pair and not one slot: the Sidebar resolves a pane-list row by id and
     * `layout.selectPanel(id)` **throws** unless `main` has an entry with that
     * exact key (`hasMainPanel` scans `ctx.slots.entries('main')`). A lone
     * `sidebar.panellist` registration therefore produces a button that throws on
     * click, and a lone `main` registration produces a panel nothing can open.
     *
     * The two ids are the same string on purpose: the rail's `active` flag, the
     * pin menu and the central dispatch all compare the pane-list `id` against the
     * `main` entry `key`.
     */
    function registerPanel(ctx) {
      const disposers = []
      try {
        disposers.push(
          ctx.slots.inject('sidebar.panellist', () =>
            ctx.slots.register(
              {
                name: 'sidebar.panellist',
                id: PANEL_ID,
                order: 30,
                // The Sidebar renders this as the row's tooltip and (wide mode)
                // its caption; `resolveSlotLabel` accepts a thunk.
                label: () => translate('tab.title'),
              },
              KnowledgeGlyph,
            ),
          ),
        )
        disposers.push(
          ctx.slots.inject('main', () =>
            ctx.slots.register({ name: 'main', key: PANEL_ID }, KnowledgeMainPanel),
          ),
        )
      } catch (error) {
        for (const dispose of disposers.reverse()) {
          try {
            dispose()
          } catch {
            /* keep releasing the rest */
          }
        }
        void error
        return () => {}
      }
      return () => {
        for (const dispose of disposers.reverse()) {
          try {
            dispose()
          } catch {
            /* keep releasing the rest */
          }
        }
      }
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.effect(() => insertStyles(), 'dsh-obsidian-quote-panel: styles')

        // Follow the UI language. `bind(NS)` hands back a `t(key)` that walks the
        // active language's fallback chain, and `subscribe` fires on a language
        // switch *and* on every dictionary registration — which is why the panel
        // repaints instead of keeping whatever it first rendered. The bridge keeps
        // both the translator and the raw active-locale id, so a Host that has the
        // service but not this namespace still resolves through DICTS.
        const locale = typeof ctx.get === 'function' ? ctx.get('locale') : undefined
        if (locale && typeof locale.register === 'function') {
          for (const [lang, dict] of Object.entries(DICTS)) {
            ctx.effect(() => {
              try {
                return locale.register(NS, lang, dict)
              } catch {
                return null
              }
            }, `dsh-obsidian-quote-panel: locale ${lang}`)
          }
          const publish = () => {
            let translateBound
            try {
              translateBound = typeof locale.bind === 'function' ? locale.bind(NS) : undefined
            } catch {
              translateBound = undefined
            }
            let active = ''
            try {
              const snapshot = typeof locale.getSnapshot === 'function' ? locale.getSnapshot() : undefined
              if (snapshot && typeof snapshot.active === 'string') active = snapshot.active
            } catch {
              active = ''
            }
            writeLocale({
              translate: typeof translateBound === 'function' ? translateBound : undefined,
              locale: active,
            })
          }
          ctx.effect(() => {
            publish()
            if (typeof locale.subscribe !== 'function') return null
            return locale.subscribe(publish)
          }, 'dsh-obsidian-quote-panel: locale bridge')
        }

        ctx.effect(() => registerPanel(ctx), 'dsh-obsidian-quote-panel: sidebar panel')
        ctx.effect(() => registerTab(ctx), 'dsh-obsidian-quote-panel: sidebar tab')

        // The OS folder chooser lives on the Client's Remote face
        // (`remote.directoryPicker.pick()`), which the remotes plugin mounts
        // *after* apply returns — so it is injected, not read once. Both the
        // namespace and the nested member are listed: cordis resolves dotted
        // services through their parent, and shipped plugins inject both
        // (`dsh-context` does `inject(['remote','remote.session'])`). A Host
        // without a picker leaves this null and the panel keeps the text field.
        ctx.inject(['remote', 'remote.directoryPicker'], (injected) => {
          const remote = injected && injected.remote ? injected.remote : undefined
          const candidate = remote && remote.directoryPicker ? remote.directoryPicker : undefined
          writePicker(candidate && typeof candidate.pick === 'function' ? candidate : null)
          return () => writePicker(null)
        })
      },
    }
  },
})
