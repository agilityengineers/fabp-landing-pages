import { Reveal } from "./Reveal";
import type { Industry } from "@/config/schema";

export function StatsBand({ cfg }: { cfg: Industry }) {
  const stats = cfg.statsBand;
  if (!stats?.length) return null;
  return (
    <section className="stats-band">
      <div className="container stats-band-inner">
        {stats.map((s, i) => (
          <Reveal key={i} delay={i * 80} className="stats-band-cell">
            <div className="stats-band-v serif">{s.v}</div>
            <div className="stats-band-l">{s.l}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
