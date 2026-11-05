/**
 * Lightweight tokenizer that works for both Latin text and CJK text.
 *
 * - Latin: lowercase word runs (`[a-z0-9_]+`), keeps identifiers like `gpio_mode_ipu` intact.
 * - CJK: character bigrams, which is the standard cheap approach for Chinese retrieval
 *   without a dictionary. Single-character runs are kept as-is.
 */
const CJK_RUN = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]+/g;
const LATIN_WORD = /[a-z0-9_]+/g;

export function tokenize(text: string): string[] {
	const tokens: string[] = [];
	if (!text) return tokens;
	const lower = text.toLowerCase();

	const latin = lower.match(LATIN_WORD);
	if (latin) {
		for (const word of latin) {
			if (word.length > 1) tokens.push(word);
		}
	}

	const cjkRuns = lower.match(CJK_RUN);
	if (cjkRuns) {
		for (const run of cjkRuns) {
			if (run.length === 1) {
				tokens.push(run);
				continue;
			}
			for (let i = 0; i < run.length - 1; i++) {
				tokens.push(run.slice(i, i + 2));
			}
		}
	}

	return tokens;
}

export function uniqueTokens(text: string): string[] {
	return Array.from(new Set(tokenize(text)));
}
