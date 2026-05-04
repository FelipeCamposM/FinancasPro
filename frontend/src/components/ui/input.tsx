import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onChange, max, min, ...props }, ref) => {
    const isDateType = type === "date" || type === "month";

    const handleChange = isDateType
      ? (e: React.ChangeEvent<HTMLInputElement>) => {
          if (e.target.value) {
            const year = e.target.value.split("-")[0];
            if (year.length > 4) return; // impede anos com mais de 4 dígitos
          }
          onChange?.(e);
        }
      : onChange;

    const defaultMax = isDateType
      ? type === "date"
        ? "9999-12-31"
        : "9999-12"
      : undefined;

    return (
      <input
        type={type}
        className={cn(
          "ui-control flex h-10 w-full px-3 py-2 text-sm ring-offset-transparent file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-white",
          className,
        )}
        ref={ref}
        onChange={handleChange}
        max={max ?? defaultMax}
        min={min}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
