import { randomBytes } from "crypto";
import type { QuoteSettings } from "./types";

export const VIEW_TYPE = "obsidian-quote-panel";
export const PLUGIN_ID = "obsidian-quote";

function randomToken(): string {
	return randomBytes(32).toString("hex");
}

/**
 * Every value below is a configurable default, not a hard-coded rule:
 * the panel exposes all of them and the README documents each one.
 */
export function createDefaultSettings(): QuoteSettings {
	return {
		vaults: [],
		scope: {
			includeFolders: [],
			excludeFolders: [],
			requiredTags: [],
		},
		retrieval: {
			topK: 5,
			maxCharsPerSnippet: 1200,
			totalCharsBudget: 6000,
			perFileLimit: 3,
			minScoreRatio: 0.2,
		},
		server: {
			enabled: true,
			host: "127.0.0.1",
			port: 43117,
			token: randomToken(),
		},
		index: {
			refreshSeconds: 120,
			maxFileSizeKB: 512,
			watch: true,
		},
		ui: {
			advanced: false,
			autoRegisterCurrentVault: true,
		},
		injection: {
			format: "markdown",
			timing: "manual",
		},
		profiles: [],
	};
}
