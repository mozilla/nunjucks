import { describe, it, expect } from "vitest";
import {
  TAG_RE,
  EXTENDS_RE,
  INCLUDE_RE,
  SET_RE,
  CALLABLE_RE,
  KW_REST_RE,
  FOR_IN_RE,
  matchExtends,
  matchIncludes,
  matchSetInner,
  splitKwRest,
  matchCallable,
  matchForIn,
} from "../src/regex";

describe("regex.ts", () => {
  it("TAG_RE: matches tag inner content", () => {
    const s = `a {% if user %} b`;
    const m = [...s.matchAll(TAG_RE)].map(x => x[1]);
    expect(m).toEqual(["if user"]);
  });

  it("EXTENDS_RE: matches extends path", () => {
    const s = `{% extends "base.njk" %}`;
    expect(s.match(EXTENDS_RE)?.[1]).toBe("base.njk");
    expect(matchExtends(s)).toBe("base.njk");
  });

  it("INCLUDE_RE: matches include paths (global)", () => {
    const s = `{% include "a.njk" %} x {% include 'b.njk' %}`;
    const ms = [...s.matchAll(INCLUDE_RE)].map(x => x[1]);
    expect(ms).toEqual(["a.njk", "b.njk"]);
    expect(matchIncludes(s)).toEqual(["a.njk", "b.njk"]);
  });

  it("SET_RE: matches set payload", () => {
    const inner = `set user = null, a=1`;
    expect(inner.match(SET_RE)?.[1]).toBe("user = null, a=1");
    expect(matchSetInner(inner)).toBe("user = null, a=1");
  });

  it("CALLABLE_RE: matches callable token", () => {
    const t = `lower("x")`;
    const m = t.match(CALLABLE_RE);
    expect(m?.[1]).toBe("lower");
    expect(m?.[2]).toBe(`"x"`);
    expect(matchCallable(t)).toEqual({ name: "lower", args: [`"x"`] });
  });

  it("KW_REST_RE: splits keyword/rest", () => {
    const inner = `if user and user.isAdmin`;
    const m = inner.match(KW_REST_RE);
    expect(m?.[1]).toBe("if");
    expect((m?.[2] ?? "").trim()).toBe("user and user.isAdmin");
    expect(splitKwRest(inner)).toEqual({ kw: "if", rest: "user and user.isAdmin" });
  });

  it("FOR_IN_RE: parses 'i in [1,2,3]'", () => {
    const rest = `i in [1,2,3]`;
    const m = rest.match(FOR_IN_RE);
    expect(m?.[1]).toBe("i");
    expect(m?.[2]).toBe("[1,2,3]");
    expect(matchForIn(rest)).toEqual({ varName: "i", expr: "[1,2,3]" });
  });
});
