"use client";

import React from "react";

/**
 * Subtle moving background mesh that provides soft organic depth.
 * Lightweight, hardware-accelerated, and strictly respects prefers-reduced-motion.
 */
export default function BackgroundMesh() {
  return (
    <div className="bg-mesh-canvas" aria-hidden="true">
      <div className="mesh-blob-1" />
      <div className="mesh-blob-2" />
      <div className="mesh-blob-3" />
      {/* Delicate organic grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#1c1917 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />
    </div>
  );
}
