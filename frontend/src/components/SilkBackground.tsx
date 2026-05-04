"use client";

import dynamic from "next/dynamic";

const Silk = dynamic(() => import("@/components/react-bits/Silk"), {
  ssr: false,
});

export function SilkBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="h-full w-full opacity-90">
        <Silk
          color="#00cbff"
          noiseIntensity={1.35}
          rotation={0.15}
          scale={0.95}
          speed={3.2}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-slate-950/55 to-black/70" />
    </div>
  );
}
