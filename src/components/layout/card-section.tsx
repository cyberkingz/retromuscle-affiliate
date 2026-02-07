import type { ComponentProps } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

type CardSectionProps = ComponentProps<typeof Card> & {
  padding?: "sm" | "md" | "lg";
  tone?: "default" | "frost";
};

const paddingClass: Record<NonNullable<CardSectionProps["padding"]>, string> = {
  sm: "p-4 sm:p-5",
  md: "p-5 sm:p-7",
  lg: "p-6 sm:p-8"
};

const toneClass: Record<NonNullable<CardSectionProps["tone"]>, string> = {
  default: "bg-white/95",
  frost: "bg-frost/70"
};

export function CardSection({
  className,
  padding = "md",
  tone = "default",
  ...props
}: CardSectionProps) {
  return <Card className={cn(toneClass[tone], paddingClass[padding], className)} {...props} />;
}

