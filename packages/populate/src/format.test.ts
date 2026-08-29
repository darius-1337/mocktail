import { describe, expect, it } from "vitest";
import { toCsv, toSql, UnsafeIdentifierError } from "./format.js";

describe("toSql", () => {
	it("renders a valid INSERT", () => {
		const sql = toSql("users", [{ id: 1, email: "a@example.com" }]);
		expect(sql).toContain("INSERT INTO users (id, email)");
	});

	it("escapes quotes in values", () => {
		expect(toSql("t", [{ name: "O'Brien" }])).toContain("'O''Brien'");
	});

	it.each([
		"users; DROP TABLE users; --",
		"users`",
		"a b",
		"",
		"x".repeat(65),
		"1abc",
	])("rejects unsafe table name %s", (table) => {
		expect(() => toSql(table, [{ a: "x" }])).toThrow(UnsafeIdentifierError);
	});

	it("rejects unsafe column names", () => {
		expect(() => toSql("t", [{ "a); DROP TABLE users; --": "x" }])).toThrow(
			UnsafeIdentifierError,
		);
	});
});

describe("toCsv", () => {
	it("quotes fields containing commas", () => {
		expect(toCsv([{ a: "x,y" }])).toContain('"x,y"');
	});

	it.each(["=1+1", "+1", "-1", "@SUM(1)"])("neutralises formula %s", (evil) => {
		expect(toCsv([{ a: evil }])).toContain(`'${evil}`);
	});
});
