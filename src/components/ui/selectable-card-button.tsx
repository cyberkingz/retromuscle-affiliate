import * as React from "react";

import { cn } from "@/lib/cn";

interface SelectableCardButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export function SelectableCardButton({
  selected = false,
  className,
  ...props
}: SelectableCardButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-2xl border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60",
        selected
          ? "border-foreground bg-secondary text-secondary-foreground shadow-panel"
          : "border-line bg-white text-foreground hover:border-foreground/40 hover:bg-white/95",
        className
      )}
      {...props}
    />
  );
}
