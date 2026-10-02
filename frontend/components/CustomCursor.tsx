"use client";

import { useEffect, useState } from "react";

export function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [trailingPos, setTrailingPos] = useState({ x: -100, y: -100 });
  const [cursorText, setCursorText] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [isPointer, setIsPointer] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only enable on desktop pointer devices
    if (typeof window === "undefined" || window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactiveEl = target.closest("[data-cursor]");
      const clickableEl = target.closest("button, a, input, [role='button'], .leaflet-marker-icon");

      if (interactiveEl) {
        const text = interactiveEl.getAttribute("data-cursor") || "VIEW";
        setCursorText(text);
        setIsHovered(true);
        setIsPointer(false);
      } else if (clickableEl) {
        setCursorText("");
        setIsHovered(false);
        setIsPointer(true);
      } else {
        setCursorText("");
        setIsHovered(false);
        setIsPointer(false);
      }
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [isVisible]);

  // Smooth trailing position animation
  useEffect(() => {
    if (!isVisible) return;
    let animationFrameId: number;

    const followMouse = () => {
      setTrailingPos((prev) => {
        const dx = position.x - prev.x;
        const dy = position.y - prev.y;
        return {
          x: prev.x + dx * 0.25,
          y: prev.y + dy * 0.25,
        };
      });
      animationFrameId = requestAnimationFrame(followMouse);
    };

    animationFrameId = requestAnimationFrame(followMouse);
    return () => cancelAnimationFrame(animationFrameId);
  }, [position, isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {/* Precision Dot */}
      <div
        className="fixed pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 rounded-full bg-parkx-pink transition-transform duration-75"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: isHovered ? "0px" : isPointer ? "6px" : "4px",
          height: isHovered ? "0px" : isPointer ? "6px" : "4px",
        }}
      />

      {/* Trailing Ring & Contextual Badge */}
      <div
        className={`fixed pointer-events-none z-[9998] -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all duration-200 flex items-center justify-center font-mono text-[9px] font-extrabold uppercase tracking-wider ${
          isHovered
            ? "w-20 h-20 bg-parkx-pink/90 text-white border-white/50 backdrop-blur-sm shadow-[0_0_25px_rgba(255,45,120,0.6)]"
            : isPointer
            ? "w-10 h-10 border-parkx-pink bg-parkx-pink/15 scale-110 shadow-[0_0_15px_rgba(255,45,120,0.3)]"
            : "w-6 h-6 border-slate-500/40 bg-white/5"
        }`}
        style={{
          left: `${trailingPos.x}px`,
          top: `${trailingPos.y}px`,
        }}
      >
        {isHovered && <span>{cursorText}</span>}
      </div>
    </>
  );
}
