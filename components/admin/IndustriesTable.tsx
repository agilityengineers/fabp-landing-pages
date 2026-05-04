import Link from "next/link";
import type { Industry } from "@/config/schema";
import { HOME_SLUG } from "@/lib/config";

interface IndustriesTableProps {
  industries: Industry[];
}

export function IndustriesTable({ industries }: IndustriesTableProps) {
  const published = industries.filter((i) => i.published).length;

  return (
    <div className="admin-main">
      <div className="admin-bar">
        <div>
          <h1 className="admin-h1">Industries</h1>
          <p className="admin-sub">
            {industries.length} industries · {published} published · {industries.length - published} draft
          </p>
        </div>
        <Link href="/admin/new" className="ind-action primary" style={{ padding: "10px 16px", fontSize: 13 }}>
          ✨ New industry
        </Link>
      </div>
      <div className="admin-card">
        <div className="ind-row ind-row-head">
          <span>Industry</span>
          <span>Slug</span>
          <span>Status</span>
          <span>Last edited</span>
          <span />
        </div>
        {industries.map((ind) => (
          <IndustryRow key={ind.slug} ind={ind} />
        ))}
        {industries.length === 0 && (
          <div style={{ padding: "32px 18px", color: "var(--ink-500)", fontSize: 14 }}>
            No industries yet. Create your first one.
          </div>
        )}
      </div>
    </div>
  );
}

function IndustryRow({ ind }: { ind: Industry }) {
  const editedAgo = ind.lastEdited
    ? formatRelative(new Date(ind.lastEdited))
    : "—";

  const isHome = ind.slug === HOME_SLUG;

  return (
    <div className="ind-row">
      <div>
        <div className="ind-name">
          {ind.industry}
          {isHome && (
            <span
              title="This config powers the home page at /"
              style={{
                marginLeft: 8,
                padding: "2px 6px",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                background: "var(--ink-900, #0b1220)",
                color: "white",
                borderRadius: 4,
                verticalAlign: "middle",
              }}
            >
              Home
            </span>
          )}
        </div>
      </div>
      <div className="ind-slug">{isHome ? "/" : `/${ind.slug}`}</div>
      <div>
        <span className={`ind-status ${ind.published ? "published" : "draft"}`}>
          {ind.published ? "Published" : "Draft"}
        </span>
      </div>
      <div style={{ color: "var(--ink-500)", fontSize: 13 }}>{editedAgo}</div>
      <div className="ind-actions">
        <Link href={`/admin/${ind.slug}`} className="ind-action">
          Edit
        </Link>
        <Link href={isHome ? "/" : `/${ind.slug}`} className="ind-action" target="_blank" rel="noopener">
          View
        </Link>
        {!isHome && <PublishToggle slug={ind.slug} published={ind.published} />}
      </div>
    </div>
  );
}

function PublishToggle({ slug, published }: { slug: string; published: boolean }) {
  return (
    <form action={`/api/industries`} method="POST">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="action" value={published ? "unpublish" : "publish"} />
      <button type="submit" className="ind-action">
        {published ? "Unpublish" : "Publish"}
      </button>
    </form>
  );
}

function formatRelative(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days} days ago`;
  return `${weeks} wks ago`;
}
