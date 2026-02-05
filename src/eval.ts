import { arithmetic, arithmetic_map } from "./arithmetic";
import { logical, logical_map } from "./logical";
import { combiner, StepWithArgs, PipelineStep } from "./pipe";
import { p, is_keyword_func, unquote, is_callable, _lower, _upper, parse_var, cleanIdent } from "./lib";
import type { GlobalOpts } from "./types";

// const is_ident = (s: string) => /^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*$/.test(s);

// const get_path = (obj: any, path: string) => {
//   const parts = path.split(".");
//   let cur = obj;
//   for (const p of parts) {
//     if (cur == null) return undefined;
//     cur = cur[p];
//   }
//   return cur;
// };

// const get_var = (str: string, _opts: GlobalOpts) => {
// 	const key = str.trim();
//   if (key in _opts.vars) return { value: _opts.vars[key] };
//   if (key in _opts.ctx) return { value: _opts.ctx[key] };
// 	if (str.includes(".")) {
//     const get = (o: any, p: string) => p.split(".").reduce((a, k) => (a == null ? undefined : a[k]), o);
//     const v = get(_opts.vars, str);
//     if (v !== undefined) return { value: v };
//     const c = get(_opts.ctx, str);
//     if (c !== undefined) return { value: c };
//   }
// 	return key
// }

// const resolve_ident = (name: string, _opts: GlobalOpts) => {
//   if (!is_ident(name)) return undefined;

//   // vars wins (loop vars etc)
//   const v = get_path(_opts.vars, name);
//   if (v !== undefined) return v;

//   const c = get_path(_opts.ctx, name);
//   if (c !== undefined) return c;

//   return undefined;
// };

export const extension = {
  extends: "extends",
} as const;

type extensions_type = keyof typeof extension;
export const is_extension_keyword = is_keyword_func<extensions_type>(extension);

const _extend = (_opts: GlobalOpts) => (inner: string) => {
  // inner: `extends "base.njk"` (no actions needed)
  const m = inner.match(/^extends\s+(.+)$/);
  const fileTok = m ? m[1].trim() : "";
  const key = unquote(fileTok);

  if (!key) return "";
  if (_opts.files[key]) return "";

  const { err, res } = _opts.loader.read(key);
  _opts.files[key] = err ? err : res;
  return "";
};

const _set = (_opts: GlobalOpts) => (inner: string) => {
  // minimal: {% set a=1,b=2 %}
  const m = inner.match(/^set\s+(.+)$/);
  const rest = m ? m[1] : "";
  const parts = rest.split(",").map((s) => s.trim()).filter(Boolean);

  for (const part of parts) {
    const [kRaw, vRaw] = part.split("=").map((s) => s?.trim());
    if (!kRaw || vRaw == null) continue;
    _opts.vars[kRaw] = parse_var(vRaw);
  }
  return "";
};

export const filters = { lower: "lower", upper: "upper" } as const;
type filter_type = keyof typeof filters;
export const is_filter_keyword = is_keyword_func<filter_type>(filters);

const filter_map = { lower: _lower, upper: _upper };

export const keywords = {
  ...arithmetic,
  ...logical,
  ...extension,
  set: "set",
  ...filters,
} as const;

type keyword_type = keyof typeof keywords;
export const is_keyword = is_keyword_func<keyword_type>(keywords);

export const fns = (_opts: GlobalOpts) => ({
  ...arithmetic_map,
  ...logical_map,
  ...filter_map,
  extends: _extend(_opts),
  set: _set(_opts),
});

const get_fn = (name: string, _opts: GlobalOpts) => _opts.fns?.[name];

export const _eval_fn = (src: string, _opts: GlobalOpts): { step?: StepWithArgs; value?: any } => {
  const callable = is_callable(src);
  if (callable) {
    const fn = get_fn(callable.name, _opts);
    if (!fn) return { value: parse_var(src) };
    return { step: [fn, ...callable.args] };
  }

  const parts = src.split(/\s+/).filter(Boolean);
  const fn = parts[0] ? get_fn(parts[0], _opts) : undefined;

  if (fn) {
    const rest = src.slice(parts[0].length).trim();
    return { step: [fn, rest] };
  }
 
	const lit = parse_var(src);
	
  if (typeof lit === "string") {
		const key = lit.trim()
		if (key in _opts.vars) return { value: _opts.vars[key] };
		if (key in _opts.ctx) return { value: _opts.ctx[key] };

		// dot paths: user.isAdmin
		if (key.includes(".")) {
			const get = (o: any, p: string) => p.split(".").reduce((a, k) => (a == null ? undefined : a[k]), o);
			const v = get(_opts.vars, key);
			if (v !== undefined) return { value: v };
			const c = get(_opts.ctx, key);
			if (c !== undefined) return { value: c };
		}
    // const resolved = resolve_ident(lit.trim(), _opts);
    // if (resolved !== undefined) return { value: resolved };
  }
  return { value: lit };
};

export const _eval = (expr: string, _opts: GlobalOpts) => {
  const actions = expr.trim().split("|").map((i) => i.trim()).filter(Boolean);

  let init: any = "";
  const steps: PipelineStep[] = [];

  for (let i = 0; i < actions.length; i++) {
    const { step, value } = _eval_fn(actions[i], _opts);
    if (i === 0 && value !== undefined) init = value;
    else if (i > 0 && value !== undefined) p.warn("literal after pipe ignored", value);
    else if (step) steps.push(step);
  }

  return combiner(steps)(init).value;
};
