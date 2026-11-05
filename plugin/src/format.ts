import type { InjectionSettings } from "./types";

/** Section titles used by the brief. Kept here so the format is configurable. */
export const GROUP_TITLES: Record<"must" | "should" | "tip", string> = {
	must: "## 必须",
	should: "## 建议",
	tip: "## 可选",
};

/**
 * Frames an assembled context block for the harness. "plain" avoids HTML
 * comments for harnesses that render or strip them.
 */
export function renderContextHeader(
	query: string,
	snippets: number,
	format: InjectionSettings["format"]
): string {
	if (format === "plain") return `查询：${query} · ${snippets} 段`;
	return `<!-- obsidian-quote: query="${query}" snippets=${snippets} -->`;
}
