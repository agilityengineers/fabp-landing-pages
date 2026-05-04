import { Reveal } from "./Reveal";
import type { Industry } from "@/config/schema";

export function Testimonials({ cfg }: { cfg: Industry }) {
  const quotes = cfg.testimonials ?? [];
  if (!quotes.length) return null;

  return (
    <section className="testimonials">
      <div className="container">
        <Reveal>
          <span className="eyebrow">
            <span className="dot" />
            From listed pros
          </span>
        </Reveal>
        <div className="testimonial-grid">
          {quotes.map((q, i) => (
            <Reveal key={i} delay={i * 80} className="testimonial">
              <div className="testimonial-quote serif">&ldquo;{q.quote}&rdquo;</div>
              <div>
                <div className="testimonial-name">{q.name}</div>
                <div className="testimonial-role">
                  {q.role}
                  {q.company ? ` · ${q.company}` : ""}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
