import { notFound } from "next/navigation";
import { loadIndustry, loadBase } from "@/lib/config";
import { LivePreview } from "./LivePreview";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export default async function PreviewPage({ params }: Props) {
  const { slug } = await params;

  let cfg;
  let base;
  try {
    cfg = loadIndustry(slug);
    base = loadBase();
  } catch {
    notFound();
  }

  return <LivePreview initialCfg={cfg} base={base} />;
}
