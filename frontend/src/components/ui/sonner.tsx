"use client";

import { useEffect, useState } from "react";
import {
  CircleCheck,
  CircleX,
  Info,
  LoaderCircle,
  TriangleAlert,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Toasts do sistema.
 *
 * A aparência fica em `globals.css` (bloco `[data-sonner-toast]`), que é onde dá
 * para alcançar os elementos internos do Sonner — ícone, título, descrição e
 * botão de fechar — sem envolver cada toast num wrapper próprio.
 *
 * Sem `richColors`: aquele preset traz fundos claros que destoam do tema.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  // Desktop: canto inferior direito. Mobile: rodapé, centralizado.
  const [position, setPosition] =
    useState<ToasterProps["position"]>("bottom-right");

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const aplicar = () =>
      setPosition(mq.matches ? "bottom-right" : "bottom-center");
    aplicar();
    mq.addEventListener("change", aplicar);
    return () => mq.removeEventListener("change", aplicar);
  }, []);

  return (
    <Sonner
      theme="dark"
      position={position}
      closeButton
      gap={10}
      offset={16}
      visibleToasts={4}
      className="ui-toaster"
      icons={{
        success: <CircleCheck className="h-[18px] w-[18px]" aria-hidden="true" />,
        error: <CircleX className="h-[18px] w-[18px]" aria-hidden="true" />,
        warning: <TriangleAlert className="h-[18px] w-[18px]" aria-hidden="true" />,
        info: <Info className="h-[18px] w-[18px]" aria-hidden="true" />,
        loading: (
          <LoaderCircle className="h-[18px] w-[18px] animate-spin" aria-hidden="true" />
        ),
      }}
      {...props}
    />
  );
};

export { Toaster };
