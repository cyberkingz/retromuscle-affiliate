import type { PropsWithChildren, ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

interface DataTableCardProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function DataTableCard({ title, subtitle, action, className, children }: DataTableCardProps) {
  return (
    <Card className={cn("overflow-hidden border-line bg-white/95", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pb-3 pt-5">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.15em] text-foreground/55">{title}</p>
          {subtitle ? <p className="text-sm text-foreground/70">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </Card>
  );
}
