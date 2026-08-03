"use client";

import dynamic from "next/dynamic";
import { SilkBackground } from "@/components/SilkBackground";
import { usePreferencias } from "@/lib/preferencias";

// Fundos animados entram por import dinâmico: three/ogl/gsap só são baixados
// quando o fundo escolhido precisa deles.
const Silk = dynamic(() => import("@/components/react-bits/Silk"), {
  ssr: false,
  loading: () => null,
});
const DotGrid = dynamic(() => import("@/components/DotGrid"), {
  ssr: false,
  loading: () => null,
});
const Ferrofluid = dynamic(() => import("@/components/Ferrofluid"), {
  ssr: false,
  loading: () => null,
});

/**
 * O efeito em si, sem posicionamento — todos preenchem 100% do pai.
 * Usado tanto no fundo da aplicação quanto nos previews das configurações.
 *
 * `preview` reescala os parâmetros pensados para tela cheia: num card de ~112px
 * de altura, um espaçamento de 46px entre pontos renderiza dois pontos soltos e
 * um blob em escala 1.6 sai do enquadramento. As proporções mudam, o efeito não.
 */
export function BackgroundEfeito({
  id,
  preview = false,
}: {
  id: string;
  preview?: boolean;
}) {
  switch (id) {
    case "silk":
      return (
        <Silk
          color="#2B1B4D"
          speed={3}
          scale={preview ? 0.6 : 1.2}
          noiseIntensity={1.2}
          rotation={0}
        />
      );
    case "dotgrid":
      return (
        <DotGrid
          // O componente traz p-4 fixo, que come metade do card no preview
          className={preview ? "!p-0" : ""}
          dotSize={preview ? 2 : 4}
          gap={preview ? 12 : 46}
          baseColor="#06B6D4"
          activeColor="#6366F1"
          proximity={preview ? 50 : 150}
          speedTrigger={100}
          shockRadius={preview ? 80 : 250}
          shockStrength={5}
          maxSpeed={5000}
          resistance={750}
          returnDuration={1.5}
        />
      );
    case "ferrofluid":
      return (
        <Ferrofluid
          colors={["#3B82F6", "#3B82F6", "#6366F1"]}
          speed={0.2}
          scale={preview ? 0.9 : 1.6}
          turbulence={0.25}
          fluidity={0.1}
          rimWidth={0.2}
          sharpness={2.5}
          shimmer={1.5}
          glow={2}
          flowDirection="down"
          opacity={preview ? 0.95 : 0.5}
          dpr={preview ? 1 : undefined}
          mouseInteraction={!preview}
          mouseStrength={1}
          mouseRadius={0.35}
        />
      );
    default:
      return <SilkBackground />;
  }
}

/**
 * Fundo global da aplicação, definido em Configurações → Aparência.
 * `usePreferencias` re-renderiza quando a escolha muda, então a troca aparece
 * na hora, sem recarregar a página.
 */
export function AppBackground() {
  const { background } = usePreferencias();

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <BackgroundEfeito id={background || "padrao"} />
    </div>
  );
}
