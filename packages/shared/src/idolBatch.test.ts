import { describe, expect, it } from "vitest";
import { csvToFields, jsonToFields, pasteToFields, previewBatch } from "./idolBatch";

const existing = [{ name: "Winter", groupName: "aespa" }];
const statuses = (rows: ReturnType<typeof previewBatch>) => rows.map((r) => `${r.name}:${r.status}`);

describe("Input Data batch (PRD §8)", () => {
  it("reads paste lines with empty or missing columns", () => {
    const rows = previewBatch(pasteToFields("Karina | aespa | 90 | 1 | kr | 2000-04-11\n\nYuna|ITZY\nIU |  | 88"), existing);
    expect(statuses(rows)).toEqual(["Karina:new", "Yuna:warning", "IU:new"]);
    expect(rows[0]!.input).toEqual({ name: "Karina", groupName: "aespa", rating: 90, seed: 1, nationality: "KR", birthday: "2000-04-11" });
    expect(rows[1]!.reasons).toEqual(["Rating kosong, dipakai 75"]);
    expect(rows[1]!.input!.rating).toBe(75);
    expect(rows[2]!.groupName).toBeNull(); // empty group = Soloist
  });

  it("red for exact duplicates (also inside the batch), yellow for same name in another group or a rating outside 0–100", () => {
    const rows = previewBatch(pasteToFields("winter | AESPA | 90\nWinter | Other | 80\nNingning | aespa | 120\nNingning | aespa | 70"), existing);
    expect(statuses(rows)).toEqual(["winter:duplicate", "Winter:warning", "Ningning:warning", "Ningning:duplicate"]);
    expect(rows[2]!.input!.rating).toBe(100);
    expect(rows[0]!.input).toBeUndefined();
  });

  it("red for rows that cannot be saved, with the reason", () => {
    const rows = previewBatch(pasteToFields(" | aespa | 80\nGiselle | aespa | sembilan\nKarina | aespa | 90 | 7\nX | | 80 | | Korea"), existing);
    expect(rows.map((r) => r.status)).toEqual(["invalid", "invalid", "invalid", "invalid"]);
    expect(rows[0]!.reasons).toContain("Nama wajib diisi");
    expect(rows[3]!.reasons).toContain("Kode negara 2 huruf, mis. KR");
  });

  it("reads CSV with a header and quotes, and JSON arrays, into the same rows", () => {
    const csv = csvToFields('name,group,rating\n"Kim, Minji",NewJeans,88\nHanni,NewJeans,');
    expect(statuses(previewBatch(csv, []))).toEqual(["Kim, Minji:new", "Hanni:warning"]);
    const json = jsonToFields('[{"name":"Minji","group":"NewJeans","rating":88,"seed":null}]');
    expect(previewBatch(json, [])[0]!.input).toMatchObject({ name: "Minji", groupName: "NewJeans", rating: 88, seed: null });
    expect(() => jsonToFields('{"name":"x"}')).toThrow("JSON harus berupa daftar");
  });
});
