/**
 * Generate highlights.scm and brackets.scm for the zed-wolfram extension
 * by extracting symbol data from the vscode-wolfram TextMate grammar.
 *
 * Usage: npx tsx tools/generate-highlights.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// Paths
const TM_GRAMMAR_PATH = join(
  ROOT,
  "node_modules/vscode-wolfram/syntaxes/wolfram.tmLanguage.json"
);
const LANG_CONFIG_PATH = join(
  ROOT,
  "node_modules/vscode-wolfram/wolfram.language-configuration.json"
);
const HIGHLIGHTS_OUT = join(ROOT, "languages/wolfram/highlights.scm");
const BRACKETS_OUT = join(ROOT, "languages/wolfram/brackets.scm");

// TextMate scope -> tree-sitter capture mapping
const SCOPE_MAP: Record<string, string | null> = {
  "support.function.builtin.wolfram": "function.builtin",
  "constant.language.wolfram": "constant.builtin",
  "support.function.experimental.wolfram": "function.builtin",
  "support.function.undocumented.wolfram": "function",
  "invalid.deprecated.wolfram": "attribute",
  "invalid.bad.wolfram": null, // skip
  "invalid.illegal.wolfram": null, // skip
  "invalid.illegal.system.wolfram": null, // skip
  "invalid.session.wolfram": "variable.special",
  "variable.function.wolfram": null, // handled by call head pattern
  "symbol.unrecognized.wolfram": null, // catch-all, skip
};

interface TmPattern {
  match?: string;
  name?: string;
  begin?: string;
  end?: string;
  patterns?: TmPattern[];
}

interface TmGrammar {
  repository: Record<string, { patterns: TmPattern[] }>;
}

/**
 * Split a string by `|` at the top level (not inside parentheses).
 */
function splitTopLevel(s: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "(") depth++;
    else if (s[i] === ")") depth--;
    else if (s[i] === "|" && depth === 0) {
      parts.push(s.substring(start, i));
      start = i + 1;
    }
  }
  parts.push(s.substring(start));
  return parts;
}

/**
 * Recursively expand a trie-compressed regex alternation into full symbol names.
 *
 * E.g. "A(?:bs|dd|rg)" -> ["Abs", "Add", "Arg"]
 *      "X(?:ML(?:Element|Object)|YZColor|nor|or)" -> ["XMLElement", "XMLObject", "XYZColor", "Xnor", "Xor"]
 */
function expandTrie(s: string): string[] {
  const results: string[] = [];
  doExpand(s, results);
  return results;
}

function doExpand(s: string, results: string[]): void {
  // Find the first top-level '(' — everything before it is a literal prefix
  let depth = 0;
  let parenStart = -1;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "(") {
      if (depth === 0) parenStart = i;
      depth++;
    } else if (s[i] === ")") {
      depth--;
    } else if (s[i] === "|" && depth === 0) {
      // Top-level alternation without parens: split here
      const alts = splitTopLevel(s);
      for (const alt of alts) {
        doExpand(alt, results);
      }
      return;
    }
  }

  if (parenStart === -1) {
    // No parens — this is a literal name
    if (s.length > 0) results.push(s);
    return;
  }

  const prefix = s.substring(0, parenStart);

  // Find matching close paren
  depth = 0;
  let parenEnd = -1;
  for (let i = parenStart; i < s.length; i++) {
    if (s[i] === "(") depth++;
    else if (s[i] === ")") {
      depth--;
      if (depth === 0) {
        parenEnd = i;
        break;
      }
    }
  }

  if (parenEnd === -1) {
    // Unmatched paren — just return prefix
    if (prefix.length > 0) results.push(prefix);
    return;
  }

  let inner = s.substring(parenStart + 1, parenEnd);
  const suffix = s.substring(parenEnd + 1);

  // Strip leading ?: (non-capturing group marker)
  if (inner.startsWith("?:")) {
    inner = inner.substring(2);
  }

  // Split inner by top-level |
  const alternatives = splitTopLevel(inner);
  for (const alt of alternatives) {
    doExpand(prefix + alt + suffix, results);
  }
}

/**
 * Extract symbol names from a TextMate grammar regex pattern.
 * Patterns look like: System`(?:A(?:bs|dd)|B(?:ar))(?![`$[:alnum:]])
 * or without System` prefix.
 */
function extractSymbolNames(matchPattern: string): string[] {
  // Remove System` or System\` prefix
  let pattern = matchPattern.replace(/^System[`\\`]/, "");

  // Remove negative lookahead suffix: (?![`$[:alnum:]])
  pattern = pattern.replace(/\(\?!\[.*\]\)$/, "");

  // Remove outer non-capturing group if the whole thing is wrapped
  if (pattern.startsWith("(?:") && pattern.endsWith(")")) {
    const inner = pattern.substring(3, pattern.length - 1);
    // Verify this was actually the outer group (balanced parens)
    let depth = 0;
    let balanced = true;
    for (let i = 0; i < inner.length; i++) {
      if (inner[i] === "(") depth++;
      else if (inner[i] === ")") {
        depth--;
        if (depth < 0) {
          balanced = false;
          break;
        }
      }
    }
    if (balanced && depth === 0) {
      pattern = inner;
    }
  }

  const names = expandTrie(pattern);

  // Filter: only keep valid Wolfram symbol names (start with letter or $, then alnum/$)
  return names.filter((n) => /^[$A-Za-z][$A-Za-z0-9]*$/.test(n));
}

/**
 * Generate a #match? predicate for a list of symbol names.
 * Splits into multiple blocks if the regex would be too long.
 */
function generateMatchBlocks(
  capture: string,
  names: string[],
  nodeType: string = "symbol",
  maxRegexLen: number = 4000
): string {
  const sorted = [...new Set(names)].sort();
  const lines: string[] = [];

  let batch: string[] = [];
  let currentLen = 0;

  for (const name of sorted) {
    // +1 for the | separator
    if (currentLen + name.length + 1 > maxRegexLen && batch.length > 0) {
      lines.push(formatMatchBlock(capture, batch, nodeType));
      batch = [];
      currentLen = 0;
    }
    batch.push(name);
    currentLen += name.length + 1;
  }

  if (batch.length > 0) {
    lines.push(formatMatchBlock(capture, batch, nodeType));
  }

  return lines.join("\n\n");
}

function formatMatchBlock(
  capture: string,
  names: string[],
  nodeType: string
): string {
  const regex = `^(${names.join("|")})$`;
  return `((${nodeType}) @${capture}\n  (#match? @${capture} "${regex}"))`;
}

function main() {
  // Read TextMate grammar
  const grammar: TmGrammar = JSON.parse(readFileSync(TM_GRAMMAR_PATH, "utf-8"));

  // Extract symbols grouped by scope
  const symbolsByScope = new Map<string, string[]>();
  const symbolPatterns = grammar.repository.symbols?.patterns ?? [];

  for (const pattern of symbolPatterns) {
    if (!pattern.match || !pattern.name) continue;
    const scope = pattern.name;
    const names = extractSymbolNames(pattern.match);
    if (names.length === 0) continue;

    if (!symbolsByScope.has(scope)) {
      symbolsByScope.set(scope, []);
    }
    symbolsByScope.get(scope)!.push(...names);
  }

  // Log extraction stats
  console.log("Extracted symbols by scope:");
  for (const [scope, names] of symbolsByScope) {
    const unique = new Set(names).size;
    console.log(`  ${scope}: ${unique} unique symbols`);
  }

  // Build highlights.scm
  const sections: string[] = [];

  sections.push(`; Auto-generated by tools/generate-highlights.ts
; Source: vscode-wolfram (https://github.com/WolframResearch/vscode-wolfram)
; Do not edit manually — run: npm run generate`);

  // Comments
  sections.push(`; Comments
(comment) @comment`);

  // Strings
  sections.push(`; Strings
(string) @string`);

  // Numbers
  sections.push(`; Numbers
(integer) @number
(real) @number`);

  // All symbols — generic fallback (must come BEFORE specific matches)
  sections.push(`; Symbols (generic fallback — must come before specific matches)
(symbol) @variable`);

  // Function calls
  sections.push(`; Function calls
(call head: (symbol) @function)`);

  // System variables starting with $
  sections.push(`; System variables starting with $
((symbol) @constant.builtin
  (#match? @constant.builtin "^\\\\$"))`);

  // Generated symbol categories
  for (const [scope, capture] of Object.entries(SCOPE_MAP)) {
    if (!capture) continue;
    const names = symbolsByScope.get(scope);
    if (!names || names.length === 0) continue;

    const scopeLabel = scope.replace(".wolfram", "");
    sections.push(
      `; ${scopeLabel} (from vscode-wolfram)\n${generateMatchBlocks(capture, names)}`
    );
  }

  // Assignment operators
  sections.push(`; Assignment operators
"=" @keyword.operator
":=" @keyword.operator
"^=" @keyword.operator
"^:=" @keyword.operator
"+=" @keyword.operator
"-=" @keyword.operator
"*=" @keyword.operator
"/=" @keyword.operator
"//=" @keyword.operator`);

  // Rule operators
  sections.push(`; Rule operators
"->" @operator
":>" @operator
"<->" @operator
"|->" @operator`);

  // Comparison operators
  sections.push(`; Comparison operators
"==" @operator
"!=" @operator
"===" @operator
"=!=" @operator
"<" @operator
"<=" @operator
">" @operator
">=" @operator`);

  // Logical operators
  sections.push(`; Logical operators
"&&" @operator
"||" @operator
"!" @operator`);

  // Arithmetic operators
  sections.push(`; Arithmetic operators
"+" @operator
"-" @operator
"*" @operator
"/" @operator
"^" @operator
"." @operator
"**" @operator`);

  // Application operators
  sections.push(`; Application operators
"@" @operator
"@@" @operator
"@@@" @operator
"/@" @operator
"//@" @operator
"//" @operator
"~~" @operator`);

  // Other operators
  sections.push(`; Other operators
"&" @operator
"/;" @operator
"/." @operator
"//." @operator
".." @operator
"..." @operator
"'" @operator
"!!" @operator
"++" @operator
"--" @operator
"<>" @operator
"/*" @operator
"@*" @operator
"?" @operator`);

  // Delimiters
  sections.push(`; Delimiters
"(" @punctuation.bracket
")" @punctuation.bracket
"[" @punctuation.bracket
"]" @punctuation.bracket
"{" @punctuation.bracket
"}" @punctuation.bracket
"<|" @punctuation.bracket
"|>" @punctuation.bracket`);

  // Separators
  sections.push(`; Separators
"," @punctuation.delimiter
";" @punctuation.delimiter`);

  const highlights = sections.join("\n\n") + "\n";
  writeFileSync(HIGHLIGHTS_OUT, highlights);
  console.log(`\nWrote ${HIGHLIGHTS_OUT}`);

  // Generate brackets.scm
  const brackets = `; Auto-generated by tools/generate-highlights.ts
("(" @open ")" @close)
("["  @open "]"  @close)
("{"  @open "}"  @close)
("<|" @open "|>" @close)
`;
  writeFileSync(BRACKETS_OUT, brackets);
  console.log(`Wrote ${BRACKETS_OUT}`);
}

main();
