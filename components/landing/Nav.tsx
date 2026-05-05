"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import type { Industry, Base } from "@/config/schema";

interface NavProps {
  cfg: Industry;
  base: Base;
}

export function Nav({ cfg, base }: NavProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToApply() {
    document.getElementById("apply")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <header className={`nav${scrolled ? " scrolled" : ""}`}>
      <div className="nav-inner">
        <a className="brand" href="#top" aria-label="Find a Business Pro">
          <Image
            src="/logo.png"
            alt="Find a Business Pro"
            width={204}
            height={102}
            className="brand-logo"
            sizes="(max-width: 700px) 152px, 204px"
            priority
          />
        </a>
        <div className="nav-right">
          <a
            className="back-to-main"
            href={base.brand.parentUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit the directory <span className="arr">→</span>
          </a>
          <button className="btn btn-primary nav-cta" onClick={scrollToApply}>
            {cfg.hero.primaryCta}
            <span className="arr">→</span>
          </button>
        </div>
      </div>
    </header>
  );
}
