// A competition's logo from Settings → Branding (stored like a photo); nothing while it loads or when none is set.
import { photoUrl, requestPhoto, usePhotoUrls } from "../data/photoCache";

export function CompetitionLogo({ logoId, className = "size-10" }: { logoId?: string | null; className?: string }) {
  usePhotoUrls((s) => s.urls); // re-render when it arrives
  if (!logoId) return null;
  const url = photoUrl(logoId, 64);
  if (!url) queueMicrotask(() => requestPhoto(logoId, 64));
  return url ? <img src={url} alt="" className={`${className} shrink-0 rounded-control object-contain`} /> : null;
}
