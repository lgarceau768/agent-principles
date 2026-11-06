#!/usr/bin/env node
// Lints every skill under skills/ and checks that README.md's skill table is current.
//   node scripts/lint.mjs          check, exit 1 on any problem
//   node scripts/lint.mjs --write  regenerate the README table, then check
import { readFileSync, readdirSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const skillsDir = join(root, "skills");
const PORTABLE = new Set(["name", "description", "license", "compatibility", "metadata"]);
const TRIGGER = /^(Apply|Use) when\b/;
const DERIVED = "pstack@0.14.4";
const problems = [];
const fail = (where, msg) => problems.push(`${where}: ${msg}`);

function frontmatter(text, where) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return fail(where, "no YAML frontmatter"), null;
  const fields = {};
  let parent = null;
  for (const line of m[1].split("\n")) {
    const top = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    const child = line.match(/^\s+([A-Za-z][\w-]*):\s*(.*)$/);
    if (top) {
      parent = top[1];
      fields[parent] = top[2] === "" ? {} : top[2].replace(/^"(.*)"$/, "$1");
    } else if (child && parent && typeof fields[parent] === "object") {
      fields[parent][child[1]] = child[2];
    } else if (line.trim()) {
      fail(where, `unparsed frontmatter line: ${line}`);
    }
  }
  return fields;
}

const skills = readdirSync(skillsDir)
  .filter((d) => statSync(join(skillsDir, d)).isDirectory())
  .sort()
  .map((dir) => {
    const file = join(skillsDir, dir, "SKILL.md");
    const where = `skills/${dir}/SKILL.md`;
    if (!existsSync(file)) return fail(where, "missing"), null;
    const text = readFileSync(file, "utf8");
    const fm = frontmatter(text, where);
    if (!fm) return null;

    for (const key of Object.keys(fm)) {
      if (!PORTABLE.has(key)) fail(where, `field '${key}' is not one of the portable five`);
    }
    if (fm.name !== dir) fail(where, `name '${fm.name}' does not match directory '${dir}'`);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(dir)) fail(where, "name must be lowercase kebab-case");
    if (!fm.description) fail(where, "no description");
    else if (!TRIGGER.test(fm.description)) fail(where, "description must start 'Apply when' or 'Use when'");
    else if (fm.description.length > 1024) fail(where, "description exceeds 1024 characters");
    if (fm.license !== "MIT") fail(where, "license must be MIT");
    const derived = fm.metadata?.["derived-from"];
    if (derived !== undefined && derived !== DERIVED) fail(where, `derived-from must be ${DERIVED}`);

    for (const [, target] of text.matchAll(/\]\(([^)#\s]+)(#[^)]*)?\)/g)) {
      if (/^[a-z]+:/.test(target)) continue;
      if (!existsSync(resolve(dirname(file), target))) fail(where, `broken link ${target}`);
    }
    return { dir, description: fm.description, derived: Boolean(derived) };
  })
  .filter(Boolean);

const BEGIN = "<!-- skills:begin -->";
const END = "<!-- skills:end -->";
const table = [
  BEGIN,
  "| Skill | Apply when |",
  "|---|---|",
  ...skills.map(
    (s) =>
      `| [\`${s.dir}\`](skills/${s.dir}/SKILL.md)${s.derived ? "" : " ¹"} | ${s.description
        .replace(/^(Apply|Use) when /, "")
        .replace(/\|/g, "\\|")} |`,
  ),
  END,
].join("\n");

const readmePath = join(root, "README.md");
const readme = readFileSync(readmePath, "utf8");
const start = readme.indexOf(BEGIN);
const stop = readme.indexOf(END);
if (start < 0 || stop < 0) {
  fail("README.md", `missing ${BEGIN} / ${END} markers`);
} else {
  const next = readme.slice(0, start) + table + readme.slice(stop + END.length);
  if (process.argv.includes("--write")) writeFileSync(readmePath, next);
  else if (next !== readme) fail("README.md", "skill table is stale; run node scripts/lint.mjs --write");
}

if (problems.length) {
  console.error(problems.join("\n"));
  console.error(`\n${problems.length} problem(s)`);
  process.exit(1);
}
console.log(`ok: ${skills.length} skills`);
