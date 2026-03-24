import { useEffect, useRef } from "react";

export function CursorBall() {
  const ballRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMouseMove);

    let animId: number;
    const animate = () => {
      const dx = target.current.x - pos.current.x;
      const dy = target.current.y - pos.current.y;
      // Smooth easing — ball rolls toward cursor
      pos.current.x += dx * 0.08;
      pos.current.y += dy * 0.08;

      if (ballRef.current) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Rotate based on distance for rolling effect
        const rotation = (pos.current.x + pos.current.y) * 2;
        ballRef.current.style.transform = `translate(${pos.current.x - 16}px, ${pos.current.y - 16}px) rotate(${rotation}deg) scale(${1 + Math.min(dist * 0.001, 0.15)})`;
      }
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      ref={ballRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 32,
        height: 32,
        pointerEvents: "none",
        zIndex: 9999,
        willChange: "transform",
      }}
    >
      {/* Golf ball SVG */}
      <svg viewBox="0 0 32 32" width="32" height="32">
        <circle cx="16" cy="16" r="15" fill="#f5f5f0" stroke="#ccc" strokeWidth="1" />
        <circle cx="12" cy="11" r="1.5" fill="#ddd" />
        <circle cx="17" cy="10" r="1.5" fill="#ddd" />
        <circle cx="20" cy="14" r="1.5" fill="#ddd" />
        <circle cx="14" cy="16" r="1.5" fill="#ddd" />
        <circle cx="19" cy="19" r="1.5" fill="#ddd" />
        <circle cx="11" cy="20" r="1.5" fill="#ddd" />
        <circle cx="16" cy="22" r="1.5" fill="#ddd" />
        <circle cx="22" cy="11" r="1.5" fill="#ddd" />
      </svg>
    </div>
  );
}
