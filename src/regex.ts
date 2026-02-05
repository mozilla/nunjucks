// src/regex.ts

// --- template tags ---
export const TAG_RE = /{%\s*([\s\S]*?)\s*%}/g;

export const EXTENDS_RE = /{%\s*extends\s+["']([^"']+)["']\s*%}/;

export const INCLUDE_RE = /{%\s*include\s+["']([^"']+)["']\s*%}/g;

// --- statement inners (after spanInner / inside "{% %}") ---
export const SET_RE = /^set\s+([\s\S]+)$/;

// callable token like: lower("x") or add(1,2)
export const CALLABLE_RE = /^([A-Za-z_$][\w$]*)\s*\(([\s\S]*?)\)\s*$/;

// keyword + rest splitter for statement inner: "if user and x" => ["if", "user and x"]
export const KW_REST_RE = /^([A-Za-z_][A-Za-z0-9_]*)\b([\s\S]*)$/;

// "for i in expr"
export const FOR_IN_RE = /^([A-Za-z_$][\w$]*)\s+in\s+([\s\S]+)$/;

// --- helpers (tiny, testable) ---
export const matchExtends = (src: string) => src.match(EXTENDS_RE)?.[1] ?? null;

export const matchIncludes = (src: string) => {
  const out: string[] = [];
  INCLUDE_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = INCLUDE_RE.exec(src))) out.push(m[1]);
  return out;
};

export const matchSetInner = (inner: string) => inner.trim().match(SET_RE)?.[1] ?? null;

export const splitKwRest = (inner: string) => {
  const m = inner.trim().match(KW_REST_RE);
  return m ? { kw: m[1], rest: (m[2] ?? "").trim() } : { kw: "", rest: "" };
};

export const matchCallable = (token: string) => {
  const m = token.trim().match(CALLABLE_RE);
  if (!m) return null;
  const args = (m[2] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return { name: m[1], args };
};

export const matchForIn = (rest: string) => {
  const m = rest.trim().match(FOR_IN_RE);
  if (!m) return null;
  return { varName: m[1], expr: m[2].trim() };
};
