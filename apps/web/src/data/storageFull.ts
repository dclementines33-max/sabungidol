// A write that failed because the device storage is full (2026-11-16): the browser's QuotaExceededError ("The quota has
// been exceeded."), or PGlite/OPFS failing to grow a file (Postgres "No space left on device", errno ENOSPC). Every
// failed save already reaches notify() with its error text as context; there it becomes one W-STORAGE-003 warning.
export const STORAGE_FULL = "W-STORAGE-003";
export const STORAGE_FULL_MESSAGE = "Penyimpanan penuh — backup lalu hapus season lama atau foto. Data yang sudah tersimpan aman.";

export const isStorageFull = (text: string | undefined) => !!text && /QuotaExceeded|quota\b.{0,30}\bexceeded|no space left|ENOSPC|disk (is )?full/i.test(text);
