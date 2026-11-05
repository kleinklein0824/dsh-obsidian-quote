import esbuild from "esbuild";
import process from "process";

const banner = `/*
Obsidian Quote — local, read-only vault retrieval for AI coding harnesses.
Built with esbuild. Do not edit the bundled output.
*/`;

const production = process.argv[2] === "production";

const context = await esbuild.context({
  banner: { js: banner },
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: [
    "obsidian",
    "electron",
    "@codemirror/autocomplete",
    "@codemirror/collab",
    "@codemirror/commands",
    "@codemirror/language",
    "@codemirror/lint",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    "@lezer/common",
    "@lezer/highlight",
    "@lezer/lr",
    ...(production ? [] : []),
  ],
  format: "cjs",
  charset: "utf8",
  target: "es2018",
  logLevel: "info",
  sourcemap: production ? false : "inline",
  treeShaking: true,
  outfile: "main.js",
  minify: production,
  platform: "node",
});

if (production) {
  await context.rebuild();
  await context.dispose();
} else {
  await context.watch();
}
