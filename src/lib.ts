import { GlobalOpts, LexerCurr } from './types';
import { matchCallable } from './regex';

const RESET = "\x1b[0m";
const WARN = "\x1b[33m";
const ERR = "\x1b[31m";
const OKBLUE = "\x1b[94m";

type Log = (...msg: any[]) => void;

const fmt = (msg: unknown[]) => msg.map(String).join(" ");

export const p: {
  log: Log;
  warn: Log;
  debug: Log;
  err: Log;
  exit: Log;
} = {
  log: (...msg) => process.stdout.write(`[INFO] ${fmt(msg)}\n`),
  debug: (...msg) => process.stdout.write(`${OKBLUE}[DEBUG] ${fmt(msg)}${RESET}\n`),
  warn: (...msg) => process.stdout.write(`${WARN}[WARN] ${fmt(msg)}${RESET}\n`),
  err: (...msg) => process.stderr.write(`${ERR}[ERR ] ${fmt(msg)}${RESET}\n`),
  exit: (...msg) => {
    process.stderr.write(`${ERR}[ERR ] ${fmt(msg)}${RESET}\n`);
    process.exit(1);
  },
};

export function is_keyword_func<T extends string>(list: Record<string, string>) {
  const keys = new Set<T>(Object.keys(list) as T[]);
  return (k: unknown): k is T => keys.has(k as T);
}

export const is_quoted = (t: string) =>
  (t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"));

export function unquote(t: string) {
  return is_quoted(t) ? t.slice(1, -1) : t;
}

export const extract_comments = (str: string) => str.replace(/\{#[\s\S]*?#\}/g, "");

export const is_callable = (str: string) => matchCallable(str)

export const is_boolean = (src: unknown) =>
  typeof src === "boolean" || (typeof src === "string" && (src === "true" || src === "false"));

export const is_number = (src: unknown) =>
  src !== null && src !== undefined && !Array.isArray(src) && !isNaN(src as any);

type Parsed =
  | { ok: true; value: any }
  | { ok: false; reason: string };

export const maybe_json = (src: unknown): Parsed => {
	const err: Parsed = { ok: false, reason: "not a json literal" }
	if(!is_string(src)) {
		if(typeof src === 'object') return { ok: true, value: src };
		if(Array.isArray(src)) return { ok: true, value: src };
		return err
	}
	const s = (src as string).trim();
	const first = s[0];
  const isCandidate =
    first === "[" || first === "{" 
		// || first === '"' ||
    // first === "t" || first === "f" || first === "n" ||
    // first === "-" || (first >= "0" && first <= "9");
  if (!isCandidate) return err
	try {
    return { ok: true, value: JSON.parse(s) };
  } catch(err) {
		p.err(err)
    return err
  }
}
export const is_string = (str: unknown) => (str !== null && str !== undefined) ? typeof str === 'string' && !is_number(str) : false

export const is_array = (src: unknown) => {
	if(Array.isArray(src)) return true
	const arr = maybe_json(src as string)
	if(arr.ok) return Array.isArray(arr.value)
	return false
}

export const is_object = (src: unknown) => {
	if(typeof src === 'object') return true
	const arr = maybe_json(src as string)
	if(arr.ok) return arr.ok
	return false
}

export const is_function = (str: unknown) => typeof str === 'function'

export const parse_var = (src: unknown) => {
  if (src === null) return null;
  if (src === undefined) return undefined;

  if (is_boolean(src)) return src === "true" || src === true;
  if (is_number(src)) return Number(src);

  const json = maybe_json(src);
  if (json.ok) return json.value;
	console.log('Now',src)
	if (is_string(src)) {
    const s = (src as string).trim();
    if (s === "null") return null;
    if (s === "undefined") return undefined;
  }
  return src;
};

export const _lower = (...args: any[]) => args.map((i) => (typeof i === "string" ? i.toLowerCase() : i));
export const _upper = (...args: any[]) => args.map((i) => (typeof i === "string" ? i.toUpperCase() : i));

export const randomId = (length: number = 12) => Math.random().toString().substring(2, length+2);

export const spanInner = (src: string, it: LexerCurr) => {
  const raw = src.slice(it.start.i, it.end!.i);
  const inner = raw.replace(it.start.symbol, "").replace(it.end!.symbol, "").trim();
	if(inner.includes('user'))console.log('user:', inner, ' raw:', raw)
  return { raw, inner };
};

export const cleanIdent = (s: string) =>
  s.trim().match(/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*/)?.[0] ?? "";