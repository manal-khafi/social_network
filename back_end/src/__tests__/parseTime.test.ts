import { describe, it, expect } from "vitest";
import { parseTimeString } from "../util/parseTime";

describe("parseTimeString", () => {
  it("parses seconds/minutes/hours/days into seconds", () => {
    expect(parseTimeString("30s")).toBe(30);
    expect(parseTimeString("15m")).toBe(900);
    expect(parseTimeString("2h")).toBe(7200);
    expect(parseTimeString("1d")).toBe(86400);
  });

  it("throws on an unknown unit", () => {
    expect(() => parseTimeString("10y")).toThrow();
  });
});
