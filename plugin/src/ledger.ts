import type { CitationRecord, NoteStat, StatsResponse } from "./types";

export interface LedgerData {
	queries: number;
	citations: number;
	records: CitationRecord[];
	notes: NoteStat[];
}

export interface CitationRef {
	vault: string;
	path: string;
	title: string;
}

const MAX_RECORDS = 120;
const MAX_NOTES = 200;

/** Local, read-only citation log: which notes were actually served, and when. */
export class CitationLedger {
	private queries = 0;
	private citations = 0;
	private records: CitationRecord[] = [];
	private notes = new Map<string, NoteStat>();
	private dirty = false;

	get isDirty(): boolean {
		return this.dirty;
	}

	record(kind: string, query: string, refs: CitationRef[]): void {
		this.queries++;

		const seen = new Set<string>();
		const unique: CitationRef[] = [];
		for (const ref of refs) {
			const key = `${ref.vault}|${ref.path}`;
			if (seen.has(key)) continue;
			seen.add(key);
			unique.push(ref);
		}

		this.citations += unique.length;
		const at = Date.now();

		for (const ref of unique) {
			const key = `${ref.vault}|${ref.path}`;
			const existing = this.notes.get(key);
			if (existing) {
				existing.count++;
				existing.lastAt = at;
			} else {
				this.notes.set(key, { vault: ref.vault, path: ref.path, title: ref.title, count: 1, lastAt: at });
			}
		}

		this.records.push({
			at,
			kind,
			query,
			hits: unique.length,
			top: unique.slice(0, 3),
		});
		if (this.records.length > MAX_RECORDS) this.records.splice(0, this.records.length - MAX_RECORDS);

		if (this.notes.size > MAX_NOTES) {
			const keep = Array.from(this.notes.entries())
				.sort((a, b) => b[1].count - a[1].count)
				.slice(0, MAX_NOTES);
			this.notes = new Map(keep);
		}

		this.dirty = true;
	}

	getStats(): StatsResponse {
		const topNotes = Array.from(this.notes.values())
			.sort((a, b) => b.count - a.count || b.lastAt - a.lastAt)
			.slice(0, 8);
		const recent = this.records.slice(-10).reverse();
		return {
			totalQueries: this.queries,
			totalCitations: this.citations,
			topNotes,
			recent,
		};
	}

	load(data: Partial<LedgerData> | null | undefined): void {
		if (!data || typeof data !== "object") return;
		this.queries = Number.isFinite(data.queries) ? Number(data.queries) : 0;
		this.citations = Number.isFinite(data.citations) ? Number(data.citations) : 0;
		this.records = Array.isArray(data.records) ? data.records.slice(-MAX_RECORDS) : [];
		this.notes = new Map();
		if (Array.isArray(data.notes)) {
			for (const note of data.notes.slice(0, MAX_NOTES)) {
				if (!note || typeof note.path !== "string") continue;
				this.notes.set(`${note.vault}|${note.path}`, note);
			}
		}
		this.dirty = false;
	}

	toJSON(): LedgerData {
		return {
			queries: this.queries,
			citations: this.citations,
			records: this.records.slice(-MAX_RECORDS),
			notes: Array.from(this.notes.values())
				.sort((a, b) => b.count - a.count)
				.slice(0, MAX_NOTES),
		};
	}

	clear(): void {
		this.queries = 0;
		this.citations = 0;
		this.records = [];
		this.notes.clear();
		this.dirty = true;
	}
}
