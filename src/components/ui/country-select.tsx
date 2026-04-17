"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

// ---------------------------------------------------------------------------
// Country data
// ---------------------------------------------------------------------------
type CountryOption = { value: string; label: string };
type CountryGroup = { label: string; options: CountryOption[] };

const COUNTRY_GROUPS: CountryGroup[] = [
  {
    label: "Europe francophone",
    options: [
      { value: "FR", label: "France" },
      { value: "BE", label: "Belgique" },
      { value: "CH", label: "Suisse" },
      { value: "LU", label: "Luxembourg" },
      { value: "MC", label: "Monaco" }
    ]
  },
  {
    label: "Maghreb",
    options: [
      { value: "MA", label: "Maroc" },
      { value: "DZ", label: "Algérie" },
      { value: "TN", label: "Tunisie" }
    ]
  },
  {
    label: "Amérique",
    options: [
      { value: "CA", label: "Canada" },
      { value: "US", label: "États-Unis" }
    ]
  },
  {
    label: "Europe",
    options: [
      { value: "DE", label: "Allemagne" },
      { value: "ES", label: "Espagne" },
      { value: "IT", label: "Italie" },
      { value: "PT", label: "Portugal" },
      { value: "NL", label: "Pays-Bas" },
      { value: "GB", label: "Royaume-Uni" }
    ]
  },
  {
    label: "Autre",
    options: [{ value: "OTHER", label: "Autre pays" }]
  }
];

// Flat map for quick label lookup
const ALL_OPTIONS: CountryOption[] = COUNTRY_GROUPS.flatMap((g) => g.options);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface CountrySelectProps {
  value: string;
  onChange(value: string): void;
  onBlur?(): void;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
}

export function CountrySelect({
  value,
  onChange,
  onBlur,
  disabled,
  invalid,
  describedBy
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel =
    ALL_OPTIONS.find((o) => o.value === value)?.label ?? null;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () =>
      document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        onClick={() => {
          if (!disabled) setOpen((v) => !v);
        }}
        onBlur={() => {
          // Only fire onBlur when focus truly leaves the container
          requestAnimationFrame(() => {
            if (
              !containerRef.current?.contains(document.activeElement)
            ) {
              onBlur?.();
            }
          });
        }}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-xl border bg-white px-3 text-sm",
          "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          invalid ? "border-destructive" : "border-line",
          !selectedLabel && "text-foreground/45"
        )}
      >
        <span className="truncate">
          {selectedLabel ?? "Sélectionner un pays"}
        </span>
        <ChevronDown
          className={cn(
            "ml-2 h-4 w-4 shrink-0 text-foreground/50 transition-transform duration-150",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          aria-label="Sélectionner un pays"
          className="absolute left-0 right-0 z-50 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-line bg-white shadow-lg"
        >
          {COUNTRY_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="sticky top-0 bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-foreground/40 backdrop-blur-sm">
                {group.label}
              </p>
              {group.options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={value === opt.value}
                  onPointerDown={(e) => {
                    // Prevent blur on trigger before click fires
                    e.preventDefault();
                  }}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    onBlur?.();
                  }}
                  className={cn(
                    "w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-frost/60",
                    value === opt.value
                      ? "bg-primary/8 font-semibold text-primary"
                      : "text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
