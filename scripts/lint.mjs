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
const CATEGORIES = {
  design: ["🧱", "Design and structure", "Shape the code before you write it."],
  simplicity: ["✂️", "Simplicity", "Less code, fewer layers, smaller diffs."],
  verification: ["✅", "Verification", "Know it works, and leave proof a reviewer can rerun."],
  reliability: ["🛡️", "Reliability and security", "Behave correctly under retries, races, and hostile callers."],
  agents: ["🤖", "Working as an agent", "Spend context and the human's attention carefully."],
};
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
      fields[parent][child[1]] = child[2].replace(/^"(.*)"$/, "$1");
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
    const meta = fm.metadata ?? {};
    if (!CATEGORIES[meta.category]) fail(where, `metadata.category must be one of ${Object.keys(CATEGORIES).join(", ")}`);
    for (const key of ["summary", "when"]) {
      if (!meta[key]) fail(where, `metadata.${key} is required (it is the README's plain-English line)`);
      else if (meta[key].length > 100) fail(where, `metadata.${key} is over 100 characters; keep it skimmable`);
    }
    return { dir, derived: Boolean(derived), ...meta };
  })
  .filter(Boolean);

const BEGIN = "<!-- skills:begin -->";
const END = "<!-- skills:end -->";
const title = (dir) =>
  dir.replace(/^principle-/, "").replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
// GitHub's heading slug: drop pictographs but keep the U+FE0F that follows some of them.
const anchor = (heading) =>
  encodeURIComponent(heading.toLowerCase().replace(/\p{Extended_Pictographic}/gu, "").replace(/ /g, "-"));
const cell = (text) => text.replace(/\|/g, "\\|");
const original = skills.filter((s) => !s.derived).length;
const table = [
  BEGIN,
  `<p>`,
  `  <img alt="skills" src="https://img.shields.io/badge/skills-${skills.length}-6f42c1">`,
  `  <img alt="derived from pstack" src="https://img.shields.io/badge/derived%20from-pstack%200.14.4-555">`,
  `  <img alt="original" src="https://img.shields.io/badge/original-${original}-2ea44f">`,
  `</p>`,
  "",
  "| | Group | What it's about |",
  "|---|---|---|",
  ...Object.entries(CATEGORIES).map(
    ([key, [icon, name, blurb]]) =>
      `| ${icon} | [${name}](#${anchor(`${icon} ${name}`)}) | ${blurb} |`,
  ),
  ...Object.entries(CATEGORIES).flatMap(([key, [icon, name, blurb]]) => [
    "",
    `### ${icon} ${name}`,
    "",
    `> ${blurb}`,
    "",
    "| Principle | The idea | Reach for it when… |",
    "|---|---|---|",
    ...skills
      .filter((s) => s.category === key)
      .map(
        (s) =>
          `| **[${title(s.dir)}](skills/${s.dir}/SKILL.md)**${s.derived ? "" : " 🆕"} | ${cell(s.summary)} | ${cell(s.when)} |`,
      ),
  ]),
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
