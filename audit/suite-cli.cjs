const fs = require("node:fs");
const path = require("node:path");
const { startService, settings, run, SKILL, PROJECT, TMP } = require("./helpers.cjs");

const TOKEN = "cli-token";
const PORT = 45801;

async function withCli(fn) {
	const svc = await startService(settings({ server: { port: PORT, token: TOKEN }, profiles: [{ id: "p1", name: "vue-规范", sources: [{ vault: "Vue规范库", vaultId: "va", path: "00-规范" }] }] }));
	try {
		return await fn(svc);
	} finally {
		await svc.server.stop();
	}
}

function cli(svc, args, cwd = SKILL, extraEnv = {}) {
	return run(cwd, ["scripts/kb.mjs", ...args], { OBSIDIAN_QUOTE_URL: svc.base, OBSIDIAN_QUOTE_TOKEN: TOKEN, ...extraEnv });
}

module.exports = [
	{
		id: "T082",
		name: "CLI status 输出服务与索引规模",
		severity: "high",
		run: async () =>
			withCli(async (svc) => {
				const r = await cli(svc, ["status"]);
				const pass = r.code === 0 && r.stdout.includes("服务：正常") && r.stdout.includes("鉴权：通过") && r.stdout.includes("知识库：3 个") && r.stdout.includes("笔记 19 篇") && r.stdout.includes("注入：manual · markdown");
				return { pass, detail: r.stdout.trim().replace(/\n/g, " / ") };
			}),
	},
	{
		id: "T083",
		name: "status 能发现令牌不一致",
		severity: "high",
		run: async () =>
			withCli(async (svc) => {
				const r = await cli(svc, ["status"], SKILL, { OBSIDIAN_QUOTE_TOKEN: "wrong-token" });
				const pass = r.code !== 0 || /令牌|401|未授权|失败/.test(r.stdout + r.stderr);
				return { pass, detail: `exit=${r.code} 输出=${(r.stdout + r.stderr).trim().replace(/\n/g, " / ")}` };
			}),
	},
	{
		id: "T084",
		name: "search 人类可读输出与 --json 均正常",
		severity: "high",
		run: async () =>
			withCli(async (svc) => {
				const human = await cli(svc, ["search", "组件 命名", "--limit", "3"]);
				const json = await cli(svc, ["search", "组件", "--json"]);
				let parsed = null;
				try {
					parsed = JSON.parse(json.stdout);
				} catch {
					parsed = null;
				}
				const pass = human.code === 0 && human.stdout.includes("查询：") && human.stdout.includes("Vue规范库 / 00-规范") && parsed && Array.isArray(parsed.hits) && parsed.hits.length > 0;
				return { pass, detail: `human=${human.code} json=${json.code} hits=${parsed ? parsed.hits.length : "解析失败"}` };
			}),
	},
	{
		id: "T085",
		name: "rules / brief / context 三种输出可用",
		severity: "high",
		run: async () =>
			withCli(async (svc) => {
				const rules = await cli(svc, ["rules", "命名", "--priority", "must", "--limit", "3"]);
				const brief = await cli(svc, ["brief", "--stack", "vue"]);
				const context = await cli(svc, ["context", "GPIO", "--budget", "600"]);
				const pass = rules.stdout.includes("[必须]") && brief.stdout.includes("## 必须") && context.stdout.includes("来源：") && context.stdout.length < 700;
				return { pass, detail: `rules=${rules.code} brief=${brief.code} context=${context.code} context长度=${context.stdout.length}` };
			}),
	},
	{
		id: "T086",
		name: "--profile 与重复 --source 可限定来源",
		severity: "high",
		run: async () =>
			withCli(async (svc) => {
				await svc.indexer; // no-op
				const profile = await cli(svc, ["search", "命名", "--profile", "vue-规范", "--limit", "3"]);
				const sources = await cli(svc, ["search", "必须", "--source", "Vue规范库/00-规范", "--source", "嵌入式库/STM32", "--limit", "6"]);
				const pass = profile.code === 0 && !profile.stdout.includes("嵌入式库") && sources.stdout.includes("Vue规范库") && sources.stdout.includes("嵌入式库");
				return { pass, detail: `profile 含嵌入式=${profile.stdout.includes("嵌入式库")}；多来源双库=${sources.stdout.includes("Vue规范库") && sources.stdout.includes("嵌入式库")}` };
			}),
	},
	{
		id: "T087",
		name: "init 写入可用的接入配置",
		severity: "medium",
		run: async () =>
			withCli(async (svc) => {
				const home = path.join(TMP, "clihome");
				fs.rmSync(home, { recursive: true, force: true });
				fs.mkdirSync(home, { recursive: true });
				const r = await cli(svc, ["init", "--url", svc.base, "--token", "init-token"], SKILL, { USERPROFILE: home, HOME: home });
				const file = path.join(home, ".obsidian-quote", "config.json");
				const saved = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
				const pass = r.code === 0 && saved && saved.url === svc.base && saved.token === "init-token";
				return { pass, detail: saved ? JSON.stringify(saved) : "配置文件未生成" };
			}),
	},
	{
		id: "T088",
		name: "错误路径给出可操作提示",
		severity: "medium",
		run: async () =>
			withCli(async (svc) => {
				const unknown = await cli(svc, ["nope"]);
				const missing = await cli(svc, ["search"]);
				const offline = await run(SKILL, ["scripts/kb.mjs", "status"], { OBSIDIAN_QUOTE_URL: "http://127.0.0.1:45999", OBSIDIAN_QUOTE_TOKEN: "x" });
				const pass = unknown.code === 2 && unknown.stderr.includes("未知命令") && missing.code === 2 && missing.stderr.includes("缺少查询关键词") && offline.code === 2 && offline.stderr.includes("启用引用服务");
				return { pass, detail: `unknown=${unknown.code} missing=${missing.code} offline=${offline.code}` };
			}),
	},
	{
		id: "T089",
		name: "SKILL.md 给出的命令在项目根目录可直接执行",
		severity: "critical",
		run: async () =>
			withCli(async (svc) => {
				// Simulate the documented install: <project>/.claude/skills/obsidian-vault-quote
				const install = path.join(TMP, "install");
				const skillDir = path.join(install, ".claude", "skills", "obsidian-vault-quote");
				fs.rmSync(install, { recursive: true, force: true });
				fs.mkdirSync(path.dirname(skillDir), { recursive: true });
				fs.cpSync(SKILL, skillDir, { recursive: true });
				const r = await run(install, [".claude/skills/obsidian-vault-quote/scripts/kb.mjs", "status"], {
					OBSIDIAN_QUOTE_URL: svc.base,
					OBSIDIAN_QUOTE_TOKEN: TOKEN,
				});
				const pass = r.code === 0 && r.stdout.includes("服务：正常") && r.stdout.includes("鉴权：通过");
				return { pass, detail: `exit=${r.code} ${(r.stderr || r.stdout).split("\n").slice(0, 2).join(" / ")}` };
			}),
	},
	{
		id: "T113",
		name: "CLI 在没有配置文件时明确报告未找到接入配置",
		severity: "medium",
		run: async () => {
			// A fresh harness install has no config file and no env vars. The old
			// code hit /health and then blamed the token; this asserts the dedicated
			// pre-flight message instead.
			const fakeHome = path.join(TMP, "nohome-113");
			fs.mkdirSync(fakeHome, { recursive: true });
			const r = await run(SKILL, ["scripts/kb.mjs", "status"], {
				USERPROFILE: fakeHome,
				OBSIDIAN_QUOTE_URL: "",
				OBSIDIAN_QUOTE_TOKEN: "",
			});
			const pass = r.code === 2 && r.stderr.includes("未找到接入配置") && r.stderr.includes("写入接入配置");
			return { pass, detail: `exit=${r.code} ${r.stderr.trim().replace(/\n/g, " / ")}` };
		},
	},
];
