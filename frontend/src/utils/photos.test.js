import { describe, it, expect } from "vitest";
import { parsePhotos } from "./photos";

describe("parsePhotos", () => {
  it("parses a JSON array of photo URLs", () => {
    expect(parsePhotos('["a.jpg","b.jpg"]')).toEqual(["a.jpg", "b.jpg"]);
  });

  it("returns an empty array for an empty JSON array", () => {
    expect(parsePhotos("[]")).toEqual([]);
  });

  it.each([
    ["null (the column is NULL)", null],
    ["undefined (the column is missing)", undefined],
    ["an empty string", ""],
    ["malformed JSON", "{not json"],
  ])("returns an empty array for %s", (_label, input) => {
    expect(parsePhotos(input)).toEqual([]);
  });

  it.each([
    ["a JSON object", '{"url":"a.jpg"}'],
    ["a JSON string", '"a.jpg"'],
    ["a JSON number", "42"],
  ])("returns an empty array for %s rather than a non-list value", (_label, input) => {
    expect(parsePhotos(input)).toEqual([]);
  });
});
