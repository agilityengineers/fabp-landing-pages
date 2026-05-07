import { GeneratorForm } from "@/components/admin/GeneratorForm";
import { ManualCreateForm } from "@/components/admin/ManualCreateForm";

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function NewIndustryPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const isManual = mode === "manual";

  return (
    <div>
      <div className="admin-main" style={{ paddingBottom: 0 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: -1 }}>
          <a
            href="/admin/new"
            style={{
              padding: "7px 16px",
              fontSize: 13,
              fontWeight: 500,
              borderRadius: "6px 6px 0 0",
              border: "1px solid var(--rule)",
              borderBottom: isManual ? "1px solid var(--rule)" : "1px solid var(--paper)",
              background: isManual ? "var(--paper-2)" : "var(--paper)",
              color: isManual ? "var(--ink-500)" : "var(--ink-900)",
              textDecoration: "none",
            }}
          >
            ✨ AI Generate
          </a>
          <a
            href="/admin/new?mode=manual"
            style={{
              padding: "7px 16px",
              fontSize: 13,
              fontWeight: 500,
              borderRadius: "6px 6px 0 0",
              border: "1px solid var(--rule)",
              borderBottom: isManual ? "1px solid var(--paper)" : "1px solid var(--rule)",
              background: isManual ? "var(--paper)" : "var(--paper-2)",
              color: isManual ? "var(--ink-900)" : "var(--ink-500)",
              textDecoration: "none",
            }}
          >
            Manual entry
          </a>
        </div>
      </div>
      {isManual ? <ManualCreateForm /> : <GeneratorForm />}
    </div>
  );
}
