#!/usr/bin/env node
// Lints every skill in every plugin and checks that README.md's skill tables are current.
//   node scripts/lint.mjs          check, exit 1 on any problem
//   node scripts/lint.mjs --write  regenerate the README tables, then check
import { readFileSync, readdirSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PORTABLE = new Set(["name", "description", "license", "compatibility", "metadata"]);
const TRIGGER = /^(Apply|Use) when\b/;
const DERIVED = "pstack@0.14.4";

// One entry per plugin in .claude-plugin/marketplace.json. `marker` names the
// README block the plugin's tables are generated into.
const PLUGINS = [
  {
    name: "agent-principles",
    skills: "skills",
    marker: "skills",
    categories: {
      design: ["🧱", "Design and structure", "Shape the code before you write it."],
      simplicity: ["✂️", "Simplicity", "Less code, fewer layers, smaller diffs."],
      verification: ["✅", "Verification", "Know it works, and leave proof a reviewer can rerun."],
      reliability: ["🛡️", "Reliability and security", "Behave correctly under retries, races, and hostile callers."],
      agents: ["🤖", "Working as an agent", "Spend context and the human's attention carefully."],
    },
  },
  {
    name: "lstack-skills",
    skills: "plugins/lstack-skills/skills",
    marker: "lstack-skills",
    categories: {
      code: ["🛠️", "Writing code", "Tests that can fail, types that mean something, no comments as crutches."],
      writing: ["✍️", "Writing prose", "Text a tired engineer reads once and understands."],
    },
  },
];

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

function lintPlugin(plugin) {
  const skillsDir = join(root, plugin.skills);
  const manifest = join(skillsDir, "..", ".claude-plugin", "plugin.json");
  if (!existsSync(manifest)) fail(plugin.name, `no plugin manifest at ${relative(root, manifest)}`);
  else if (JSON.parse(readFileSync(manifest, "utf8")).name !== plugin.name) fail(plugin.name, "manifest name mismatch");

  return readdirSync(skillsDir)
    .filter((d) => statSync(join(skillsDir, d)).isDirectory())
    .sort()
    .map((dir) => {
      const file = join(skillsDir, dir, "SKILL.md");
      const where = relative(root, file);
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
      const meta = fm.metadata ?? {};
      if (meta["derived-from"] !== undefined && meta["derived-from"] !== DERIVED)
        fail(where, `derived-from must be ${DERIVED}`);

      // A relative link must resolve AND stay inside its own plugin, because
      // each plugin is installed on its own.
      for (const [, target] of text.matchAll(/\]\(([^)#\s]+)(#[^)]*)?\)/g)) {
        if (/^[a-z]+:/.test(target)) continue;
        const resolved = resolve(dirname(file), target);
        if (!existsSync(resolved)) fail(where, `broken link ${target}`);
        else if (relative(skillsDir, resolved).startsWith("..")) fail(where, `link leaves the plugin: ${target}`);
      }

      if (!plugin.categories[meta.category])
        fail(where, `metadata.category must be one of ${Object.keys(plugin.categories).join(", ")}`);
      for (const key of ["summary", "when"]) {
        if (!meta[key]) fail(where, `metadata.${key} is required (it is the README's plain-English line)`);
        else if (meta[key].length > 100) fail(where, `metadata.${key} is over 100 characters; keep it skimmable`);
      }
      return { dir, derived: Boolean(meta["derived-from"]), ...meta };
    })
    .filter(Boolean);
}

// GitHub's heading slug: drop pictographs but keep the U+FE0F that follows some of them.
const anchor = (heading) =>
  encodeURIComponent(heading.toLowerCase().replace(/\p{Extended_Pictographic}/gu, "").replace(/ /g, "-"));
const title = (dir) =>
  dir.replace(/^principle-/, "").replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
const cell = (text) => text.replace(/\|/g, "\\|");

function render(plugin, skills) {
  const original = skills.filter((s) => !s.derived).length;
  const badges = [
    `<img alt="skills" src="https://img.shields.io/badge/skills-${skills.length}-6f42c1">`,
    `<img alt="derived from pstack" src="https://img.shields.io/badge/derived%20from-pstack%200.14.4-555">`,
    ...(original ? [`<img alt="original" src="https://img.shields.io/badge/original-${original}-2ea44f">`] : []),
  ];
  const groups = Object.entries(plugin.categories);
  return [
    `<!-- ${plugin.marker}:begin -->`,
    "<p>",
    ...badges.map((b) => `  ${b}`),
    "</p>",
    "",
    "| | Group | What it's about |",
    "|---|---|---|",
    ...groups.map(([, [icon, name, blurb]]) => `| ${icon} | [${name}](#${anchor(`${icon} ${name}`)}) | ${blurb} |`),
    ...groups.flatMap(([key, [icon, name, blurb]]) => [
      "",
      `### ${icon} ${name}`,
      "",
      `> ${blurb}`,
      "",
      "| Skill | The idea | Reach for it when… |",
      "|---|---|---|",
      ...skills
        .filter((s) => s.category === key)
        .map(
          (s) =>
            `| **[${title(s.dir)}](${plugin.skills}/${s.dir}/SKILL.md)**${s.derived ? "" : " 🆕"} | ${cell(s.summary)} | ${cell(s.when)} |`,
        ),
    ]),
    `<!-- ${plugin.marker}:end -->`,
  ].join("\n");
}

const market = JSON.parse(readFileSync(join(root, ".claude-plugin", "marketplace.json"), "utf8"));
const listed = market.plugins.map((p) => p.name).sort().join(", ");
const known = PLUGINS.map((p) => p.name).sort().join(", ");
if (listed !== known) fail("marketplace.json", `lists [${listed}] but the lint knows [${known}]`);

const readmePath = join(root, "README.md");
let readme = readFileSync(readmePath, "utf8");
let count = 0;
for (const plugin of PLUGINS) {
  const skills = lintPlugin(plugin);
  count += skills.length;
  const begin = `<!-- ${plugin.marker}:begin -->`;
  const end = `<!-- ${plugin.marker}:end -->`;
  const start = readme.indexOf(begin);
  const stop = readme.indexOf(end);
  if (start < 0 || stop < 0) fail("README.md", `missing ${begin} / ${end} markers`);
  else readme = readme.slice(0, start) + render(plugin, skills) + readme.slice(stop + end.length);
}

if (process.argv.includes("--write")) writeFileSync(readmePath, readme);
else if (readme !== readFileSync(readmePath, "utf8"))
  fail("README.md", "skill tables are stale; run node scripts/lint.mjs --write");

if (problems.length) {
  console.error(problems.join("\n"));
  console.error(`\n${problems.length} problem(s)`);
  process.exit(1);
}
console.log(`ok: ${count} skills in ${PLUGINS.length} plugins`);
