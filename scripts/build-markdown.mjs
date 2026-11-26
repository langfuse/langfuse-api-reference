// Writes public/openapi.yml (a copy of the spec) and public/index.md (the same
// reference as plain Markdown) so agents can read it without JavaScript.
// Run by the Vercel build command before the %APISPEC_DATA_URL% replacement.
import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";

const DEFAULT_SPEC_URL = "https://cloud.langfuse.com/generated/api/openapi.yml";
const specUrl = process.env.APISPEC_DATA_URL || DEFAULT_SPEC_URL;
const outDir = path.resolve(process.argv[2] ?? "public");

const response = await fetch(specUrl);
if (!response.ok) throw new Error(`GET ${specUrl} answered ${response.status}`);
const source = await response.text();
const spec = parse(source, { maxAliasCount: -1 });

const METHODS = ["get", "post", "put", "patch", "delete"];
const schemas = spec.components?.schemas ?? {};

const refName = (ref) => ref?.split("/").at(-1);
const resolve = (node) =>
  node?.$ref ? (schemas[refName(node.$ref)] ?? node) : node;

function typeOf(node) {
  if (!node) return "any";
  if (node.$ref) return refName(node.$ref);
  if (node.enum) return node.enum.map((v) => JSON.stringify(v)).join(" | ");
  if (node.type === "array") return `array of ${typeOf(node.items)}`;
  for (const key of ["oneOf", "anyOf"]) {
    if (node[key]) return node[key].map(typeOf).join(" | ");
  }
  return node.format
    ? `${node.type} (${node.format})`
    : (node.type ?? "object");
}

const oneLine = (text = "") => text.replace(/\s*\n\s*/g, " ").trim();

function propertyLines(schema) {
  const resolved = resolve(schema);
  const props = { ...(resolved?.properties ?? {}) };
  for (const part of resolved?.allOf ?? []) {
    Object.assign(props, resolve(part)?.properties ?? {});
  }
  const required = new Set(resolved?.required ?? []);
  return Object.entries(props).map(
    ([name, prop]) =>
      `  - \`${name}\` (${typeOf(prop)}${required.has(name) ? ", required" : ""})${
        prop.description ? `: ${oneLine(prop.description)}` : ""
      }`,
  );
}

const lines = [];
const servers = spec.servers ?? [];
lines.push(`# ${spec.info.title}`, "");
if (spec.info.version) lines.push(`Version ${spec.info.version}`, "");
lines.push(`OpenAPI spec: ${specUrl} (also at /openapi.yml)`, "");
if (servers.length) {
  lines.push("## Servers", "");
  for (const s of servers)
    lines.push(`- ${s.url}: ${s.description ?? ""}`.trimEnd());
  lines.push("");
}
lines.push(spec.info.description?.trim() ?? "", "");

const byTag = new Map();
for (const [route, item] of Object.entries(spec.paths)) {
  for (const method of METHODS) {
    const op = item[method];
    if (!op) continue;
    const tag = op.tags?.[0] ?? "other";
    if (!byTag.has(tag)) byTag.set(tag, []);
    byTag.get(tag).push({ route, method, op, shared: item.parameters ?? [] });
  }
}

for (const [tag, ops] of byTag) {
  lines.push(`## ${tag}`, "");
  for (const { route, method, op, shared } of ops) {
    lines.push(`### ${method.toUpperCase()} ${route}`, "");
    if (op.deprecated) lines.push("Deprecated.", "");
    if (op.summary) lines.push(op.summary, "");
    if (op.description) {
      // Keep headings inside a description below the operation heading.
      lines.push(op.description.trim().replace(/^#{1,6} /gm, "#### "), "");
    }
    const params = [...shared, ...(op.parameters ?? [])].map(resolve);
    if (params.length) {
      lines.push("Parameters:", "");
      for (const p of params) {
        lines.push(
          `- \`${p.name}\` (${p.in}, ${typeOf(p.schema)}${p.required ? ", required" : ""})${
            p.description ? `: ${oneLine(p.description)}` : ""
          }`,
        );
      }
      lines.push("");
    }
    const body = op.requestBody?.content;
    if (body) {
      const [type, media] = Object.entries(body)[0];
      lines.push(`Request body (${type}): ${typeOf(media.schema)}`, "");
      const props = propertyLines(media.schema);
      if (props.length) lines.push(...props, "");
    }
    lines.push("Responses:", "");
    for (const [status, res] of Object.entries(op.responses ?? {})) {
      const media = Object.values(res.content ?? {})[0];
      lines.push(
        `- ${status}${media?.schema ? ` ${typeOf(media.schema)}` : ""}${
          res.description ? `: ${oneLine(res.description)}` : ""
        }`,
      );
    }
    lines.push("");
  }
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "openapi.yml"), source);
fs.writeFileSync(
  path.join(outDir, "index.md"),
  `${lines.join("\n").trimEnd()}\n`,
);
console.log(
  `Wrote ${outDir}/openapi.yml and ${outDir}/index.md from ${specUrl}`,
);
