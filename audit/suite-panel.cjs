const path = require("node:path");
const fs = require("node:fs");
const core = require("./core.cjs");
const { VA, VB, TMP } = require("./helpers.cjs");
const { QuotePlugin, renderQuotePanel, QuotePanel, Setting, El, Notice } = require("./panel.cjs");

Object.defineProperty(globalThis, "navigator", { value: { clipboard: { writeText: async () => {} } }, configurable: true });
global.window = { setTimeout, clearTimeout };

const app = {
	vault: { adapter: { getBasePath: () => VA } },
	workspace: { onLayoutReady: () => {}, getLeavesOfType: () => [], getRightLeaf: () => null, getLeaf: () => null, revealLeaf: async () => {}, detachLeavesOfType: () => {} },
	setting: { open: () => {}, openTabById: () => {} },
};

async function makePlugin(vaultList) {
	const p = new QuotePlugin(app, { version: "0.1.0" });
	p.__data = {
		settings: {
			vaults: vaultList,
			index: { watch: false },
			server: { enabled: false, port: 45611, token: "panel-token", host: "127.0.0.1" },
		},
	};
	await p.loadSettings();
	p.indexer = new core.VaultIndexer(() => p.settings);
	p.server = new core.QuoteServer(p);
	await p.indexer.build();
	return p;
}

function render(p, opts = {}) {
	Setting.all = [];
	const root = new El("div");
	renderQuotePanel(root, p, opts);
	return { root, settings: Setting.all };
}

function type(control, value) {
	control.inputEl.value = value;
	if (control.inputEl.listeners.change && control.inputEl.listeners.change[0]) control.inputEl.listeners.change[0](value);
}

function clickButton(setting, index = 0) {
	const buttons = setting.controls.filter((c) => c.type === "button");
	return buttons[index].control.buttonEl.listeners.click[0]();
}

const vaultEntry = { id: "va", name: "Vue规范库", path: VA, enabled: true };

module.exports = [
	{
		id: "T011",
		name: "面板渲染出标题、状态与服务规模",
		severity: "high",
		run: async () => {
			const p = await makePlugin([vaultEntry]);
			const { root, settings } = render(p, { showSettingsLink: true });
			const title = root.allText().includes("知识库引用");
			const status = root.findClass("oq-status")[0].allText();
			const hero = root.findClass("oq-hero").length > 0 && root.findClass("oq-card").length >= 4;
			const names = settings.map((item) => item.name);
			const core = ["登记知识库", "包含目录", "启用引用服务"].every((name) => names.includes(name));
			const pass = title && hero && status.includes("引用服务未启动") && settings.length >= 14 && core;
			return { pass, detail: `title=${title} hero=${hero} settings=${settings.length} 核心控件=${core} status=${status}` };
		},
	},
	{
		id: "T012",
		name: "知识库行展示路径与篇/段/规则规模",
		severity: "medium",
		run: async () => {
			const p = await makePlugin([vaultEntry]);
			const { settings } = render(p);
			const row = settings.find((s) => s.name === "Vue规范库");
			const pass = Boolean(row) && row.desc.includes("篇") && row.desc.includes("段") && row.desc.includes("条规则");
			return { pass, detail: row ? row.desc : "未渲染知识库行" };
		},
	},
	{
		id: "T013",
		name: "停用开关持久化并触发重建",
		severity: "high",
		run: async () => {
			const p = await makePlugin([vaultEntry]);
			const { settings } = render(p);
			const row = settings.find((s) => s.name === "Vue规范库");
			await row.controls[0].control.toggle(false);
			await new Promise((r) => setTimeout(r, 120));
			const saved = p.__data.settings.vaults[0].enabled === false;
			const pass = p.settings.vaults[0].enabled === false && saved && p.indexer.chunkCount === 0;
			return { pass, detail: `enabled=${p.settings.vaults[0].enabled} saved=${saved} chunks=${p.indexer.chunkCount}` };
		},
	},
	{
		id: "T014",
		name: "移除知识库后配置与索引同步",
		severity: "medium",
		run: async () => {
			const p = await makePlugin([vaultEntry]);
			const { settings } = render(p);
			const row = settings.find((s) => s.name === "Vue规范库");
			await row.controls.find((c) => c.type === "extra").control.buttonEl.listeners.click[0]();
			await new Promise((r) => setTimeout(r, 120));
			const pass = p.settings.vaults.length === 0 && p.__data.settings.vaults.length === 0;
			return { pass, detail: `vaults=${p.settings.vaults.length} chunks=${p.indexer.chunkCount}` };
		},
	},
	{
		id: "T015",
		name: "登记不存在的路径被拒绝",
		severity: "high",
		run: async () => {
			const p = await makePlugin([]);
			const { settings } = render(p);
			const add = settings.find((s) => s.name === "登记知识库");
			type(add.controls.find((c) => c.type === "text").control, "Z:/definitely-not-here-9527");
			Notice.messages = [];
			await clickButton(add);
			return { pass: Notice.messages.includes("路径不存在或不是文件夹") && p.settings.vaults.length === 0, detail: Notice.messages.join(" | ") };
		},
	},
	{
		id: "T016",
		name: "重复登记同一知识库被拒绝",
		severity: "medium",
		run: async () => {
			const p = await makePlugin([vaultEntry]);
			const { settings } = render(p);
			const add = settings.find((s) => s.name === "登记知识库");
			type(add.controls.find((c) => c.type === "text").control, VA);
			Notice.messages = [];
			await clickButton(add);
			return { pass: Notice.messages.includes("该知识库已登记") && p.settings.vaults.length === 1, detail: Notice.messages.join(" | ") };
		},
	},
	{
		id: "T017",
		name: "“当前库”按钮可登记当前 vault",
		severity: "medium",
		run: async () => {
			const p = await makePlugin([]);
			const { settings } = render(p);
			const quick = settings.find((s) => s.name === "快速登记");
			Notice.messages = [];
			await clickButton(quick, 0);
			await new Promise((r) => setTimeout(r, 60));
			const pass = p.settings.vaults.length === 1 && p.settings.vaults[0].path === VA && Notice.messages.includes("已添加");
			return { pass, detail: `vaults=${p.settings.vaults.map((v) => v.name).join(",")} notice=${Notice.messages.join("|")}` };
		},
	},
	{
		id: "T018",
		name: "“扫描本机”读取 Obsidian 全局配置",
		severity: "medium",
		run: async () => {
			const appdata = path.join(TMP, "appdata");
			fs.mkdirSync(path.join(appdata, "obsidian"), { recursive: true });
			fs.writeFileSync(path.join(appdata, "obsidian", "obsidian.json"), JSON.stringify({ vaults: { a: { path: VA }, b: { path: VB } } }));
			const previous = process.env.APPDATA;
			process.env.APPDATA = appdata;
			try {
				const found = core.registry.discoverLocalVaults();
				const p = await makePlugin([]);
				const { settings } = render(p);
				const quick = settings.find((s) => s.name === "快速登记");
				Notice.messages = [];
				await clickButton(quick, 1);
				await new Promise((r) => setTimeout(r, 60));
				const pass = found.length === 2 && p.settings.vaults.length === 2;
				return { pass, detail: `discovered=${found.map((f) => f.name).join(",")} registered=${p.settings.vaults.length}` };
			} finally {
				if (previous === undefined) delete process.env.APPDATA;
				else process.env.APPDATA = previous;
			}
		},
	},
	{
		id: "T019",
		name: "引用组合可跨库并可精确到子目录",
		severity: "high",
		run: async () => {
			const p = await makePlugin([vaultEntry, { id: "vb", name: "嵌入式库", path: VB, enabled: true }]);
			p.settings.ui.advanced = true;
			const { settings } = render(p);
			const src = settings.find((s) => s.name === "组合来源");
			const name = settings.find((s) => s.name === "组合名称");
			type(src.controls[0].control, "Vue规范库/00-规范\n嵌入式库/STM32");
			type(name.controls[0].control, "audit-mix");
			Notice.messages = [];
			await clickButton(name, 0);
			const profile = p.settings.profiles[0];
			const pass = Boolean(profile) && profile.sources.length === 2 && profile.sources.every((s) => s.vaultId && s.path);
			return { pass, detail: profile ? JSON.stringify(profile) : Notice.messages.join("|") };
		},
	},
	{
		id: "T020",
		name: "引用组合拒绝未知库/不存在子目录，且可移除",
		severity: "medium",
		run: async () => {
			const p = await makePlugin([vaultEntry]);
			p.settings.ui.advanced = true;
			const { settings } = render(p);
			const src = settings.find((s) => s.name === "组合来源");
			const name = settings.find((s) => s.name === "组合名称");

			type(src.controls[0].control, "没有这个库");
			type(name.controls[0].control, "bad1");
			Notice.messages = [];
			await clickButton(name, 0);
			const unknown = Notice.messages[0] || "";

			type(src.controls[0].control, "Vue规范库/不存在");
			type(name.controls[0].control, "bad2");
			Notice.messages = [];
			await clickButton(name, 0);
			const badPath = Notice.messages[0] || "";

			type(src.controls[0].control, "Vue规范库/00-规范");
			type(name.controls[0].control, "ok");
			await clickButton(name, 0);
			const added = p.settings.profiles.length === 1;

			const { settings: again } = render(p);
			const row = again.find((s) => s.name === "ok");
			await row.controls[0].control.buttonEl.listeners.click[0]();
			const removed = p.settings.profiles.length === 0;

			const pass = unknown.includes("未登记的知识库") && badPath.includes("子目录不存在") && added && removed;
			return { pass, detail: `${unknown} | ${badPath} | added=${added} removed=${removed}` };
		},
	},
	{
		id: "T021",
		name: "后台刷新不会清空正在输入的内容",
		severity: "low",
		run: async () => {
			const p = await makePlugin([]);
			Setting.all = [];
			const view = new QuotePanel({ app }, p);
			await view.onOpen();
			const add = Setting.all.find((s) => s.name === "登记知识库");
			type(add.controls.find((c) => c.type === "text").control, "D:/Notes/正在输入的路径");
			p.notify();
			const after = Setting.all.find((s) => s.name === "登记知识库");
			const value = after.controls.find((c) => c.type === "text").control.inputEl.value;
			await view.onClose();
			return { pass: value === "D:/Notes/正在输入的路径", detail: value === "" ? "重新渲染后输入框被清空" : value };
		},
	},
	{
		id: "T133",
		name: "创建引用组合拒绝同名知识库歧义，并允许显式 id",
		severity: "high",
		run: async () => {
			const p = await makePlugin([
				{ id: "duplicate-a", name: "Notes", path: VA, enabled: true },
				{ id: "duplicate-b", name: "Notes", path: VB, enabled: true },
			]);
			const ambiguous = p.addProfile("ambiguous", ["Notes"]);
			const noMutation = p.settings.profiles.length === 0;
			const secondId = p.settings.vaults[1].id;
			const explicit = p.addProfile("explicit", [secondId]);
			return { pass: !ambiguous.ok && noMutation && explicit.ok && p.settings.profiles[0].sources[0].vaultId === secondId, detail: `ambiguous=${ambiguous.ok} explicit=${explicit.ok} noMutation=${noMutation}` };
		},
	},
	{
		id: "T115",
		name: "写入接入配置落盘 url 与 token，并备份旧文件",
		severity: "medium",
		run: async () => {
			const p = await makePlugin([vaultEntry]);
			const fakeHome = path.join(TMP, "home-115");
			const configPath = path.join(fakeHome, ".obsidian-quote", "config.json");
			fs.rmSync(fakeHome, { recursive: true, force: true });
			const previous = process.env.USERPROFILE;
			process.env.USERPROFILE = fakeHome;
			try {
				fs.mkdirSync(path.dirname(configPath), { recursive: true });
				fs.writeFileSync(configPath, '{"url":"http://old","token":"old"}\n', "utf8");
				const result = await p.writeHarnessConfig();
				const payload = JSON.parse(fs.readFileSync(configPath, "utf8"));
				const backup = fs.readFileSync(`${configPath}.bak`, "utf8");
				const pass =
					result.ok === true &&
					payload.token === "panel-token" &&
					payload.url === "http://127.0.0.1:45611" &&
					backup.includes('"old"');
				return { pass, detail: `${result.message} | saved=${payload.url} | backup=${backup.trim()}` };
			} finally {
				if (previous === undefined) delete process.env.USERPROFILE;
				else process.env.USERPROFILE = previous;
				fs.rmSync(fakeHome, { recursive: true, force: true });
			}
		},
	},
];
