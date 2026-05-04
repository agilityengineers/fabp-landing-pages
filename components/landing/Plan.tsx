import { Reveal } from "./Reveal";
import type { Industry } from "@/config/schema";

export function Plan({ cfg }: { cfg: Industry }) {
  return (
    <section className="plan" id="plan">
      <div className="container">
        <div className="plan-head">
          <div>
            <span className="eyebrow">
              <span className="dot" />
              The plan
            </span>
            <h2 className="serif">
              Three steps.{" "}
              <em style={{ color: "var(--accent-deep)", fontStyle: "italic" }}>No mayhem.</em>
            </h2>
          </div>
          <p className="lead">
            From the framework behind <em>Marketing Mayhem</em> — the same Brand Voice Interview
            process that takes a generalist practice and sharpens it into a clear ICP the market
            can find.
          </p>
        </div>
        <div className="plan-track">
          {cfg.plan.map((s, i) => (
            <Reveal key={i} delay={i * 100} className="plan-step">
              <div className="plan-step-head">
                <div className="plan-num serif">{String(i + 1).padStart(2, "0")}</div>
                <div className="plan-bar" />
                <div className="plan-time">{s.time}</div>
              </div>
              <h3 className="plan-title">{s.title}</h3>
              <p className="plan-body">{s.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
