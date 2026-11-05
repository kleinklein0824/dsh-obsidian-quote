import * as crypto from "crypto";
import { tokenize } from "./tokenizer";
import type { Rule, RulePriority } from "./types";

export interface RuleInternal extends Rule {
	tf: Map<string, number>;
	length: number;
}

export interface RuleContext {
	vaultId: string;
	vault: string;
	path: string;
	heading: string;
	tags: string[];
	updated: string;
}

const MUST_RE = /(必须|禁止|严禁|不得|不允许|务必|一定要|\bmust\b|\bnever\b|\brequired\b|\bshall\b)/i;
const SHOULD_RE = /(应该|应当|推荐|建议|统一|\bshould\b|\brecommend|\bprefer\b)/i;
const TIP_RE = /(避免|不要|不建议|注意|切勿|\bavoid\b|\bdon'?t\b)/i;
/**
 * Negated forms of the SHOULD cues ("不建议" contains "建议", "不推荐" contains
 * "推荐"). They must be tested before SHOULD_RE, otherwise a prohibition gets
 * upgraded into a recommendation and even outranks genuine must-rules via
 * PRIORITY_WEIGHT.
 */
const NEGATED_SHOULD_RE = /(不建议|不推荐|不提倡|不要求|不需要|不必|无须|无需|不应|不应该|不应当|\bnot\s+recommend|\bnot\s+prefer|\bshould\s+not\b)/i;

const TOPIC_KEYWORDS: Record<string, string[]> = {
	命名: ["命名", "名称", "大小写", "camel", "pascal", "kebab", "snake"],
	目录结构: ["目录", "文件夹", "工程结构", "分层", "src/"],
	注释: ["注释", "jsdoc", "docstring", "文档注释"],
	格式: ["缩进", "分号", "引号", "格式化", "prettier", "eslint", "代码风格"],
	错误处理: ["错误处理", "异常", "try", "catch", "兜底", "错误码"],
	组件: ["组件", "props", "emit", "slot", "component"],
	样式: ["样式", "css", "scss", "类名", "tailwind"],
	类型: ["类型", "interface", "泛型", "typescript"],
	接口: ["接口", "api", "请求", "rest"],
	状态管理: ["状态管理", "pinia", "vuex", "redux", "store"],
	测试: ["测试", "单测", "覆盖率", "test"],
	提交: ["提交", "commit", "分支", "git"],
	配置: ["配置", "环境变量", "config", "setting"],
	性能: ["性能", "优化", "缓存", "懒加载"],
	安全: ["安全", "鉴权", "权限", "token"],
	数据库: ["数据库", "sql", "表结构"],
	日志: ["日志", "log", "打印"],
};

const TOPIC_NAMES = Object.keys(TOPIC_KEYWORDS);
const PRIORITY_WEIGHT: Record<RulePriority, number> = { must: 1.4, should: 1.15, tip: 0.9 };
const MAX_RULES_PER_NOTE = 60;

interface Candidate {
	/** Text shown to the user. */
	text: string;
	/** Text used for priority detection (a table row keeps all cells). */
	raw: string;
}

function cleanup(text: string): string {
	return text
		// Inline code is literal: punctuation, case and repeated spaces can change its meaning.
		.replace(/(`+)(.*?)\1|\*\*|__|\s+/g, (match, delimiter: string | undefined) =>
			delimiter ? match : /^\s/.test(match) ? " " : "",
		)
		.replace(/^[-*+>\s]+/, "")
		.trim();
}

function candidates(text: string): Candidate[] {
	const withoutFences = text.replace(/```[\s\S]*?```/g, "\n");
	const out: Candidate[] = [];

	for (const rawLine of withoutFences.split(/\r?\n/)) {
		let line = rawLine.trim();
		if (!line) continue;
		if (/^#{1,6}\s/.test(line)) continue;

		if (line.startsWith("|")) {
			const cells = line
				.split("|")
				.map((cell) => cell.trim())
				.filter((cell) => cell.length > 0);
			if (cells.length >= 2 && !/^[-:\s]+$/.test(cells[0])) {
				out.push({ text: `${cells[0]}：${cells[1]}`, raw: cells.join("；") });
			}
			continue;
		}

		line = line.replace(/^>\s*/, "");
		line = line.replace(/^[-*+]\s+/, "").replace(/^\d+[.)]\s+/, "");
		if (!line) continue;

		for (const part of line.split(/(?<=[。！？；!?;])\s*/)) {
			const sentence = part.trim();
			if (sentence) out.push({ text: sentence, raw: sentence });
		}
	}

	return out;
}

function priorityOf(text: string): RulePriority | null {
	if (MUST_RE.test(text)) return "must";
	// Test negated SHOULD cues first: "不建议" / "不推荐" / "不应该" all contain a
	// positive SHOULD_RE substring, so a naive SHOULD-first order would silently
	// promote a prohibition into a recommendation (and give it SHOULD's weight).
	if (NEGATED_SHOULD_RE.test(text)) return "tip";
	if (SHOULD_RE.test(text)) return "should";
	if (TIP_RE.test(text)) return "tip";
	return null;
}

function detectTopics(text: string): string[] {
	const lower = text.toLowerCase();
	const topics: string[] = [];
	for (const topic of TOPIC_NAMES) {
		const keys = TOPIC_KEYWORDS[topic];
		if (keys.some((key) => lower.includes(key.toLowerCase()))) topics.push(topic);
		if (topics.length >= 4) break;
	}
	return topics;
}

function looksLikeLabelValue(text: string): boolean {
	const match = /^([^：:]{1,14})[：:]\s*(.{2,60})$/.exec(text);
	if (!match) return false;
	const label = match[1].trim();
	if (!TOPIC_NAMES.includes(label)) return false;
	const value = match[2].trim();
	if (value.length > 40) return false;
	return (
		/[A-Za-z`]/.test(value) ||
		/(PascalCase|camelCase|kebab-case|snake_case|大写|小写|单引号|双引号|分号|缩进)/i.test(value)
	);
}

const SKIP_PREFIX = /^(一句话|相关|前置|下游|上游|参见|详见|命名拆解|目录结构说明)\s*[：:]/;

function isNoise(text: string): boolean {
	if (/^(\[\[[^\]]*\]\]\s*)+$/.test(text)) return true;
	if (/^(来源|参考资料|参考文献|图|表|示例|目录|索引|返回|上一篇|下一篇)\s*[：:]?/.test(text) && text.length < 12) {
		return true;
	}
	return false;
}

/** Conservative identity: never erase potentially meaningful programming text. */
export function ruleKey(text: string): string {
	return text.trim();
}

export function ruleId(text: string): string {
	const digest = crypto.createHash("sha256").update(ruleKey(text)).digest("hex");
	return `R-${digest.slice(0, 16).toUpperCase()}`;
}

export function priorityWeight(priority: RulePriority): number {
	return PRIORITY_WEIGHT[priority];
}

/** Extracts atomic normative statements ("必须 / 建议 / 避免") from one section. */
export function extractRules(text: string, ctx: RuleContext): RuleInternal[] {
	const out: RuleInternal[] = [];
	const seen = new Set<string>();

	for (const candidate of candidates(text)) {
		if (out.length >= MAX_RULES_PER_NOTE) break;

		const cleaned = cleanup(candidate.text);
		if (cleaned.length < 6 || cleaned.length > 180) continue;
		if (!/[\p{L}]/u.test(cleaned)) continue;
		if (isNoise(cleaned)) continue;
		if (SKIP_PREFIX.test(cleaned)) continue;
		if (/[：:，,、]$/.test(cleaned)) continue;

		let priority = priorityOf(candidate.raw);
		if (!priority) {
			if (!looksLikeLabelValue(cleaned) || cleaned.length > 80) continue;
			priority = "tip";
		}

		const key = ruleKey(cleaned);
		if (!key || seen.has(key)) continue;
		seen.add(key);

		const topics = detectTopics(`${cleaned} ${ctx.heading}`);
		const code = Array.from(new Set(Array.from(cleaned.matchAll(/`([^`\n]{1,40})`/g)).map((match) => match[1]))).slice(0, 3);

		const tf = new Map<string, number>();
		const add = (value: string, weight: number) => {
			if (!value) return;
			for (const token of tokenize(value)) tf.set(token, (tf.get(token) ?? 0) + weight);
		};
		add(cleaned, 3);
		add(ctx.heading, 2);
		add(ctx.tags.join(" "), 1);

		let length = 0;
		for (const value of tf.values()) length += value;

		out.push({
			id: ruleId(cleaned),
			text: cleaned,
			priority,
			topics,
			code,
			tags: ctx.tags.slice(0, 8),
			vaultId: ctx.vaultId,
			vault: ctx.vault,
			path: ctx.path,
			heading: ctx.heading,
			updated: ctx.updated,
			count: 1,
			tf,
			length,
		});
	}

	return out;
}

export function publicRule(rule: RuleInternal): Rule {
	return {
		id: rule.id,
		text: rule.text,
		priority: rule.priority,
		topics: rule.topics,
		code: rule.code,
		tags: rule.tags,
		vaultId: rule.vaultId,
		vault: rule.vault,
		path: rule.path,
		heading: rule.heading,
		updated: rule.updated,
		count: rule.count,
	};
}
