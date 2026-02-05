import { describe, test, expect, vi } from 'vitest';
import * as lib from '../src/lib';

describe('lib', () => {
	describe('is_function/is_arry/is_string/is_object/is_number/is_boolean', () => {
		test('is_function()', () => {
			expect(lib.is_function(() => {})).toBe(true);
			expect(lib.is_function(function () {})).toBe(true);
			expect(lib.is_function(async () => {})).toBe(true);

			expect(lib.is_function("() => {}")).toBe(false);
			expect(lib.is_function("function () {}")).toBe(false);
			expect(lib.is_function(12)).toBe(false);
			expect(lib.is_function(null)).toBe(false);
			expect(lib.is_function({})).toBe(false);
			expect(lib.is_function('fn')).toBe(false);
		});

		test('is_array()', () => {
			expect(lib.is_array([])).toBe(true);
			expect(lib.is_array([1, 2])).toBe(true);
			expect(lib.is_array(new Array(3))).toBe(true);
			expect(lib.is_array('[]')).toBe(true);
			expect(lib.is_array('[1,2,3]')).toBe(true);

			expect(lib.is_array({ length: 1 })).toBe(false);
			expect(lib.is_array(null)).toBe(false);
			expect(lib.is_array(() => {})).toBe(false);
			expect(lib.is_array(new Set())).toBe(false);
		});

		test('is_string()', () => {
			expect(lib.is_string('hello')).toBe(true);
			expect(lib.is_string(String('x'))).toBe(true);
			expect(lib.is_string("string123432")).toBe(true);
			// 
			expect(lib.is_string("[]")).toBe(true);
			expect(lib.is_string("{}")).toBe(true);
			// 
			expect(lib.is_string("123.432")).toBe(false);
			expect(lib.is_string(new String('x'))).toBe(false);
			expect(lib.is_string(123)).toBe(false);
			expect(lib.is_string(null)).toBe(false);
		});

		test('is_object() only matches plain objects', () => {
			expect(lib.is_object({})).toBe(true);
			expect(lib.is_object({ a: 1 })).toBe(true);
			expect(lib.is_object('{}')).toBe(true);
			expect(lib.is_object('[]')).toBe(true);
			expect(lib.is_object([])).toBe(true);
			expect(lib.is_object(new Date())).toBe(true);
			expect(lib.is_object(null)).toBe(true);

			expect(lib.is_object(() => {})).toBe(false);
		});
		test('is_number() only matches number', () => {
			expect(lib.is_number({})).toBe(false);
			expect(lib.is_number({ a: 1 })).toBe(false);
			// expect(lib.is_number([])).toBe(false);
			expect(lib.is_number(() => {})).toBe(false);
			expect(lib.is_number(new Date())).toBe(true);
			expect(lib.is_number(null)).toBe(false);
			expect(lib.is_number("1")).toBe(true);
			expect(lib.is_number(2)).toBe(true);
			expect(lib.is_number(2.5)).toBe(true);
		});
		test('is_boolean() only matches true or false', () => {
			expect(lib.is_boolean(true)).toBe(true);
			expect(lib.is_boolean(false)).toBe(true);
			expect(lib.is_boolean("true")).toBe(true);
			expect(lib.is_boolean("false")).toBe(true);

			expect(lib.is_boolean({})).toBe(false);
			expect(lib.is_boolean({ a: 1 })).toBe(false);
			expect(lib.is_boolean(() => {})).toBe(false);
			expect(lib.is_boolean(new Date())).toBe(false);
			expect(lib.is_boolean(null)).toBe(false);
		});

		test('maybe_json() only matches true for obj or array', () => {
			const err = {
				"ok": false,
				"reason": "not a json literal",
			}
			expect(lib.maybe_json(true)).toEqual(err);
			expect(lib.maybe_json(false)).toEqual(err);
			expect(lib.maybe_json("true")).toEqual(err);
			expect(lib.maybe_json("false")).toEqual(err);
			expect(lib.maybe_json("12342")).toEqual(err);
			expect(lib.maybe_json(12342)).toEqual(err);
			expect(lib.maybe_json(123.42)).toEqual(err);
			expect(lib.maybe_json(() => {})).toEqual(err);
			const success = (value: any) => ({
				"ok": true,
				value,
			})
			expect(lib.maybe_json({})).toEqual(success({}));
			expect(lib.maybe_json({ a: 1 })).toEqual(success({ a: 1 }));
			const _date = new Date()
			expect(lib.maybe_json(_date)).toEqual(success(_date));
			expect(lib.maybe_json(null)).toEqual(success(null));
		});
		// test('format_res_string() only matches true for obj or array', () => {
		// 	expect(lib.format_res_string(true)).toBe("true");
		// 	expect(lib.format_res_string(false)).toBe("false");
		// 	expect(lib.format_res_string("true")).toBe("true");
		// 	expect(lib.format_res_string("false")).toBe("false");
		// 	expect(lib.format_res_string("12342")).toBe("12342");
		// 	expect(lib.format_res_string(12342)).toBe("12342");
		// 	expect(lib.format_res_string(123.42)).toBe("123.42");

		// 	expect(lib.format_res_string({})).toBe("[object Object]");
		// 	expect(lib.format_res_string({ a: 1 })).toBe("[object Object]");
		// 	expect(lib.format_res_string(() => {})).toBe("[Unserializable object]");
		// 	const _date = new Date()
		// 	expect(lib.format_res_string(_date)).toBe(`${_date}`);
		// 	expect(lib.format_res_string(null)).toBe("");
		// });
		test('parse_var() return any matches', () => {
			//bool
			expect(lib.parse_var("true")).toBe(true);
			expect(lib.parse_var(true)).toBe(true);
			expect(lib.parse_var("false")).toBe(false);
			expect(lib.parse_var(false)).toBe(false);
			//number
			expect(lib.parse_var("12342")).toBe(12342);
			expect(lib.parse_var(12342)).toBe(12342);
			expect(lib.parse_var(123.42)).toBe(123.42);
			// OBJECT OR JSON
			expect(lib.parse_var("[1,2]")).toEqual([1,2]);
			expect(lib.parse_var([1,2])).toEqual([1,2]);
			expect(lib.parse_var("{ \"a\": 1 }")).toEqual({ a: 1 });
			expect(lib.parse_var({ a: 1 })).toEqual({ a: 1 });

			// STRING
			expect(lib.parse_var("hello")).toEqual("hello");
			expect(lib.parse_var("\"hello\"")).toEqual("\"hello\"");
			const _date = new Date()
			expect(lib.parse_var(_date)).toBeTypeOf('number')
		});

	});
	describe('extract_comments', () => {
		test('extract_comments()', () => {
			expect(lib.extract_comments("{# hello #} world")).toBe(" world");
			expect(lib.extract_comments("{# hello world")).toBe("{# hello world");
			expect(lib.extract_comments("{# hello world #}")).toBe("");
			expect(lib.extract_comments("{# {# hello world #}")).toBe("");
			expect(lib.extract_comments("{# {# hello world #} #}")).toBe(" #}");
		});
	});
});
