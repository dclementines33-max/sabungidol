import { describe, expect, it } from "vitest";
import { DB_IN_OTHER_TAB } from "./dbLock";
import { OTHER_TAB_MESSAGE, databaseErrorNotice } from "./startNotifications";

describe("database errors the user sees (PRD §14.1–14.2)", () => {
  it("a second tab gets a plain explanation of what to do", () => {
    expect(databaseErrorNotice(new Error(`${DB_IN_OTHER_TAB}: sabung-idol is open in another tab`)))
      .toEqual({ level: "error", code: DB_IN_OTHER_TAB, message: OTHER_TAB_MESSAGE });
  });

  it("any other failure says nothing saved was touched, with the detail for the report", () => {
    const notice = databaseErrorNotice(new Error("Failed query: CREATE SCHEMA"));
    expect(notice).toMatchObject({ level: "error", code: "E-DB-001", context: "Failed query: CREATE SCHEMA" });
    expect(notice.message).toContain("is untouched");
  });
});
