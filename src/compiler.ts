import { unquote, spanInner } from "./lib";
import type { GlobalOpts } from "./types";
import { renderString, readByChar } from "./render";
import { matchExtends, matchIncludes } from "./regex";

type Replacement = { start: number; end: number; value: string };

const applyReplacements = (src: string, reps: Replacement[]) => {
  reps.sort((a, b) => b.start - a.start);
  let out = src;
  for (const r of reps) out = out.slice(0, r.start) + r.value + out.slice(r.end);
  return out;
};

type BlockBody = { bodyStart: number; bodyEnd: number };

const extractBlocks = (src: string, spans: any[], opts: GlobalOpts): Map<string, BlockBody> => {
  const blocks = new Map<string, BlockBody>();
  const stack: { name: string; bodyStart: number }[] = [];

  for (const it of spans) {
    if (!it.start || !it.end) continue;
    if (it.start.type !== opts.lexer.symbols.statement.start_type) continue;

    const { inner } = spanInner(src, it);
    const tokens = inner.split(/\s+/).filter(Boolean);
    const kw = tokens[0];

    if (kw === "block") {
      const name = tokens[1];
      if (!name) continue;
      stack.push({ name, bodyStart: it.end.i });
      continue;
    }

    if (kw === "endblock") {
      const open = stack.pop();
      if (!open) continue;
      blocks.set(open.name, { bodyStart: open.bodyStart, bodyEnd: it.start.i });
      continue;
    }
  }

  return blocks;
};

const mergeExtends = (baseSrc: string, childSrc: string, opts: GlobalOpts) => {
  opts.lexer = opts.lex(baseSrc, baseSrc.length);
  const baseSpans = readByChar(baseSrc, opts);
  const baseBlocks = extractBlocks(baseSrc, baseSpans, opts);

  opts.lexer = opts.lex(childSrc, childSrc.length);
  const childSpans = readByChar(childSrc, opts);
  const childBlocks = extractBlocks(childSrc, childSpans, opts);

  const edits: Replacement[] = [];

  for (const [name, baseB] of baseBlocks.entries()) {
    const childB = childBlocks.get(name);
    if (!childB) continue;

    const baseBody = baseSrc.slice(baseB.bodyStart, baseB.bodyEnd);
    let childBody = childSrc.slice(childB.bodyStart, childB.bodyEnd);

    childBody = childBody.replace(/\{\{\s*super\(\)\s*\}\}/g, baseBody);

    edits.push({ start: baseB.bodyStart, end: baseB.bodyEnd, value: childBody });
  }

  return applyReplacements(baseSrc, edits);
};

// Prepass: execute ONLY statement handlers (extends/set)
const prepassStatements = (src: string, opts: GlobalOpts) => {
  opts.lexer = opts.lex(src, src.length);
  const spans = readByChar(src, opts);

  for (const it of spans) {
    if (!it.start || !it.end) continue;
    if (it.start.type !== opts.lexer.symbols.statement.start_type) continue;

    const { inner } = spanInner(src, it);
    const kw = inner.split(/\s+/)[0];
    if (!kw) continue;

    const handler = opts.fns[kw];
    if (!handler) continue;

    handler(inner, [], opts);
  }
};

export const compileTemplate = (entryName: string, ctx: any, opts: GlobalOpts) => {
  const res = opts.loader.read(entryName);
  if (res.err) throw new Error(res.err);
  const childSrc = res.res;

  opts.ctx = ctx ?? {};

  // 1) prepass (loads base into opts.files + handles set)
  prepassStatements(childSrc, opts);

  // 2) merge extends
  const baseRel = matchExtends(childSrc);
  if (baseRel) {
    const baseName = unquote(baseRel);
    const baseSrc = opts.files[baseName] ?? opts.loader.read(baseName).res;
    const merged = mergeExtends(baseSrc, childSrc, opts);

    opts.lexer = opts.lex(merged, merged.length);
    return renderString(merged, opts);
  }

  // 3) no extends
  opts.lexer = opts.lex(childSrc, childSrc.length);
  return renderString(childSrc, opts);
};
