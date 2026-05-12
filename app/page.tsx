import { permanentRedirect } from "next/navigation";

// 308 permanent redirect so search engines treat the canonical landing page
// as /business-services-professionals and consolidate ranking signals there.
export default function Home() {
  permanentRedirect("/business-services-professionals");
}
