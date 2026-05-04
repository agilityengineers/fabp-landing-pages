import { notFound } from "next/navigation";
import { loadIndustry } from "@/lib/config";
import { EditForm } from "@/components/admin/EditForm";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ generated?: string }>;
}

export const dynamic = "force-dynamic";

export default async function EditIndustryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { generated } = await searchParams;

  let industry;
  try {
    industry = loadIndustry(slug);
  } catch {
    notFound();
  }

  return <EditForm industry={industry} isGenerated={generated === "1"} />;
}
