const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

if (!fs.existsSync(path.join(__dirname, "core.cjs"))) {
	console.error("缺少 audit/core.cjs，请先运行 node audit/bundle.mjs");
	process.exit(1);
}
// Regenerate fixtures so every audit starts from the same corpus.
execFileSync(process.execPath, [path.join(__dirname, "fixtures.mjs")], { stdio: "ignore" });

const suites = [
	["构建与交付", require("./suite-build.cjs")],
	["多库与面板", require("./suite-panel.cjs")],
	["只读与索引范围", require("./suite-index.cjs")],
	["解析与分块", require("./suite-parse.cjs")],
	["检索质量与约束", require("./suite-search.cjs")],
	["来源组合", require("./suite-source.cjs")],
	["条款与摘要", require("./suite-rules.cjs")],
	["HTTP 服务", require("./suite-http.cjs")],
	["CLI 接入层", require("./suite-cli.cjs")],
	["MCP 接入层", require("./suite-mcp.cjs")],
	["idea.md 符合性", require("./suite-conformance.cjs")],
	["发布安全回归", require("./suite-security.cjs")],
];

(async () => {
	const results = [];
	const startedAt = Date.now();
	for (const [suite, tests] of suites) {
		console.log(`\n=== ${suite} (${tests.length}) ===`);
		for (const test of tests) {
			let pass = false;
			let detail = "";
			const t0 = Date.now();
			try {
				const outcome = await test.run();
				pass = Boolean(outcome && outcome.pass);
				detail = (outcome && outcome.detail) || "";
			} catch (error) {
				pass = false;
				detail = `执行异常：${error && error.message ? error.message : String(error)}`;
			}
			const took = Date.now() - t0;
			results.push({ id: test.id, suite, name: test.name, severity: test.severity, pass, detail, took });
			console.log(`${test.id} ${pass ? "PASS" : "FAIL"} ${test.name} (${took}ms)${pass ? "" : `\n      → ${detail}`}`);
		}
	}

	const total = results.length;
	const passed = results.filter((r) => r.pass).length;
	const failed = results.filter((r) => !r.pass);
	const bySeverity = {};
	for (const item of results) {
		const key = item.severity;
		bySeverity[key] = bySeverity[key] || { total: 0, failed: 0 };
		bySeverity[key].total++;
		if (!item.pass) bySeverity[key].failed++;
	}

	console.log(`\n================ 汇总 ================`);
	console.log(`用例：${total}  通过：${passed}  失败：${failed.length}  耗时：${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
	console.log(`按严重度：${Object.entries(bySeverity).map(([k, v]) => `${k} ${v.total - v.failed}/${v.total}`).join("  ")}`);
	if (failed.length > 0) {
		console.log(`\n失败清单：`);
		for (const item of failed) console.log(`- ${item.id} [${item.severity}] ${item.name}\n    ${item.detail}`);
	}

	fs.writeFileSync(path.join(__dirname, "results.json"), JSON.stringify({ total, passed, failed: failed.length, bySeverity, results }, null, 2));
	// Assert a floor rather than an exact count: cases get added as defects are
	// found and covered, and an exact match made every new case look like a
	// regression of the suite itself.
	const MIN_CASES = 100;
	if (total < MIN_CASES) {
		console.error(`\n用例数量少于下限 ${MIN_CASES}，实际 ${total}`);
		process.exitCode = 1;
	}
	if (failed.length > 0) process.exitCode = 1;
})();
