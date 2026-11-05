/**
 * The harness-agnostic browser panel served by `QuoteServer` at `/ui`.
 *
 * Why this exists: the Obsidian plugin has its own settings panel, and the DSH
 * bundle has a React sidebar tab, but every other harness (Claude Code, Cursor,
 * Codex, Gemini CLI, ...) has no UI extension point at all. A plain local page
 * is the only panel that works everywhere, so the same read-only API is exposed
 * to the browser here.
 *
 * Design constraints:
 *  - Self-contained: HTML, CSS and JS are inline strings, so the plugin still
 *    ships as a single `main.js` with no extra assets to install.
 *  - Read-only: search / context / rules / brief / stats only. There is no
 *    reindex and no settings mutation here.
 *  - Token never travels on every request: the shell is public, the token is
 *    exchanged once at `/ui/session` for an HttpOnly + SameSite=Strict cookie.
 *  - Strict CSP with a per-response nonce; every value is written with
 *    `textContent`, never `innerHTML`, because every string on this page comes
 *    from user notes or an error path.
 */

/** Replace the CSP placeholder with the per-response nonce. */
export function renderWebUi(nonce: string): string {
	return WEB_UI_HTML.split("__NONCE__").join(nonce);
}

const WEB_UI_HTML = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="referrer" content="no-referrer">
<title>Obsidian 知识库 · 只读面板</title>
<style nonce="__NONCE__">
:root {
  color-scheme: light dark;
  --bg: #f5f6f8;
  --panel: #ffffff;
  --text: #1f2328;
  --muted: #667085;
  --border: #d5d9e0;
  --border-strong: #b8bfc9;
  --accent: #4f46e5;
  --accent-soft: #eef2ff;
  --ok: #12805c;
  --err: #b42318;
  --warn: #b54708;
  --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
  --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0f1115;
    --panel: #161a20;
    --text: #e6e8ee;
    --muted: #98a2b3;
    --border: #2a303a;
    --border-strong: #3b4350;
    --accent: #8b87f8;
    --accent-soft: #1e2436;
    --ok: #3ddc97;
    --err: #ff8a80;
    --warn: #fdb022;
  }
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--bg);
  color: var(--text);
  font: 14px/1.55 var(--sans);
  -webkit-font-smoothing: antialiased;
}
.hidden { display: none !important; }
.boot { padding: 64px 20px; text-align: center; color: var(--muted); }
.wrap { max-width: 1020px; margin: 0 auto; padding: 18px 16px 72px; }
h1 { font-size: 16px; margin: 0; font-weight: 650; }
h2 { font-size: 13px; margin: 0 0 8px; font-weight: 600; color: var(--muted); letter-spacing: .02em; }
.top {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding-bottom: 12px; margin-bottom: 16px; border-bottom: 1px solid var(--border);
}
.top .grow { flex: 1 1 auto; }
.pills { display: flex; gap: 6px; flex-wrap: wrap; }
.pill {
  border: 1px solid var(--border); border-radius: 999px; padding: 2px 9px;
  font-size: 11px; color: var(--muted); background: var(--panel); white-space: nowrap;
}
.pill.ok { color: var(--ok); border-color: currentColor; }
.pill.bad { color: var(--err); border-color: currentColor; }
.pill b { font-weight: 600; color: inherit; }
.login {
  max-width: 440px; margin: 56px auto; background: var(--panel);
  border: 1px solid var(--border); border-radius: 12px; padding: 22px 22px 18px;
}
.login h2 { color: var(--text); font-size: 15px; margin-bottom: 4px; }
.login p { margin: 0 0 14px; color: var(--muted); font-size: 12px; }
.field { display: flex; gap: 8px; }
.field.col { flex-direction: column; }
label { font-size: 11px; color: var(--muted); display: block; margin-bottom: 3px; }
input[type="text"], input[type="password"], input[type="number"], select {
  width: 100%; padding: 6px 9px; font: inherit; font-size: 13px; color: var(--text);
  background: var(--bg); border: 1px solid var(--border-strong); border-radius: 7px;
}
input:focus, select:focus, button:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
button {
  font: inherit; font-size: 12px; padding: 5px 14px; border-radius: 7px; cursor: pointer;
  color: var(--text); background: var(--panel); border: 1px solid var(--border-strong);
  white-space: nowrap;
}
button.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
button:disabled { opacity: .5; cursor: default; }
.row { display: flex; gap: 8px; flex-wrap: wrap; align-items: flex-end; }
.row > .f { flex: 1 1 160px; min-width: 120px; }
.row > .f.narrow { flex: 0 0 96px; }
.row > .f.tiny { flex: 0 0 76px; }
.tabs { display: flex; gap: 4px; flex-wrap: wrap; padding: 4px; background: var(--panel); border: 1px solid var(--border); border-radius: 10px; margin-bottom: 14px; }
.tabs button { border: 0; background: transparent; color: var(--muted); padding: 5px 12px; border-radius: 7px; }
.tabs button.on { background: var(--accent-soft); color: var(--accent); font-weight: 600; }
.scope { background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; margin-bottom: 14px; }
.scope-list { display: flex; gap: 6px; flex-wrap: wrap; }
.scope-chip { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--border); border-radius: 999px; padding: 3px 10px; font-size: 12px; cursor: pointer; user-select: none; }
.scope-chip input { margin: 0; accent-color: var(--accent); }
.scope-chip.off { color: var(--muted); text-decoration: line-through; cursor: default; opacity: .6; }
.out { min-height: 40px; }
.card { background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; margin-bottom: 8px; }
.card .title { font-weight: 600; margin-bottom: 2px; word-break: break-word; }
.card .meta { color: var(--muted); font-size: 11px; margin-bottom: 6px; word-break: break-all; }
.card .excerpt { font-size: 12.5px; white-space: pre-wrap; word-break: break-word; color: var(--text); }
.card .excerpt mark { background: var(--accent-soft); color: inherit; border-radius: 3px; padding: 0 2px; }
.md {
  background: var(--panel); border: 1px solid var(--border); border-radius: 10px;
  padding: 12px 14px; margin: 0 0 10px; white-space: pre-wrap; word-break: break-word;
  font: 12.5px/1.6 var(--mono); overflow-x: auto;
}
.count { color: var(--muted); font-size: 12px; margin: 2px 0 8px; }
.warn { color: var(--warn); font-size: 12px; margin: 0 0 8px; white-space: pre-wrap; }
.err { color: var(--err); font-size: 12px; margin: 8px 0 0; white-space: pre-wrap; }
.empty { color: var(--muted); font-size: 12.5px; padding: 10px 2px; }
.badge { display: inline-block; font-size: 10px; font-weight: 600; border-radius: 4px; padding: 0 5px; border: 1px solid currentColor; margin-right: 5px; vertical-align: 1px; }
.badge.must { color: var(--err); }
.badge.should { color: var(--warn); }
.badge.tip { color: var(--ok); }
.rule { padding: 7px 2px; border-bottom: 1px dashed var(--border); }
.rule:last-child { border-bottom: 0; }
.rule .text { font-size: 13px; }
.rule .src { color: var(--muted); font-size: 11px; margin-top: 2px; word-break: break-all; }
.chip { display: inline-block; background: var(--accent-soft); color: var(--accent); border-radius: 5px; padding: 1px 7px; font-size: 11px; margin: 0 4px 4px 0; }
.statgrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; margin-bottom: 14px; }
.stat { background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; }
.stat .k { color: var(--muted); font-size: 11px; }
.stat .v { font-size: 18px; font-weight: 650; font-variant-numeric: tabular-nums; }
.hr { border: 0; border-top: 1px solid var(--border); margin: 14px 0; }
.foot { color: var(--muted); font-size: 11px; margin-top: 24px; text-align: center; }
@media (max-width: 560px) {
  .wrap { padding: 12px 10px 56px; }
  .pills { margin-left: 0; }
}
</style>
</head>
<body>
<div id="boot" class="boot">正在连接本地引用服务…</div>

<div id="login" class="login hidden">
  <h2>连接本地知识库</h2>
  <p>这是 Obsidian Quote 的通用浏览器只读面板。请粘贴 Obsidian 插件面板里的访问令牌；令牌只在本机用于换取一次会话 Cookie，不会写进 URL 或历史记录。</p>
  <label for="token">访问令牌</label>
  <form id="login-form" class="field col">
    <input id="token" type="password" autocomplete="off" spellcheck="false" placeholder="粘贴访问令牌">
    <div class="row" style="justify-content:flex-end">
      <button type="submit" class="primary" id="login-btn">连接</button>
    </div>
  </form>
  <p class="err" id="login-error"></p>
</div>

<div id="app" class="wrap hidden">
  <div class="top">
    <div class="grow">
      <h1>Obsidian 知识库 · 只读面板</h1>
      <div class="sub" id="status-line">正在读取状态…</div>
    </div>
    <div class="pills" id="status-pills"></div>
    <button type="button" id="logout-btn">断开</button>
  </div>

  <div class="scope">
    <div class="row" style="justify-content:space-between;margin-bottom:6px">
      <h2 style="margin:0">检索范围</h2>
      <span class="count" id="scope-note" style="margin:0">未选择 = 全部已启用库</span>
    </div>
    <div class="scope-list" id="scope-list"></div>
  </div>

  <div class="tabs" role="tablist">
    <button type="button" data-tab="search" class="on" role="tab" aria-selected="true">检索</button>
    <button type="button" data-tab="context" role="tab" aria-selected="false">上下文</button>
    <button type="button" data-tab="rules" role="tab" aria-selected="false">规范条款</button>
    <button type="button" data-tab="brief" role="tab" aria-selected="false">摘要</button>
    <button type="button" data-tab="stats" role="tab" aria-selected="false">统计</button>
  </div>

  <section id="panel-search" class="tabpanel">
    <div class="row">
      <div class="f"><label for="search-q">关键词 / 问题</label><input id="search-q" type="text" placeholder="例如：GPIO 初始化顺序"></div>
      <div class="f tiny"><label for="search-limit">条数</label><input id="search-limit" type="number" min="1" max="50" value="8"></div>
      <button type="button" class="primary" id="search-run">检索</button>
    </div>
    <div class="hr"></div>
    <div class="out" id="search-out"><div class="empty">输入关键词后回车或点“检索”。结果按 BM25 相关度排序，只读。</div></div>
  </section>

  <section id="panel-context" class="tabpanel hidden">
    <div class="row">
      <div class="f"><label for="context-q">主题</label><input id="context-q" type="text" placeholder="例如：Vue 组件命名"></div>
      <div class="f narrow"><label for="context-budget">字符预算</label><input id="context-budget" type="number" min="500" max="40000" step="500" value="6000"></div>
      <div class="f tiny"><label for="context-limit">条数</label><input id="context-limit" type="number" min="1" max="30" value="8"></div>
      <button type="button" class="primary" id="context-run">生成</button>
    </div>
    <div class="hr"></div>
    <div class="out" id="context-out"><div class="empty">生成一份可直接粘贴给模型的知识库 Markdown 上下文。</div></div>
  </section>

  <section id="panel-rules" class="tabpanel hidden">
    <div class="row">
      <div class="f"><label for="rules-q">关键词</label><input id="rules-q" type="text" placeholder="可留空，只看主题/级别"></div>
      <div class="f"><label for="rules-topic">主题</label><input id="rules-topic" type="text" placeholder="如 命名、目录结构"></div>
      <div class="f narrow"><label for="rules-priority">级别</label>
        <select id="rules-priority"><option value="">全部</option><option value="must">必须</option><option value="should">建议</option><option value="tip">可选</option></select>
      </div>
      <div class="f tiny"><label for="rules-limit">条数</label><input id="rules-limit" type="number" min="1" max="100" value="20"></div>
      <button type="button" class="primary" id="rules-run">查询</button>
    </div>
    <div class="hr"></div>
    <div class="out" id="rules-out"><div class="empty">从笔记里提炼的规范条款，带级别与来源路径。</div></div>
  </section>

  <section id="panel-brief" class="tabpanel hidden">
    <div class="row">
      <div class="f"><label for="brief-path">项目路径（可选，用于识别技术栈）</label><input id="brief-path" type="text" placeholder="例如 D:\\work\\my-app"></div>
      <div class="f"><label for="brief-stack">技术栈（可选，逗号分隔）</label><input id="brief-stack" type="text" placeholder="如 vue, typescript"></div>
      <div class="f tiny"><label for="brief-budget">预算</label><input id="brief-budget" type="number" min="1000" max="40000" step="500" value="4000"></div>
      <button type="button" class="primary" id="brief-run">生成</button>
    </div>
    <div class="hr"></div>
    <div class="out" id="brief-out"><div class="empty">按技术栈筛选出“必须 / 建议 / 可选”三段式规范摘要。</div></div>
  </section>

  <section id="panel-stats" class="tabpanel hidden">
    <div class="row" style="justify-content:flex-end"><button type="button" id="stats-refresh">刷新</button></div>
    <div class="hr"></div>
    <div class="out" id="stats-out"><div class="empty">台账统计：查询次数、引用次数、最常被引用的笔记。</div></div>
  </section>

  <div class="foot">只读面板 · 数据留在本机 · 不写回任何笔记或 harness</div>
</div>

<script nonce="__NONCE__">
(function () {
  'use strict';

  var state = { vaults: [], scope: [], tab: 'search' };

  function byId(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function num(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
  function clamp(value, min, max, fallback) {
    var n = num(value, fallback);
    return Math.min(max, Math.max(min, Math.round(n)));
  }
  function fmtTime(ts) {
    if (!ts) return '—';
    try { return new Date(ts).toLocaleString('zh-CN', { hour12: false }); } catch (e) { return '—'; }
  }
  function fmtNum(n) {
    return typeof n === 'number' && Number.isFinite(n) ? n.toLocaleString('zh-CN') : String(n === undefined ? '—' : n);
  }
  function setError(node, message) {
    node.textContent = message || '';
  }
  function request(path, options) {
    var opts = options || {};
    var init = { method: opts.method || 'GET', credentials: 'same-origin' };
    if (opts.body !== undefined) {
      init.headers = { 'content-type': 'application/json' };
      init.body = JSON.stringify(opts.body);
    }
    return fetch(path, init).then(function (res) {
      return res.text().then(function (text) {
        var body;
        try { body = text ? JSON.parse(text) : null; } catch (e) { body = { error: '服务返回了非 JSON 响应（HTTP ' + res.status + '）' }; }
        return { ok: res.ok, status: res.status, body: body };
      });
    });
  }
  function fail(node, result) {
    var message = result && result.body && (result.body.error || result.body.reason);
    if (!message) message = '请求失败（HTTP ' + (result ? result.status : '?') + '）';
    node.textContent = message;
  }
  function busy(node, text) {
    clear(node);
    node.appendChild(el('div', 'empty', text));
  }

  function showLogin(message) {
    byId('boot').classList.add('hidden');
    byId('app').classList.add('hidden');
    byId('login').classList.remove('hidden');
    setError(byId('login-error'), message || '');
    var input = byId('token');
    if (input) input.focus();
  }

  function pills(items) {
    var box = byId('status-pills');
    clear(box);
    items.forEach(function (item) {
      var pill = el('span', 'pill ' + (item.ok === false ? 'bad' : item.ok ? 'ok' : ''), '');
      if (item.label) {
        pill.appendChild(el('span', '', item.label + ' '));
      }
      pill.appendChild(el('b', '', item.value));
      box.appendChild(pill);
    });
  }

  function renderStatus(health) {
    var line = byId('status-line');
    if (!health || health.ok !== true) {
      line.textContent = '本地引用服务未响应；请确认 Obsidian 正在运行且插件已启用。';
      pills([{ label: '服务', value: '离线', ok: false }]);
      return;
    }
    line.textContent = '版本 ' + health.version + ' · 上次建索引 ' + fmtTime(health.lastBuiltAt) + (health.indexing ? ' · 正在建索引' : '');
    pills([
      { label: '文档', value: fmtNum(health.docs), ok: true },
      { label: '分块', value: fmtNum(health.chunks), ok: true },
      { label: '条款', value: fmtNum(health.rules), ok: true }
    ]);
  }

  function renderScope(vaults) {
    var box = byId('scope-list');
    clear(box);
    state.vaults = vaults || [];
    vaults.forEach(function (vault) {
      var label = el('label', 'scope-chip' + (vault.enabled ? '' : ' off'));
      var input = document.createElement('input');
      input.type = 'checkbox';
      input.disabled = !vault.enabled;
      input.value = vault.id;
      input.addEventListener('change', function () {
        if (input.checked) state.scope.push(vault.id);
        else state.scope = state.scope.filter(function (id) { return id !== vault.id; });
        var note = byId('scope-note');
        note.textContent = state.scope.length ? ('已选 ' + state.scope.length + ' 个库') : '未选择 = 全部已启用库';
      });
      label.appendChild(input);
      label.appendChild(el('span', '', vault.name + ' · ' + fmtNum(vault.docs) + ' 篇'));
      box.appendChild(label);
    });
    if (!vaults.length) box.appendChild(el('div', 'empty', '没有已登记的库。'));
  }

  function scopeSources() {
    return state.scope.map(function (id) {
      var vault = state.vaults.filter(function (item) { return item.id === id; })[0];
      return { vaultId: id, vault: vault ? vault.name : id };
    });
  }

  function showTab(name) {
    state.tab = name;
    Array.prototype.forEach.call(document.querySelectorAll('.tabs button'), function (button) {
      var on = button.getAttribute('data-tab') === name;
      button.className = on ? 'on' : '';
      button.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    Array.prototype.forEach.call(document.querySelectorAll('.tabpanel'), function (panel) {
      panel.classList.toggle('hidden', panel.id !== 'panel-' + name);
    });
    if (name === 'stats') loadStats();
  }

  function wireTabs() {
    Array.prototype.forEach.call(document.querySelectorAll('.tabs button'), function (button) {
      button.addEventListener('click', function () { showTab(button.getAttribute('data-tab')); });
    });
  }

  function renderHits(out, body, kind) {
    clear(out);
    var head = el('div', 'count', '共 ' + fmtNum(body.total) + ' 条 · ' + fmtNum(body.tookMs) + ' ms');
    out.appendChild(head);
    (body.warnings || []).forEach(function (warning) { out.appendChild(el('p', 'warn', '提示：' + warning)); });
    if (!body.hits || !body.hits.length) {
      out.appendChild(el('div', 'empty', kind === 'search' ? '没有命中。试试更短的关键词，或放宽检索范围。' : '没有可用的片段。'));
      return;
    }
    body.hits.forEach(function (hit) {
      var card = el('div', 'card');
      card.appendChild(el('div', 'title', hit.title || hit.path));
      var meta = [hit.vault, hit.path, 'score ' + Number(hit.score).toFixed(2)].join(' · ');
      card.appendChild(el('div', 'meta', meta));
      if (hit.excerpt) card.appendChild(el('div', 'excerpt', hit.excerpt));
      out.appendChild(card);
    });
  }

  function doSearch() {
    var out = byId('search-out');
    var query = byId('search-q').value.trim();
    if (!query) { busy(out, '请输入关键词。'); return; }
    var body = { query: query, limit: clamp(byId('search-limit').value, 1, 50, 8) };
    var sources = scopeSources();
    if (sources.length) body.sources = sources;
    busy(out, '检索中…');
    request('/search', { method: 'POST', body: body }).then(function (result) {
      if (!result.ok) { clear(out); fail(out, result); return; }
      renderHits(out, result.body, 'search');
    }).catch(function (error) { clear(out); out.appendChild(el('p', 'err', '网络错误：' + error.message)); });
  }

  function doContext() {
    var out = byId('context-out');
    var query = byId('context-q').value.trim();
    if (!query) { busy(out, '请输入主题。'); return; }
    var body = {
      query: query,
      budget: clamp(byId('context-budget').value, 500, 40000, 6000),
      limit: clamp(byId('context-limit').value, 1, 30, 8)
    };
    var sources = scopeSources();
    if (sources.length) body.sources = sources;
    busy(out, '生成中…');
    request('/context', { method: 'POST', body: body }).then(function (result) {
      if (!result.ok) { clear(out); fail(out, result); return; }
      clear(out);
      var body2 = result.body;
      out.appendChild(el('div', 'count', '用了 ' + fmtNum(body2.used) + ' 字符 · ' + fmtNum((body2.hits || []).length) + ' 个片段'));
      (body2.warnings || []).forEach(function (warning) { out.appendChild(el('p', 'warn', '提示：' + warning)); });
      out.appendChild(el('pre', 'md', body2.markdown || ''));
      appendCopy(out, body2.markdown || '');
    }).catch(function (error) { clear(out); out.appendChild(el('p', 'err', '网络错误：' + error.message)); });
  }

  function appendCopy(container, text) {
    if (!text) return;
    var row = el('div', 'row');
    row.style.marginTop = '10px';
    var button = el('button', '', '复制 Markdown');
    var note = el('span', 'count', '');
    note.style.margin = '0';
    button.addEventListener('click', function () {
      var done = function () { note.textContent = '已复制'; };
      var failed = function () { note.textContent = '复制失败，请手动选择文本。'; };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, failed);
      } else {
        failed();
      }
    });
    row.appendChild(button);
    row.appendChild(note);
    container.appendChild(row);
  }

  function doRules() {
    var out = byId('rules-out');
    var params = [];
    function add(key, value) { if (value) params.push(encodeURIComponent(key) + '=' + encodeURIComponent(value)); }
    add('q', byId('rules-q').value.trim());
    add('topic', byId('rules-topic').value.trim());
    add('priority', byId('rules-priority').value);
    add('limit', clamp(byId('rules-limit').value, 1, 100, 20));
    var sources = scopeSources();
    sources.forEach(function (source) { add('source', source.vault); });
    busy(out, '查询中…');
    request('/rules' + (params.length ? '?' + params.join('&') : '')).then(function (result) {
      if (!result.ok) { clear(out); fail(out, result); return; }
      clear(out);
      var body = result.body;
      out.appendChild(el('div', 'count', '共 ' + fmtNum(body.total) + ' 条 · ' + fmtNum(body.tookMs) + ' ms'));
      (body.warnings || []).forEach(function (warning) { out.appendChild(el('p', 'warn', '提示：' + warning)); });
      if (!body.rules || !body.rules.length) {
        out.appendChild(el('div', 'empty', '没有匹配的条款。'));
        return;
      }
      body.rules.forEach(function (rule) {
        var item = el('div', 'rule');
        var priority = el('span', 'badge ' + rule.priority, rule.priority === 'must' ? '必须' : rule.priority === 'should' ? '建议' : '可选');
        item.appendChild(priority);
        item.appendChild(el('span', 'text', rule.text));
        var src = [rule.id, rule.vault, rule.path, rule.heading].filter(Boolean).join(' · ');
        item.appendChild(el('div', 'src', src + (rule.count > 1 ? ' · 被 ' + rule.count + ' 篇笔记提到' : '')));
        out.appendChild(item);
      });
    }).catch(function (error) { clear(out); out.appendChild(el('p', 'err', '网络错误：' + error.message)); });
  }

  function doBrief() {
    var out = byId('brief-out');
    var body = { budget: clamp(byId('brief-budget').value, 1000, 40000, 4000) };
    var projectPath = byId('brief-path').value.trim();
    var stack = byId('brief-stack').value.split(',').map(function (item) { return item.trim(); }).filter(Boolean);
    if (projectPath) body.projectPath = projectPath;
    if (stack.length) body.stack = stack;
    var sources = scopeSources();
    if (sources.length) body.sources = sources;
    busy(out, '生成中…');
    request('/brief', { method: 'POST', body: body }).then(function (result) {
      if (!result.ok) { clear(out); fail(out, result); return; }
      clear(out);
      var data = result.body;
      out.appendChild(el('div', 'count', '技术栈：' + ((data.stack || []).join(', ') || '未识别') + ' · 条款 ' + fmtNum(data.ruleCount)));
      var chips = el('div', '');
      (data.stack || []).forEach(function (item) { chips.appendChild(el('span', 'chip', item)); });
      out.appendChild(chips);
      (data.warnings || []).forEach(function (warning) { out.appendChild(el('p', 'warn', '提示：' + warning)); });
      out.appendChild(el('pre', 'md', data.markdown || ''));
      appendCopy(out, data.markdown || '');
    }).catch(function (error) { clear(out); out.appendChild(el('p', 'err', '网络错误：' + error.message)); });
  }

  function loadStats() {
    var out = byId('stats-out');
    busy(out, '读取中…');
    request('/stats').then(function (result) {
      if (!result.ok) { clear(out); fail(out, result); return; }
      clear(out);
      var data = result.body;
      var grid = el('div', 'statgrid');
      [['查询次数', data.totalQueries], ['引用次数', data.totalCitations]].forEach(function (pair) {
        var card = el('div', 'stat');
        card.appendChild(el('div', 'k', pair[0]));
        card.appendChild(el('div', 'v', fmtNum(pair[1])));
        grid.appendChild(card);
      });
      out.appendChild(grid);
      out.appendChild(el('h2', '', '最常被引用'));
      if (!data.topNotes || !data.topNotes.length) {
        out.appendChild(el('div', 'empty', '还没有引用记录。'));
      } else {
        data.topNotes.forEach(function (note) {
          var line = el('div', 'rule');
          line.appendChild(el('div', 'text', note.title || note.path));
          line.appendChild(el('div', 'src', note.vault + ' · ' + note.path + ' · ' + fmtNum(note.count) + ' 次'));
          out.appendChild(line);
        });
      }
      out.appendChild(el('h2', '', '最近引用'));
      if (!data.recent || !data.recent.length) {
        out.appendChild(el('div', 'empty', '还没有最近记录。'));
      } else {
        data.recent.slice().reverse().forEach(function (item) {
          var line = el('div', 'rule');
          line.appendChild(el('div', 'text', '[' + item.kind + '] ' + (item.query || '（空查询）')));
          var top = (item.top && item.top[0]) ? (item.top[0].title || item.top[0].path) : '';
          line.appendChild(el('div', 'src', fmtTime(item.at) + ' · ' + fmtNum(item.hits) + ' 条' + (top ? ' · ' + top : '')));
          out.appendChild(line);
        });
      }
    }).catch(function (error) { clear(out); out.appendChild(el('p', 'err', '网络错误：' + error.message)); });
  }

  function login() {
    var token = byId('token').value.trim();
    if (!token) { setError(byId('login-error'), '请先粘贴访问令牌。'); return; }
    var button = byId('login-btn');
    button.disabled = true;
    setError(byId('login-error'), '');
    request('/ui/session', { method: 'POST', body: { token: token } }).then(function (result) {
      button.disabled = false;
      if (!result.ok) {
        setError(byId('login-error'), (result.body && result.body.error) || '令牌不正确。');
        return;
      }
      byId('token').value = '';
      boot();
    }).catch(function (error) {
      button.disabled = false;
      setError(byId('login-error'), '无法连接本地服务：' + error.message);
    });
  }

  function logout() {
    request('/ui/logout', { method: 'POST', body: {} }).then(function () { showLogin('已断开。'); }, function () { showLogin('已断开。'); });
  }

  function boot() {
    return Promise.all([request('/health'), request('/vaults')]).then(function (results) {
      var health = results[0].body;
      var vaults = results[1];
      if (vaults.status === 401) { showLogin(''); return; }
      if (!vaults.ok) { showLogin((vaults.body && vaults.body.error) || '无法读取知识库列表。'); return; }
      byId('boot').classList.add('hidden');
      byId('login').classList.add('hidden');
      byId('app').classList.remove('hidden');
      renderStatus(health);
      renderScope((vaults.body && vaults.body.vaults) || []);
      byId('scope-note').textContent = '未选择 = 全部已启用库';
    }).catch(function (error) { showLogin('无法连接本地引用服务：' + error.message); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    wireTabs();
    byId('login-form').addEventListener('submit', function (event) { event.preventDefault(); login(); });
    byId('search-run').addEventListener('click', doSearch);
    byId('search-q').addEventListener('keydown', function (event) { if (event.key === 'Enter') doSearch(); });
    byId('context-run').addEventListener('click', doContext);
    byId('context-q').addEventListener('keydown', function (event) { if (event.key === 'Enter') doContext(); });
    byId('rules-run').addEventListener('click', doRules);
    byId('rules-q').addEventListener('keydown', function (event) { if (event.key === 'Enter') doRules(); });
    byId('brief-run').addEventListener('click', doBrief);
    byId('stats-refresh').addEventListener('click', loadStats);
    byId('logout-btn').addEventListener('click', logout);
    boot();
  });
})();
</script>
</body>
</html>`;
