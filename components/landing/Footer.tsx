import type { Base } from "@/config/schema";

export function Footer({ base }: { base: Base }) {
  return (
    <footer className="footer">
      <div className="foot-inner">
        <span>© {new Date().getFullYear()} Find a Business Pro</span>
        <a href={base.brand.parentUrl} target="_blank" rel="noopener noreferrer">
          findabusinesspro.com →
        </a>
        <span>invitation.findabusinesspro.com</span>
      </div>
    </footer>
  );
}
