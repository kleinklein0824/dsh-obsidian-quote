import * as path from "path";

export interface NoteSection {
	heading: string;
	text: string;
}

export interface ParsedNote {
	title: string;
	tags: string[];
	sections: NoteSection[];
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/;
const HEADING = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
const FENCE = /^\s*(```+|~~~+)/;
const INLINE_TAG = /(^|[\s(（【])#([\p{L}\p{N}_/-]*[\p{L}_][\p{L}\p{N}_/-]*)/gu;

function stripQuotes(value: string): string {
	return value.trim().replace(/^["']|["']$/g, "").trim();
}

function pushTag(target: string[], raw: string): void {
	const tag = stripQuotes(raw).replace(/^#/, "").trim();
	if (!tag) return;
	if (!target.includes(tag)) target.push(tag);
}

function parseFrontmatter(fm: string): { title: string; tags: string[] } {
	const tags: string[] = [];
	let title = "";
	const lines = fm.split(/\r?\n/);
	let inTagList = false;

	for (const line of lines) {
		const tagLine = /^tags\s*:\s*(.*)$/i.exec(line);
		if (tagLine) {
			const value = tagLine[1].trim();
			inTagList = value.length === 0;
			if (value.startsWith("[")) {
				value
					.replace(/^\[|\]$/g, "")
					.split(",")
					.forEach((item) => pushTag(tags, item));
			} else if (value.length > 0) {
				value.split(",").forEach((item) => pushTag(tags, item));
			}
			continue;
		}

		const titleLine = /^title\s*:\s*(.*)$/i.exec(line);
		if (titleLine) {
			title = stripQuotes(titleLine[1]);
			inTagList = false;
			continue;
		}

		if (inTagList) {
			const item = /^\s*-\s+(.+)$/.exec(line);
			if (item) {
				pushTag(tags, item[1]);
				continue;
			}
			if (/^\S/.test(line)) inTagList = false;
		}
	}

	return { title, tags };
}

function collectInlineTags(lines: string[], tags: string[]): void {
	let inFence = false;
	let fenceMark = "";
	for (const line of lines) {
		const fence = FENCE.exec(line);
		if (fence) {
			if (!inFence) {
				inFence = true;
				fenceMark = fence[1][0];
			} else if (line.trim().startsWith(fenceMark.repeat(3))) {
				inFence = false;
			}
			continue;
		}
		if (inFence) continue;
		if (/^\s*#{1,6}\s/.test(line)) continue;
		INLINE_TAG.lastIndex = 0;
		let match: RegExpExecArray | null;
		while ((match = INLINE_TAG.exec(line)) !== null) {
			pushTag(tags, match[2]);
		}
	}
}

function splitSections(body: string, title: string): NoteSection[] {
	const lines = body.split(/\r?\n/);
	const sections: NoteSection[] = [];
	const stack: { level: number; text: string }[] = [];
	let buffer: string[] = [];
	let headingPath = "";
	let inFence = false;
	let fenceMark = "";

	const flush = () => {
		const text = buffer.join("\n").trim();
		if (text) sections.push({ heading: headingPath, text });
		buffer = [];
	};

	for (const line of lines) {
		const fence = FENCE.exec(line);
		if (fence) {
			if (!inFence) {
				inFence = true;
				fenceMark = fence[1][0];
			} else if (line.trim().startsWith(fenceMark.repeat(3))) {
				inFence = false;
			}
			buffer.push(line);
			continue;
		}

		if (!inFence) {
			const heading = HEADING.exec(line);
			if (heading) {
				flush();
				const level = heading[1].length;
				while (stack.length > 0 && stack[stack.length - 1].level >= level) stack.pop();
				stack.push({ level, text: heading[2].trim() });
				const names = stack.map((item) => item.text);
				if (names.length > 1 && names[0] === title) names.shift();
				headingPath = names.filter((name, index) => name !== names[index - 1]).join(" › ");
				continue;
			}
		}

		buffer.push(line);
	}

	flush();
	return sections;
}

export function parseNote(raw: string, relPath: string): ParsedNote {
	const clean = raw.replace(/^\uFEFF/, "");
	const match = FRONTMATTER.exec(clean);
	let frontmatter = "";
	let body = clean;
	if (match) {
		frontmatter = match[1];
		body = clean.slice(match[0].length);
	}

	const meta = parseFrontmatter(frontmatter);
	const tags = meta.tags.slice();
	collectInlineTags(body.split(/\r?\n/), tags);

	const fallbackTitle = path.basename(relPath, path.extname(relPath));
	const title = meta.title || fallbackTitle;

	return {
		title,
		tags,
		sections: splitSections(body, title),
	};
}
