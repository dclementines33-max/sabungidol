// Where components get idol data (PRD §9: components take an idolId, never an idol object with a photo).
// The app provides it from the database; Storybook from sample idols.
import type { Form, Result } from "@sabung/engine";
import { type ReactNode, createContext, useContext } from "react";

export type PhotoSize = 64 | 256 | 1024;

export type IdolInfo = {
  id: string;
  name: string;
  groupName: string | null; // null = Soloist
  groupColor?: string; // a token name, e.g. "brand-rose"; shown behind the photo placeholder
  rating: number;
  form?: Form["name"];
  recent?: Result[]; // last results, oldest first
  titles?: number;
};

export type IdolSource = {
  idol: (id: string) => IdolInfo | undefined;
  photo: (id: string, size: PhotoSize) => string | undefined; // a cached object URL
};

const Context = createContext<IdolSource | null>(null);

export function IdolSourceProvider({ source, children }: { source: IdolSource; children: ReactNode }) {
  return <Context.Provider value={source}>{children}</Context.Provider>;
}

function useSource(): IdolSource {
  const source = useContext(Context);
  if (!source) throw new Error("Idol components need an <IdolSourceProvider> above them");
  return source;
}

export function useIdol(id: string): IdolInfo {
  const idol = useSource().idol(id);
  if (!idol) throw new Error(`Unknown idol ${id}`);
  return idol;
}

// For components that look through many idols at once (search, paste resolve).
export function useIdolLookup(): IdolSource["idol"] {
  return useSource().idol;
}

export function useIdolPhoto(id: string, size: PhotoSize): string | undefined {
  return useSource().photo(id, size);
}
