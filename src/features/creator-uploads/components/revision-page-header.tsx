"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

interface RevisionPageHeaderProps {
  videoTypeLabel: string;
  step: 1 | 2 | 3;
}

const STEPS = [
  { n: 1, label: "Nouvel upload" },
  { n: 2, label: "Vérification" },
  { n: 3, label: "Envoyé" }
] as const;

export function RevisionPageHeader({ videoTypeLabel, step }: RevisionPageHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-xs text-foreground/55">
        <Link href="/uploads" className="hover:text-foreground transition-colors">
          Uploads
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="text-foreground/80">{videoTypeLabel}</span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="text-foreground">Correction</span>
      </nav>

      {/* Title */}
      <div>
        <h1 className="font-display text-3xl uppercase leading-none tracking-tight text-foreground">
          Corriger &amp; re-uploader
        </h1>
        <p className="mt-1 text-sm text-foreground/60">
          Lis les instructions de l&apos;admin, puis dépose ta version corrigée.
        </p>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-0">
        {STEPS.map(({ n, label }, idx) => {
          const isActive = n === step;
          const isDone = n < step;
          return (
            <div key={n} className="flex items-center">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    isDone
                      ? "bg-mint/20 text-mint"
                      : isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-foreground/10 text-foreground/40"
                  )}
                  aria-current={isActive ? "step" : undefined}
                >
                  {isDone ? "✓" : n}
                </span>
                <span
                  className={cn(
                    "hidden text-xs font-medium sm:inline",
                    isActive ? "text-foreground" : "text-foreground/45"
                  )}
                >
                  {label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-px w-8 sm:w-12",
                    isDone ? "bg-mint/40" : "bg-foreground/15"
                  )}
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
