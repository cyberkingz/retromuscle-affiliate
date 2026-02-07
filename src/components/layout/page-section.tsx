import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

interface PageSectionProps extends HTMLAttributes<HTMLElement> {
  as?: "section" | "div";
}

export function PageSection({ as = "section", className, ...props }: PageSectionProps) {
  const Component = as;
  return <Component className={cn("space-y-4 sm:space-y-5", className)} {...props} />;
}

