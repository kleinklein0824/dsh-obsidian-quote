import { App, PluginSettingTab } from "obsidian";
import type QuotePlugin from "./main";
import { renderQuotePanel } from "./panel";

export class QuoteSettingTab extends PluginSettingTab {
	private unsubscribe: (() => void) | null = null;

	constructor(app: App, private readonly plugin: QuotePlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass("obsidian-quote-settings");
		if (!this.unsubscribe) {
			this.unsubscribe = this.plugin.subscribe(() => this.display());
		}
		renderQuotePanel(containerEl, this.plugin);
	}

	hide(): void {
		// Without this the subscription outlived the settings tab: every later
		// plugin.notify() re-rendered a panel that may already be detached.
		this.unsubscribe?.();
		this.unsubscribe = null;
	}
}
