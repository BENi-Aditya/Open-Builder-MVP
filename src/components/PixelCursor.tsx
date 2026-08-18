import { useEffect, useRef, useState } from "react";

/**
 * Pixel-art cursor system. Renders a 16x16 yellow arrow that follows the mouse,
 * grows on hover over interactive elements, and emits a small click burst.
 */
export function PixelCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const burstRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    setEnabled(!isTouch);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const cursor = cursorRef.current;
    const burst = burstRef.current;
    if (!cursor || !burst) return;

    let raf = 0;
    let x = -100, y = -100;
    let tx = -100, ty = -100;

    const move = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      const t = e.target as HTMLElement;
      const isInteractive = !!t.closest("a, button, [role='button'], input, textarea, select, .brutal-card");
      cursor.dataset.hover = isInteractive ? "1" : "0";
    };
    const click = (e: MouseEvent) => {
      burst.style.left = `${e.clientX}px`;
      burst.style.top = `${e.clientY}px`;
      burst.classList.remove("animate");
      void burst.offsetWidth;
      burst.classList.add("animate");
    };
    const tick = () => {
      x += (tx - x) * 0.35;
      y += (ty - y) * 0.35;
      cursor.style.transform = `translate(${x}px, ${y}px)`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mousedown", click);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mousedown", click);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <style>{`
        .pix-cursor { position: fixed; left: 0; top: 0; width: 20px; height: 20px; pointer-events: none; z-index: 9999; will-change: transform; image-rendering: pixelated; mix-blend-mode: normal; }
        .pix-cursor svg { transition: transform 80ms ease; }
        .pix-cursor[data-hover="1"] svg { transform: scale(1.4) rotate(-6deg); }
        .pix-burst { position: fixed; left: 0; top: 0; width: 24px; height: 24px; pointer-events: none; z-index: 9998; transform: translate(-12px, -12px); }
        .pix-burst.animate { animation: pix-burst .35s steps(4) forwards; }
        @keyframes pix-burst {
          0% { transform: translate(-12px, -12px) scale(0.4); opacity: 1; }
          100% { transform: translate(-12px, -12px) scale(2.2); opacity: 0; }
        }
        @media (max-width: 768px) { .pix-cursor, .pix-burst { display: none; } body, a, button { cursor: auto !important; } }
      `}</style>
      <div ref={cursorRef} className="pix-cursor" aria-hidden>
        <svg width="20" height="20" viewBox="0 0 16 16" shapeRendering="crispEdges">
          <path d="M2 1h2v1h1v1h1v1h1v1h1v1h1v1h1v1H8v1h1v3H8v-1H7v-1H6v-1H5v1H4v1H3v1H2V1z" fill="#0a0a0a" />
          <path d="M3 2h1v1h1v1h1v1h1v1h1v1h1v1H7v1h1v2H7v-1H6v-1H5v-1H4v1H3V2z" fill="#FFD600" />
        </svg>
      </div>
      <div ref={burstRef} className="pix-burst" aria-hidden>
        <svg width="24" height="24" viewBox="0 0 8 8" shapeRendering="crispEdges">
          <rect x="3" y="0" width="2" height="1" fill="#FFD600" />
          <rect x="3" y="7" width="2" height="1" fill="#FFD600" />
          <rect x="0" y="3" width="1" height="2" fill="#FFD600" />
          <rect x="7" y="3" width="1" height="2" fill="#FFD600" />
          <rect x="1" y="1" width="1" height="1" fill="#e85d3a" />
          <rect x="6" y="1" width="1" height="1" fill="#e85d3a" />
          <rect x="1" y="6" width="1" height="1" fill="#e85d3a" />
          <rect x="6" y="6" width="1" height="1" fill="#e85d3a" />
        </svg>
      </div>
    </>
  );
}
