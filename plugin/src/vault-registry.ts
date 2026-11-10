import * as crypto from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import type { VaultEntry } from "./types";

/** Path containment with the platform's comparison rules (including Windows casing). */
export function isWithinDirectory(candidate: string, directory: string): boolean {
	const relative = path.relative(directory, candidate);
	return relative === "" || (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

export function normalizeVaultPath(input: string): string {
	let value = input.trim();
	if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
		value = value.slice(1, -1);
	}
	value = value.replace(/^file:\/\//i, "");
	// file:///C:/Notes arrives as /C:/Notes; path.resolve would otherwise
	// produce C:\C:\Notes on Windows.
	if (/^\/[A-Za-z]:\//.test(value)) value = value.slice(1);
	return path.resolve(value);
}

export function isAbsoluteVaultPath(input: string): boolean {
	let value = input.trim();
	if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
		value = value.slice(1, -1);
	}
	value = value.replace(/^file:\/\//i, "");
	if (/^\/[A-Za-z]:\//.test(value)) value = value.slice(1);
	return path.isAbsolute(value);
}

export function makeVaultId(absolutePath: string): string {
	return crypto.createHash("sha1").update(absolutePath.toLowerCase()).digest("hex").slice(0, 12);
}

export function vaultNameFromPath(absolutePath: string): string {
	const base = path.basename(absolutePath);
	return base || absolutePath;
}

export function isValidVaultPath(absolutePath: string): boolean {
	try {
		return fs.statSync(absolutePath).isDirectory();
	} catch {
		return false;
	}
}

export function createVaultEntry(input: string): VaultEntry {
	const absolutePath = normalizeVaultPath(input);
	return {
		id: makeVaultId(absolutePath),
		name: vaultNameFromPath(absolutePath),
		path: absolutePath,
		enabled: true,
	};
}

/** Reads Obsidian's global config to find vaults registered on this machine. */
export function discoverLocalVaults(): { name: string; path: string }[] {
	const candidates: string[] = [];
	if (process.env.APPDATA) {
		candidates.push(path.join(process.env.APPDATA, "obsidian", "obsidian.json"));
	}
	candidates.push(path.join(os.homedir(), "Library", "Application Support", "obsidian", "obsidian.json"));
	candidates.push(path.join(os.homedir(), ".config", "obsidian", "obsidian.json"));

	const found: { name: string; path: string }[] = [];
	const seen = new Set<string>();

	for (const file of candidates) {
		if (!fs.existsSync(file)) continue;
		try {
			const raw = fs.readFileSync(file, "utf8");
			const parsed = JSON.parse(raw) as { vaults?: Record<string, { path?: string }> };
			const vaults = parsed.vaults ?? {};
			for (const key of Object.keys(vaults)) {
				const vaultPath = vaults[key]?.path;
				if (!vaultPath) continue;
				const absolutePath = normalizeVaultPath(vaultPath);
				const id = makeVaultId(absolutePath);
				if (seen.has(id)) continue;
				seen.add(id);
				found.push({ name: vaultNameFromPath(absolutePath), path: absolutePath });
			}
		} catch {
			// Ignore a broken global config and keep scanning other locations.
		}
	}

	return found;
}
