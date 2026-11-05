#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export async function inspectConnection({ home = os.homedir(), env = process.env } = {}) {
  let config = {};
  try { config = JSON.parse(fs.readFileSync(path.join(home, '.obsidian-quote/config.json'), 'utf8')); } catch {}
  if (!config || typeof config !== 'object' || Array.isArray(config)) config = {};
  const token = env.OBSIDIAN_QUOTE_TOKEN || config.token;
  if (typeof token !== 'string' || !token.trim()) return { state: 'missing-config', message: '请在 Obsidian 的 Obsidian Quote 面板点击“写入接入配置”。' };
  if (!/^[\x20-\x7e]+$/.test(token)) return { state: 'invalid-credential', message: '接入凭据格式异常，请在 Obsidian 重新写入接入配置。' };
  let url;
  try {
    url = new URL(env.OBSIDIAN_QUOTE_URL || config.url || 'http://127.0.0.1:43117');
    if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw Error();
  } catch { return { state: 'invalid-endpoint', message: '连接地址必须为本机回环 HTTP 地址；请从 Obsidian 重新写入接入配置。' }; }
  const panelUrl = new URL('/ui', url).href;
  try {
    const health = await fetch(new URL('/health', url), { redirect: 'error', signal: AbortSignal.timeout(5000) });
    if (!health.ok) return { state: 'service-error', message: '本机服务健康检查失败。' };
    const status = await health.json();
    const response = await fetch(new URL('/vaults', url), { redirect: 'error', headers: { authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(5000) });
    if (response.status === 401 || response.status === 403) return { state: 'unauthorized', message: '服务可达，但接入鉴权失败；检查环境变量覆盖并重新写入配置。' };
    if (!response.ok) return { state: 'service-error', message: '读取知识库登记状态失败。' };
    const body = await response.json();
    if (!Array.isArray(body.vaults)) return { state: 'service-error', message: '服务返回的知识库列表格式异常。' };
    return { state: 'ready', version: status.version, vaults: body.vaults.length, enabledVaults: body.vaults.filter(vault => vault.enabled).length, docs: status.docs, chunks: status.chunks, panelUrl, message: '连接成功。知识库登记与设置在 Obsidian 中管理；浏览器面板提供检索和来源选择。' };
  } catch { return { state: 'service-offline', message: '无法读取本机引用服务；请保持 Obsidian 打开并启用 Obsidian Quote 服务。' }; }
}

async function openPanel(url) {
  const command = process.platform === 'win32' ? 'rundll32.exe' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  const args = process.platform === 'win32' ? ['url.dll,FileProtocolHandler', url] : [url];
  await new Promise((resolve, reject) => execFile(command, args, { windowsHide: true }, error => error ? reject(error) : resolve()));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const result = await inspectConnection();
  if (process.argv.includes('--open') && result.state === 'ready') {
    try { await openPanel(result.panelUrl); result.panelOpened = true; }
    catch { result.panelOpened = false; result.message += ' 自动打开失败，可使用上方 panelUrl 手动打开。'; }
  }
  console.log(JSON.stringify(result, null, 2));
  if (result.state !== 'ready') process.exitCode = 2;
}
