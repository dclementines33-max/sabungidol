// One TanStack Query client for the app (PRD §11). Data lives in the local database, so it never
// goes stale on its own: screens refresh it explicitly after they change something.
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Number.POSITIVE_INFINITY, retry: false } } });
