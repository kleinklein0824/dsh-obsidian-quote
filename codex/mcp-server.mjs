#!/usr/bin/env node
// Codex UI integration. The original MCP, Obsidian and Harness layers stay independent.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';

const RESOURCE = 'ui://obsidian-quote/knowledge-panel.html';
const panel = fs.readFileSync(new URL('./panel.html', import.meta.url), 'utf8');
const empty = { type: 'object', properties: {}, additionalProperties: false };
const meta = { ui: { visibility: ['app'] } };
const annotations = { readOnlyHint: true, destructiveHint: false, openWorldHint: false };
const tools = [
  { name: 'oq_settings_read', title: '知识库面板设置', description: '读取 Codex 面板入口，不读取或更改共享连接配置。', inputSchema: empty,
    outputSchema: { type: 'object', properties: { schema: { type: 'object' }, values: empty, layout: { type: 'array', items: { type: 'object' } } }, required: ['schema', 'values'], additionalProperties: false } },
  { name: 'oq_settings_update', title: '知识库面板设置', description: '面板入口没有可写的连接设置。', inputSchema: { type: 'object', properties: { set: empty }, required: ['set'], additionalProperties: false },
    outputSchema: { type: 'object', properties: { values: empty }, required: ['values'], additionalProperties: false } },
  { name: 'oq_panel', title: 'Obsidian 知识库', description: '打开知识库面板，登记本地路径并选择一个或多个来源检索。', inputSchema: empty,
    _meta: { ui: { resourceUri: RESOURCE, visibility: ['app'] }, 'openai/ui': { entrypoints: [{ type: 'global' }, { type: 'thread' }] } } },
  { name: 'oq_panel_state', title: '刷新知识库连接', description: '只读列出知识库状态和笔记数量，不返回凭据或绝对目录。', inputSchema: empty },
  { name: 'oq_panel_add_vault', title: '添加本地路径', description: '在 Obsidian 本机服务中校验、登记并索引一个本地文件夹；不返回绝对路径。',
    inputSchema: { type: 'object', properties: { path: { type: 'string', minLength: 1, maxLength: 4096 } }, required: ['path'], additionalProperties: false },
    annotations: { ...annotations, readOnlyHint: false } },
  { name: 'oq_panel_query', title: '检索知识库', description: '按面板选择的一个或多个来源执行只读检索；来源失效时停止，不扩大检索范围。',
    inputSchema: { type: 'object', properties: {
      query: { type: 'string', minLength: 1, maxLength: 500 }, source: { type: 'string', maxLength: 256 },
      sources: { type: 'array', items: { type: 'string', minLength: 1, maxLength: 256 }, minItems: 1, maxItems: 256, uniqueItems: true },
      mode: { type: 'string', enum: ['search', 'context'] }, limit: { type: 'integer', minimum: 1, maximum: 10 },
    }, required: ['query', 'mode', 'limit'], oneOf: [{ required: ['source'] }, { required: ['sources'] }], additionalProperties: false } },
].map(tool => ({ ...tool, annotations: tool.annotations ?? annotations, _meta: tool._meta ?? meta }));

function connection() {
  let config = {};
  try { config = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.obsidian-quote/config.json'), 'utf8')); } catch {}
  if (!config || typeof config !== 'object' || Array.isArray(config)) config = {};
  const token = process.env.OBSIDIAN_QUOTE_TOKEN || config.token;
  if (typeof token !== 'string' || !token.trim() || !/^[\x20-\x7e]+$/.test(token))
    throw Error('未找到有效的接入凭据。请检查 Obsidian Quote 已有的本机接入配置。');
  let url;
  try {
    url = new URL(process.env.OBSIDIAN_QUOTE_URL || config.url || 'http://127.0.0.1:43117');
    if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
      url.username || url.password || url.search || url.hash || url.pathname !== '/') throw Error();
  } catch { throw Error('接入地址必须是本机回环 HTTP 地址。请检查已有接入配置。'); }
  return { url, token };
}

async function service(endpoint, body) {
  const { url, token } = connection();
  let response;
  try {
    response = await fetch(new URL(endpoint, url), { method: body ? 'POST' : 'GET', redirect: 'error',
      headers: { authorization: 'Bearer ' + token, ...(body ? { 'content-type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000) });
  } catch { throw Error('无法连接知识库服务。请保持 Obsidian 打开，并启用 Obsidian Quote 引用服务。'); }
  if ([401, 403].includes(response.status)) throw Error('服务可达，但接入鉴权失败。请检查已有配置和环境变量覆盖。');
  if (!response.ok) {
    if (endpoint === '/vaults' && body) {
      let result;
      try { result = await response.json(); } catch {}
      if (['请输入有效的本机文件夹绝对路径', '路径不存在或不是文件夹', '该知识库已登记'].includes(result?.error))
        throw Error(result.error);
    }
    throw Error('知识库服务请求失败（' + response.status + '）。');
  }
  try { return await response.json(); } catch { throw Error('知识库服务返回格式异常。'); }
}

const text = (value, max = 8000) => typeof value === 'string' ? value.slice(0, max) : '';
const count = value => Number.isSafeInteger(value) && value >= 0 ? value : null;
async function vaultState() {
  const data = await service('/vaults');
  if (!Array.isArray(data.vaults)) throw Error('知识库列表格式异常。');
  const vaults = data.vaults.filter(v => v && typeof v.id === 'string' && v.id && v.id.length <= 256 &&
    typeof v.name === 'string' && v.name && v.name.length <= 256).map(v => ({
      id: v.id, name: v.name, enabled: v.enabled === true, docs: count(v.docs), chunks: count(v.chunks),
    }));
  if (new Set(vaults.map(v => v.id)).size !== vaults.length) throw Error('知识库标识重复，请检查 Obsidian 登记状态。');
  return { state: 'ready', checkedAt: new Date().toISOString(), indexing: data.indexing === true, vaults };
}

async function runTool(name, args) {
  if (name === 'oq_settings_read') return {
    schema: empty, values: {}, layout: [{ kind: 'group', title: 'Obsidian 知识库', items: [
      { kind: 'tool', tool: 'oq_panel', title: '打开知识库面板', description: '选择知识库并直接检索，结果在面板中显示。原有对话调用方式也可以继续使用。' },
    ] }],
  };
  if (name === 'oq_settings_update') {
    if (!args.set || typeof args.set !== 'object' || Array.isArray(args.set) || Object.keys(args.set).length)
      throw Error('此入口没有可写的连接设置。服务配置请在 Obsidian 中管理；本地路径可从知识库面板添加。');
    return { values: {} };
  }
  if (name === 'oq_panel') return { opened: true };
  if (name === 'oq_panel_state') return vaultState();
  if (name === 'oq_panel_add_vault') {
    if (!args || typeof args !== 'object' || Array.isArray(args) || typeof args.path !== 'string' || !args.path.trim() || args.path.length > 4096)
      throw Error('请输入有效的本机文件夹绝对路径');
    const data = await service('/vaults', { path: args.path.trim() });
    const vault = data?.vault;
    if (!vault || typeof vault.id !== 'string' || !vault.id || typeof vault.name !== 'string' || !vault.name || vault.enabled !== true)
      throw Error('知识库服务返回的登记结果格式异常。');
    return { vault: { id: vault.id.slice(0, 256), name: vault.name.slice(0, 256), enabled: true } };
  }
  if (name !== 'oq_panel_query') throw Error('未知面板工具。');
  if (!args || typeof args !== 'object' || Array.isArray(args) || typeof args.query !== 'string' || !args.query.trim() || args.query.length > 500 ||
      !['search', 'context'].includes(args.mode) || !Number.isInteger(args.limit) || args.limit < 1 || args.limit > 10)
    throw Error('检索参数无效，请重新选择来源并填写关键词。');
  const hasSingleSource = Object.prototype.hasOwnProperty.call(args, 'source');
  const hasMultipleSources = Object.prototype.hasOwnProperty.call(args, 'sources');
  const validSingleSource = hasSingleSource && typeof args.source === 'string' && args.source.length <= 256;
  const validMultipleSources = hasMultipleSources && Array.isArray(args.sources) && args.sources.length > 0 && args.sources.length <= 256 &&
    args.sources.every(id => typeof id === 'string' && id.length > 0 && id.length <= 256) && new Set(args.sources).size === args.sources.length;
  if (hasSingleSource === hasMultipleSources || (hasSingleSource && !validSingleSource) || (hasMultipleSources && !validMultipleSources))
    throw Error('检索参数无效，请重新选择来源并填写关键词。');
  const state = await vaultState();
  const enabled = state.vaults.filter(v => v.enabled);
  if (!enabled.length) throw Error('没有已启用的知识库。请在 Obsidian 中检查知识库登记与启用状态。');
  let selected = null;
  if (hasMultipleSources) {
    const requested = new Set(args.sources);
    selected = enabled.filter(v => requested.has(v.id));
    if (selected.length !== requested.size) throw Error('所选路径中有已停用或不存在的来源，请刷新并重新选择检索范围。');
  } else if (args.source) {
    const source = enabled.find(v => v.id === args.source);
    if (!source) throw Error('所选知识库已停用或不存在，请重新选择检索范围。');
    selected = [source];
  }
  const body = { query: args.query.trim(), limit: args.limit };
  if (args.mode === 'context') body.budget = 4000;
  if (selected) body.sources = selected.map(source => ({ vault: source.name, vaultId: source.id }));
  const result = await service('/' + args.mode, body);
  const warnings = Array.isArray(result.warnings) ? result.warnings.slice(0, 20).map(v => text(v, 1000)) : [];
  if (args.mode === 'context') return { mode: 'context', markdown: text(result.markdown, 16000), warnings };
  if (!Array.isArray(result.hits)) throw Error('检索结果格式异常。');
  return { mode: 'search', warnings, hits: result.hits.slice(0, args.limit).map(hit => ({
    title: text(hit.title, 256), heading: text(hit.heading, 256), vault: text(hit.vault, 256),
    path: typeof hit.path === 'string' && !/^(?:[a-z]:|[\\/])/i.test(hit.path) ? text(hit.path, 512) : '', excerpt: text(hit.excerpt),
  })) };
}

function send(payload) { process.stdout.write(JSON.stringify(payload) + '\n'); }
async function handle(message) {
  if (!message || typeof message !== 'object' || message.id === undefined || message.id === null) return;
  const { id, method, params = {} } = message;
  const reply = result => send({ jsonrpc: '2.0', id, result });
  if (method === 'initialize') return reply({ protocolVersion: params.protocolVersion || '2025-03-26',
    serverInfo: { name: 'obsidian-quote-panel', title: 'Obsidian 知识库', version: '0.1.6' },
    capabilities: { tools: {}, resources: {}, extensions: { 'openai/settings': { readTool: 'oq_settings_read', updateTool: 'oq_settings_update' } } } });
  if (method === 'ping') return reply({});
  if (method === 'tools/list') return reply({ tools });
  if (method === 'resources/list') return reply({ resources: [{ uri: RESOURCE, name: 'Obsidian 知识库', mimeType: 'text/html;profile=mcp-app' }] });
  if (method === 'resources/templates/list') return reply({ resourceTemplates: [] });
  if (method === 'resources/read' && params.uri === RESOURCE) return reply({ contents: [{ uri: RESOURCE, mimeType: 'text/html;profile=mcp-app', text: panel,
    _meta: { ui: { csp: { connectDomains: [], resourceDomains: [], frameDomains: [] }, prefersBorder: true } } }] });
  if (method === 'tools/call') {
    try {
      const structuredContent = await runTool(params.name, params.arguments ?? {});
      return reply({ content: [{ type: 'text', text: params.name === 'oq_panel' ? '已打开知识库面板。' : '面板请求完成。' }], structuredContent, isError: false });
    } catch (error) { return reply({ content: [{ type: 'text', text: error.message || '面板请求失败。' }], isError: true }); }
  }
  send({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Unsupported panel method' } });
}
readline.createInterface({ input: process.stdin, crlfDelay: Infinity }).on('line', line => {
  if (!line.trim() || line.length > 1048576) return;
  let message; try { message = JSON.parse(line); } catch { return; }
  handle(message).catch(() => process.stderr.write('[obsidian-quote-panel] Request failed\n'));
});
