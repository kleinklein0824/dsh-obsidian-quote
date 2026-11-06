import {
	ButtonComponent,
	DropdownComponent,
	ExtraButtonComponent,
	ItemView,
	Notice,
	Setting,
	ToggleComponent,
	WorkspaceLeaf,
} from "obsidian";
import { VIEW_TYPE } from "./constants";
import type QuotePlugin from "./main";
import { createVaultEntry, discoverLocalVaults, normalizeVaultPath } from "./vault-registry";

type ButtonVariant = "primary" | "secondary" | "ghost";

function linesOf(value: string): string[] {
	return value
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.length > 0);
}

function clampInteger(value: string, min: number, max: number, fallback: number): number {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return fallback;
	return Math.min(max, Math.max(min, Math.round(parsed)));
}

function formatTime(timestamp: number): string {
	return new Date(timestamp).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

function openPluginSettings(plugin: QuotePlugin): void {
	const app = plugin.app as unknown as {
		setting?: { open(): void; openTabById(id: string): void };
	};
	if (!app.setting) return;
	app.setting.open();
	app.setting.openTabById(plugin.manifest.id);
}

/** Card shell: title + description + body, mirroring EasyUI's neutral cards. */
function addCard(root: HTMLElement, title: string, desc?: string): HTMLElement {
	const card = root.createDiv({ cls: "oq-card" });
	const head = card.createDiv({ cls: "oq-card-head" });
	const text = head.createDiv({ cls: "oq-card-heading" });
	text.createEl("h3", { text: title, cls: "oq-card-title" });
	if (desc) text.createEl("p", { text: desc, cls: "oq-card-desc" });
	return card.createDiv({ cls: "oq-card-body" });
}

function addMetric(parent: HTMLElement, value: string | number, label: string): void {
	const metric = parent.createDiv({ cls: "oq-metric" });
	metric.createDiv({ cls: "oq-metric-value", text: String(value) });
	metric.createDiv({ cls: "oq-metric-label", text: label });
}

function styleButton(button: ButtonComponent, variant: ButtonVariant): void {
	button.buttonEl.addClass("oq-btn", `oq-btn-${variant}`);
}

function styleExtra(button: ExtraButtonComponent, danger = false): void {
	button.extraSettingsEl.addClass("oq-icon-btn");
	if (danger) button.extraSettingsEl.addClass("oq-icon-btn-danger");
}

function styleToggle(toggle: ToggleComponent): void {
	toggle.toggleEl.addClass("oq-switch");
}

function styleDropdown(dropdown: DropdownComponent): void {
	dropdown.selectEl.addClass("oq-select");
}

/**
 * Single renderer shared by the sidebar panel and the settings tab, so both
 * surfaces always show the same controls and state.
 */
export function renderQuotePanel(root: HTMLElement, plugin: QuotePlugin, options: { showSettingsLink?: boolean } = {}): void {
	root.empty();
	root.addClass("obsidian-quote-panel");

	const status = plugin.getStatus();
	const advanced = plugin.settings.ui.advanced;
	const config = JSON.stringify({ url: status.server.url, token: plugin.settings.server.token }, null, 2);

	// ------------------------------------------------------------------ hero
	const hero = root.createDiv({ cls: "oq-hero" });
	const heroTop = hero.createDiv({ cls: "oq-hero-top" });
	const heroHeading = heroTop.createDiv({ cls: "oq-hero-heading" });
	heroHeading.createEl("h2", { text: "知识库引用", cls: "oq-title" });
	heroHeading.createEl("p", {
		cls: "oq-hint oq-hero-sub",
		text: "把本地 Obsidian 知识库作为只读参考源，供 AI 编码 harness 按需检索。",
	});

	const pill = heroTop.createDiv({ cls: `oq-pill ${status.indexing ? "is-busy" : "is-on"}` });
	pill.createSpan({ cls: "oq-pill-dot" });
	pill.createSpan({ text: status.indexing ? "索引中" : "索引就绪" });

	const statusBox = hero.createDiv({ cls: "oq-status" });
	const line = statusBox.createDiv({ cls: "oq-status-line" });
	line.createSpan({ cls: `oq-dot ${status.server.running ? "is-on" : "is-off"}` });
	line.createSpan({
		text: status.server.running ? `引用服务运行中 · ${status.server.url}` : "引用服务未启动",
	});
	statusBox.createDiv({
		cls: "oq-status-meta",
		text: `${status.vaults.length} 个知识库 · ${status.totalDocs} 篇笔记 · ${status.totalChunks} 个段落 · ${
			status.totalRules
		} 条规则${status.indexing ? " · 索引中…" : ""}`,
	});

	const metrics = hero.createDiv({ cls: "oq-metrics" });
	addMetric(metrics, status.vaults.length, "知识库");
	addMetric(metrics, status.totalDocs, "笔记");
	addMetric(metrics, status.totalChunks, "段落");
	addMetric(metrics, status.totalRules, "条款");

	const actions = hero.createDiv({ cls: "oq-actions" });
	const rebuildButton = actions.createEl("button", { text: "重建索引", cls: "oq-btn oq-btn-primary" });
	rebuildButton.addEventListener("click", () => {
		rebuildButton.setAttribute("disabled", "true");
		rebuildButton.setText("索引中…");
		// No .catch meant a rejected rebuild left the button permanently
		// disabled, with only an unhandled rejection in the console.
		void plugin
			.rebuild()
			.then(() => {
				new Notice(`索引完成：${plugin.getStatus().totalChunks} 个段落`);
			})
			.catch((error: unknown) => {
				new Notice(`索引失败：${error instanceof Error ? error.message : String(error)}`);
			})
			.finally(() => {
				rebuildButton.removeAttribute("disabled");
				rebuildButton.setText("重建索引");
			});
	});

	const copyButton = actions.createEl("button", { text: "复制接入配置", cls: "oq-btn oq-btn-secondary" });
	copyButton.addEventListener("click", () => {
		void navigator.clipboard.writeText(config).then(
			() => new Notice("接入配置已复制"),
			() => new Notice("复制失败，请手动选择下方配置")
		);
	});

	const writeButton = actions.createEl("button", { text: "写入接入配置", cls: "oq-btn oq-btn-secondary" });
	writeButton.title = "写入 ~/.obsidian-quote/config.json，harness 会直接读取";
	writeButton.addEventListener("click", () => {
		writeButton.setAttribute("disabled", "true");
		void plugin
			.writeHarnessConfig()
			.then((result) => {
				new Notice(result.message);
			})
			.finally(() => {
				writeButton.removeAttribute("disabled");
			});
	});

	if (options.showSettingsLink && advanced) {
		const settingsButton = actions.createEl("button", { text: "全部设置", cls: "oq-btn oq-btn-ghost" });
		settingsButton.addEventListener("click", () => openPluginSettings(plugin));
	}

	// ---------------------------------------------------------------- vaults
	const vaultBody = addCard(root, "知识库", "只读引用，不会修改、移动或迁移笔记。开关表示参与检索。");
	const list = vaultBody.createDiv({ cls: "oq-vault-list" });
	if (plugin.settings.vaults.length === 0) {
		list.createEl("p", { cls: "oq-empty", text: "尚未登记知识库。" });
	}

	for (const vault of plugin.settings.vaults) {
		const stat = plugin.indexer.statsFor(vault.id);
		const parts = [vault.path];
		if (stat) parts.push(`${stat.docs} 篇 / ${stat.chunks} 段 / ${stat.rules} 条规则`);
		if (stat?.error) parts.push(stat.error);

		new Setting(list)
			.setName(vault.name)
			.setDesc(parts.join(" · "))
			.addToggle((toggle) => {
				styleToggle(toggle);
				toggle.setValue(vault.enabled).onChange(async (value) => {
					vault.enabled = value;
					await plugin.saveSettings();
					plugin.scheduleRebuild(0);
				});
			})
			.addExtraButton((button) => {
				styleExtra(button, true);
				button
					.setIcon("trash-2")
					.setTooltip("移除")
					.onClick(async () => {
						plugin.settings.vaults = plugin.settings.vaults.filter((item) => item.id !== vault.id);
						await plugin.saveSettings();
						plugin.scheduleRebuild(0);
						plugin.notify();
					});
			});
	}

	let draftPath = "";
	new Setting(vaultBody)
		.setClass("oq-setting-wide")
		.setName("登记知识库")
		.setDesc("填写知识库根目录的绝对路径。")
		.addText((text) => {
			text.inputEl.addClass("oq-input");
			text.setPlaceholder("D:\\Notes\\MyVault").onChange((value) => {
				draftPath = value;
			});
		})
		.addButton((button) => {
			styleButton(button, "primary");
			button.setButtonText("添加").onClick(async () => {
				const input = draftPath.trim();
				if (!input) {
					new Notice("请先填写知识库路径");
					return;
				}
				const result = plugin.addVault(input);
				if (!result.ok) {
					new Notice(result.message);
					return;
				}
				await plugin.saveSettings();
				plugin.scheduleRebuild(0);
				plugin.notify();
			});
		});

	new Setting(vaultBody)
		.setName("快速登记")
		.setDesc("从当前打开的库，或本机 Obsidian 配置中读取。")
		.addButton((button) => {
			styleButton(button, "secondary");
			button.setButtonText("当前库").onClick(async () => {
				const basePath = (plugin.app.vault.adapter as { getBasePath?: () => string }).getBasePath?.();
				if (!basePath) {
					new Notice("无法读取当前库路径");
					return;
				}
				const result = plugin.addVault(basePath);
				new Notice(result.message);
				if (!result.ok) return;
				await plugin.saveSettings();
				plugin.scheduleRebuild(0);
				plugin.notify();
			});
		})
		.addButton((button) => {
			styleButton(button, "secondary");
			button.setButtonText("扫描本机").onClick(async () => {
				const found = discoverLocalVaults();
				let added = 0;
				for (const item of found) {
					const absolute = normalizeVaultPath(item.path);
					if (plugin.settings.vaults.some((vault) => vault.id === createVaultEntry(absolute).id)) continue;
					plugin.settings.vaults.push(createVaultEntry(absolute));
					added++;
				}
				new Notice(found.length === 0 ? "未在本机配置中找到知识库" : `新增 ${added} 个知识库`);
				if (added === 0) return;
				await plugin.saveSettings();
				plugin.scheduleRebuild(0);
				plugin.notify();
			});
		});

	// ----------------------------------------------------------------- scope
	const scopeBody = addCard(root, "引用范围", "目录均相对知识库根目录，每行一条；留空表示不限。");

	new Setting(scopeBody)
		.setClass("oq-setting-wide")
		.setName("包含目录")
		.setDesc("仅检索这些目录下的笔记。留空表示全库。")
		.addTextArea((area) => {
			area.inputEl.rows = 3;
			area.inputEl.addClass("oq-textarea");
			area
				.setPlaceholder("10-规范\n20-项目")
				.setValue(plugin.settings.scope.includeFolders.join("\n"))
				.onChange((value) => {
					plugin.settings.scope.includeFolders = linesOf(value);
					plugin.scheduleSave();
					plugin.scheduleRebuild(1200);
				});
		});

	new Setting(scopeBody)
		.setClass("oq-setting-wide")
		.setName("排除目录")
		.setDesc("这些目录不参与检索。")
		.addTextArea((area) => {
			area.inputEl.rows = 3;
			area.inputEl.addClass("oq-textarea");
			area
				.setPlaceholder("archive\ntemplates")
				.setValue(plugin.settings.scope.excludeFolders.join("\n"))
				.onChange((value) => {
					plugin.settings.scope.excludeFolders = linesOf(value);
					plugin.scheduleSave();
					plugin.scheduleRebuild(1200);
				});
		});

	new Setting(scopeBody)
		.setClass("oq-setting-wide")
		.setName("仅含标签")
		.setDesc("笔记需至少带有一个标签，逗号分隔；留空表示不过滤。")
		.addText((text) => {
			text.inputEl.addClass("oq-input");
			text
				.setPlaceholder("规范, 代码风格")
				.setValue(plugin.settings.scope.requiredTags.join(", "))
				.onChange((value) => {
					plugin.settings.scope.requiredTags = value
						.split(",")
						.map((item) => item.trim().replace(/^#/, ""))
						.filter((item) => item.length > 0);
					plugin.scheduleSave();
					plugin.scheduleRebuild(1200);
				});
		});

	// ------------------------------------------------------------- retrieval
	const retrievalBody = addCard(root, "检索参数", "控制单次引用的条数与篇幅，避免一次注入过多内容。");

	const numberSetting = (name: string, desc: string, value: number, min: number, max: number, fallback: number, onChange: (value: number) => void) => {
		new Setting(retrievalBody)
			.setName(name)
			.setDesc(desc)
			.addText((text) => {
				text.inputEl.type = "number";
				text.inputEl.min = String(min);
				text.inputEl.max = String(max);
				text.inputEl.addClass("oq-input", "oq-input-number");
				text.setValue(String(value)).onChange((input) => {
					onChange(clampInteger(input, min, max, fallback));
				});
			});
	};

	numberSetting("单次引用条数", "默认 5，范围 1–50。", plugin.settings.retrieval.topK, 1, 50, 5, (value) => {
		plugin.settings.retrieval.topK = value;
		plugin.scheduleSave();
	});

	numberSetting(
		"单段最大字符",
		"默认 1200，范围 200–8000。超出会切分段落。",
		plugin.settings.retrieval.maxCharsPerSnippet,
		200,
		8000,
		1200,
		(value) => {
			plugin.settings.retrieval.maxCharsPerSnippet = value;
			plugin.scheduleSave();
			plugin.scheduleRebuild(1200);
		}
	);

	numberSetting(
		"单次总字符预算",
		"默认 6000，范围 500–40000。超出预算的片段不再引用。",
		plugin.settings.retrieval.totalCharsBudget,
		500,
		40000,
		6000,
		(value) => {
			plugin.settings.retrieval.totalCharsBudget = value;
			plugin.scheduleSave();
		}
	);

	numberSetting(
		"单篇最多片段",
		"默认 3，避免同一篇笔记占满结果。",
		plugin.settings.retrieval.perFileLimit,
		1,
		10,
		3,
		(value) => {
			plugin.settings.retrieval.perFileLimit = value;
			plugin.scheduleSave();
		}
	);

	new Setting(retrievalBody)
		.setName("最低相关度")
		.setDesc("默认 0.2，相对最高分的比例，范围 0–1。")
		.addText((text) => {
			text.inputEl.type = "number";
			text.inputEl.min = "0";
			text.inputEl.max = "1";
			text.inputEl.step = "0.05";
			text.inputEl.addClass("oq-input", "oq-input-number");
			text.setValue(String(plugin.settings.retrieval.minScoreRatio)).onChange((value) => {
				const parsed = Number(value);
				if (!Number.isFinite(parsed)) return;
				plugin.settings.retrieval.minScoreRatio = Math.min(1, Math.max(0, parsed));
				plugin.scheduleSave();
			});
		});

	new Setting(retrievalBody)
		.setName("自动跟随文件变化")
		.setDesc("笔记新增或保存后自动增量重建索引。")
		.addToggle((toggle) => {
			styleToggle(toggle);
			toggle.setValue(plugin.settings.index.watch).onChange(async (value) => {
				plugin.settings.index.watch = value;
				await plugin.saveSettings();
				plugin.notify();
			});
		});

	// --------------------------------------------------------------- profiles
	if (advanced) {
		const profileBody = addCard(
			root,
			"引用组合",
			"把多个库或库内子目录打包成一个来源，harness 侧用 --profile 名称 一次引用。"
		);

		const profileList = profileBody.createDiv({ cls: "oq-vault-list" });
		if (plugin.settings.profiles.length === 0) {
			profileList.createEl("p", { cls: "oq-empty", text: "尚未创建组合。" });
		}
		for (const profile of plugin.settings.profiles) {
			const label = profile.sources
				.map((source) => (source.path ? `${source.vault}/${source.path}` : source.vault))
				.join(" + ");
			new Setting(profileList)
				.setName(profile.name)
				.setDesc(label)
				.addExtraButton((button) => {
					styleExtra(button, true);
					button
						.setIcon("trash-2")
						.setTooltip("移除")
						.onClick(async () => {
							plugin.settings.profiles = plugin.settings.profiles.filter((item) => item.id !== profile.id);
							await plugin.saveSettings();
							plugin.notify();
						});
				});
		}

		let profileSources = "";
		let profileName = "";
		new Setting(profileBody)
			.setClass("oq-setting-wide")
			.setName("组合来源")
			.setDesc("每行一个：库名，或 库名/子目录。可跨库混合。")
			.addTextArea((area) => {
				area.inputEl.rows = 3;
				area.inputEl.addClass("oq-textarea");
				area.setPlaceholder("Obsidian test1/Vue3/组件规范\nObsidian Vault/wiki").onChange((value) => {
					profileSources = value;
				});
			});

		new Setting(profileBody)
			.setClass("oq-setting-wide")
			.setName("组合名称")
			.addText((text) => {
				text.inputEl.addClass("oq-input");
				text.setPlaceholder("vue-规范").onChange((value) => {
					profileName = value;
				});
			})
			.addButton((button) => {
				styleButton(button, "primary");
				button.setButtonText("添加组合").onClick(async () => {
					const result = plugin.addProfile(profileName, linesOf(profileSources));
					new Notice(result.message);
					if (!result.ok) return;
					await plugin.saveSettings();
					plugin.notify();
				});
			});

		// ------------------------------------------------------------- injection
		const injectionBody = addCard(root, "注入设置", "控制交给 harness 的上下文格式与建议时机。");
		new Setting(injectionBody)
			.setName("上下文格式")
			.setDesc("markdown 带 HTML 注释头，plain 为纯文本；影响 /context 输出。")
			.addDropdown((dropdown) => {
				styleDropdown(dropdown);
				dropdown
					.addOption("markdown", "Markdown")
					.addOption("plain", "纯文本")
					.setValue(plugin.settings.injection.format)
					.onChange(async (value) => {
						plugin.settings.injection.format = value === "plain" ? "plain" : "markdown";
						await plugin.saveSettings();
						plugin.notify();
					});
			});

		new Setting(injectionBody)
			.setName("建议注入时机")
			.setDesc("写入 /health 供 harness 参考：manual 按需检索；brief-first 项目开始先取一次摘要。")
			.addDropdown((dropdown) => {
				styleDropdown(dropdown);
				dropdown
					.addOption("manual", "按需检索")
					.addOption("brief-first", "项目开始先取摘要")
					.setValue(plugin.settings.injection.timing)
					.onChange(async (value) => {
						plugin.settings.injection.timing = value === "brief-first" ? "brief-first" : "manual";
						await plugin.saveSettings();
						plugin.notify();
					});
			});

		// ----------------------------------------------------------------- ledger
		const ledgerBody = addCard(root, "引用台账", "仅记录在本机，用于反推该收窄还是补充知识库。");
		const stats = plugin.getStats();
		ledgerBody.createEl("p", {
			cls: "oq-hint",
			text: `累计 ${stats.totalQueries} 次检索 · 引用 ${stats.totalCitations} 个片段`,
		});
		if (stats.recent.length === 0) {
			ledgerBody.createEl("p", { cls: "oq-empty", text: "暂无引用记录。" });
		} else {
			const ledger = ledgerBody.createDiv({ cls: "oq-ledger" });
			for (const item of stats.recent.slice(0, 3)) {
				const row = ledger.createDiv({ cls: "oq-ledger-row" });
				row.createSpan({ cls: "oq-ledger-query", text: `${item.kind} · ${item.query || "（空）"}` });
				row.createSpan({ cls: "oq-ledger-meta", text: `${item.hits} 条 · ${formatTime(item.at)}` });
			}
			const top = stats.topNotes[0];
			if (top) {
				ledgerBody.createEl("p", { cls: "oq-hint", text: `高频：${top.path}（${top.count} 次）` });
			}
		}
	}

	// --------------------------------------------------------------- service
	const serviceBody = addCard(
		root,
		"Harness 接入",
		"插件只提供本地只读检索服务，不改动 harness 的配置或源码；harness 侧通过 skill 或 MCP 适配层调用。"
	);

	new Setting(serviceBody)
		.setName("启用引用服务")
		.setDesc("仅监听本机回环地址。关闭后 harness 无法检索。")
		.addToggle((toggle) => {
			styleToggle(toggle);
			toggle.setValue(plugin.settings.server.enabled).onChange(async (value) => {
				plugin.settings.server.enabled = value;
				if (value) {
					try {
						await plugin.server.start();
					} catch (error) {
						plugin.settings.server.enabled = false;
						new Notice(`服务启动失败：${error instanceof Error ? error.message : String(error)}`);
					}
				} else {
					await plugin.server.stop();
				}
				await plugin.saveSettings();
				plugin.notify();
			});
		});

	new Setting(serviceBody)
		.setName("端口")
		.setDesc("默认 43117；被占用时自动顺延最多 9 个端口。修改后失焦生效。")
		.addText((text) => {
			text.inputEl.type = "number";
			text.inputEl.min = "1024";
			text.inputEl.max = "65535";
			text.inputEl.addClass("oq-input", "oq-input-number");
			text.setValue(String(plugin.settings.server.port)).onChange((value) => {
				const port = clampInteger(value, 1024, 65535, 43117);
				if (port === plugin.settings.server.port) return;
				plugin.settings.server.port = port;
				plugin.scheduleSave();
			});
			text.inputEl.addEventListener("blur", () => {
				if (!plugin.server.running) return;
				if (plugin.server.port === plugin.settings.server.port) return;
				void (async () => {
					await plugin.server.stop();
					try {
						await plugin.server.start();
					} catch (error) {
						new Notice(`端口切换失败：${error instanceof Error ? error.message : String(error)}`);
					}
					plugin.notify();
				})();
			});
		});

	new Setting(serviceBody)
		.setClass("oq-setting-wide")
		.setName("访问令牌")
		.setDesc("harness 请求需携带 Bearer 令牌。")
		.addText((text) => {
			text.inputEl.readOnly = true;
			text.inputEl.addClass("oq-token", "oq-input");
			text.setValue(plugin.settings.server.token);
		})
		.addExtraButton((button) => {
			styleExtra(button);
			button
				.setIcon("copy")
				.setTooltip("复制接入配置")
				.onClick(() => {
					void navigator.clipboard.writeText(config).then(
						() => new Notice("接入配置已复制"),
						() => new Notice("复制失败")
					);
				});
		});

	const pre = serviceBody.createEl("pre", { cls: "oq-config" });
	pre.createEl("code", { text: config });
	serviceBody.createEl("p", {
		cls: "oq-hint",
		text: "点「写入接入配置」可直接保存到 ~/.obsidian-quote/config.json（原文件自动备份为 .bak），也可以手动粘贴给环境变量 OBSIDIAN_QUOTE_URL / OBSIDIAN_QUOTE_TOKEN。",
	});

	// ------------------------------------------------------------ panel mode
	const panelBody = addCard(root, "面板", "默认保持最小可用；需要组合、注入格式或台账时再展开。");
	new Setting(panelBody)
		.setName("显示高级功能")
		.setDesc("引用组合、注入设置与引用台账。")
		.addToggle((toggle) => {
			styleToggle(toggle);
			toggle.setValue(advanced).onChange(async (value) => {
				plugin.settings.ui.advanced = value;
				await plugin.saveSettings();
				plugin.notify();
			});
		});

	new Setting(panelBody)
		.setName("首次启用自动登记当前库")
		.setDesc("知识库列表为空时，自动把当前打开的库加入只读引用。")
		.addToggle((toggle) => {
			styleToggle(toggle);
			toggle.setValue(plugin.settings.ui.autoRegisterCurrentVault).onChange(async (value) => {
				plugin.settings.ui.autoRegisterCurrentVault = value;
				await plugin.saveSettings();
			});
		});
}

export class QuotePanel extends ItemView {
	private unsubscribe: (() => void) | null = null;

	constructor(leaf: WorkspaceLeaf, private readonly plugin: QuotePlugin) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE;
	}

	getDisplayText(): string {
		return "知识库引用";
	}

	getIcon(): string {
		return "library";
	}

	async onOpen(): Promise<void> {
		this.unsubscribe = this.plugin.subscribe(() => this.render());
		this.render();
	}

	async onClose(): Promise<void> {
		this.unsubscribe?.();
		this.unsubscribe = null;
	}

	render(): void {
		renderQuotePanel(this.contentEl, this.plugin, { showSettingsLink: true });
	}
}
