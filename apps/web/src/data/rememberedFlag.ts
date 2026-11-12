// A yes/no the shell remembers per browser (e.g. the collapsed rail). Only a convenience:
// if storage is blocked or empty it falls back to false. Read after mount so the prerendered
// HTML and the first client render agree.
import { useEffect, useState } from "react";

export function useRememberedFlag(key: string): [boolean, (value: boolean) => void] {
  const [value, setValue] = useState(false);
  useEffect(() => {
    try {
      setValue(localStorage.getItem(key) === "1");
    } catch {
      // storage blocked: keep the default
    }
  }, [key]);
  const set = (next: boolean) => {
    setValue(next);
    try {
      localStorage.setItem(key, next ? "1" : "0");
    } catch {
      // storage blocked: works for this visit only
    }
  };
  return [value, set];
}
