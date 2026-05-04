"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CurrencyInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type"
> {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}

/**
 * Input monetário com entrada da direita para a esquerda (estilo ATM/calculadora).
 * - Digitar "5" → "0,05" → "0,50" → "5,00"
 * - Backspace remove o último dígito
 * - inputMode="numeric" abre teclado numérico em mobile
 */
const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, className, ...props }, ref) => {
    const [centavos, setCentavos] = React.useState<number>(() =>
      value !== undefined && value > 0 ? Math.round(value * 100) : 0,
    );

    // Sincroniza quando o valor externo muda (ex: form.reset, modo edição)
    React.useEffect(() => {
      const propCentavos =
        value !== undefined && value > 0 ? Math.round(value * 100) : 0;
      setCentavos(propCentavos);
    }, [value]);

    const display = React.useMemo(
      () =>
        (centavos / 100).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      [centavos],
    );

    function update(newCentavos: number) {
      if (newCentavos > 99_999_999) return; // máximo R$ 999.999,99
      setCentavos(newCentavos);
      onChange(newCentavos > 0 ? newCentavos / 100 : undefined);
    }

    // Mantém o cursor sempre no final
    function moveCursorToEnd(el: HTMLInputElement) {
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      // Permite Tab, Enter, Ctrl/Cmd+C etc.
      if (e.ctrlKey || e.metaKey || e.key === "Tab" || e.key === "Enter") {
        return;
      }

      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        update(centavos * 10 + parseInt(e.key, 10));
      } else if (e.key === "Backspace") {
        e.preventDefault();
        update(Math.floor(centavos / 10));
      } else if (e.key === "Delete") {
        e.preventDefault();
        update(0);
      } else {
        e.preventDefault(); // bloqueia letras, símbolos, vírgula etc.
      }
    }

    // Fallback para teclados virtuais móveis que podem não disparar keydown
    function handleBeforeInput(e: React.FormEvent<HTMLInputElement>) {
      const nativeEvent = e.nativeEvent as InputEvent;
      const data = nativeEvent.data;
      e.preventDefault();
      if (data !== null && data !== undefined && /^\d$/.test(data)) {
        update(centavos * 10 + parseInt(data, 10));
      } else if (data === null || data === "") {
        // deleção em Android
        update(Math.floor(centavos / 10));
      }
    }

    // Fallback final: parse dos dígitos brutos caso beforeinput seja ignorado
    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const digits = e.target.value.replace(/\D/g, "");
      if (digits === "") {
        update(0);
        return;
      }
      const parsed = Math.min(parseInt(digits, 10), 99_999_999);
      if (parsed !== centavos) {
        update(parsed);
      }
    }

    function handleClick(e: React.MouseEvent<HTMLInputElement>) {
      moveCursorToEnd(e.currentTarget);
    }

    function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
      moveCursorToEnd(e.currentTarget);
      props.onFocus?.(e);
    }

    function handleKeyUp(e: React.KeyboardEvent<HTMLInputElement>) {
      moveCursorToEnd(e.currentTarget);
    }

    function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
      e.preventDefault();
      const text = e.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, 8);
      if (text) update(Math.min(parseInt(text, 10), 99_999_999));
    }

    return (
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={display}
        onKeyDown={handleKeyDown}
        onBeforeInput={handleBeforeInput}
        onChange={handleChange}
        onClick={handleClick}
        onFocus={handleFocus}
        onKeyUp={handleKeyUp}
        onPaste={handlePaste}
        className={cn(
          "flex h-10 w-full rounded-md border border-white/15 bg-white/[0.08] px-3 py-2 text-sm text-white ring-offset-transparent placeholder:text-white/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:border-white/30 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);
CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
