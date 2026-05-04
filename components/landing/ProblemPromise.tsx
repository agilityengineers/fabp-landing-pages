import { Reveal } from "./Reveal";
import type { Industry } from "@/config/schema";

export function ProblemPromise({ cfg }: { cfg: Industry }) {
  return (
    <section className="problem-promise">
      <div className="container pp-grid">
        <div>
          <Reveal>
            <span className="eyebrow pp-eyebrow">
              <span className="dot" />
              The villain
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="pp-headline serif">
              You didn&rsquo;t earn the credentials to become <em>a marketer</em>.
            </h2>
          </Reveal>
          <div className="villains">
            {cfg.problem.villains.map((v, i) => (
              <Reveal key={i} delay={i * 60} className="villain-row">
                <div className="villain-num">{String(i + 1).padStart(2, "0")}</div>
                <div>
                  <strong>{v.t}</strong>
                  <p>{v.b}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <Reveal delay={120} className="promise">
          <div className="promise-eyebrow">The promise</div>
          <div className="promise-text serif">{cfg.promise.headline}</div>
          <div className="promise-meta">
            {cfg.promise.stats.map((s, i) => (
              <div key={i} className="promise-stat">
                <div className="promise-stat-v serif">{s.v}</div>
                <div className="promise-stat-l">{s.l}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
