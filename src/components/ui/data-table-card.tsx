import type { PropsWithChildren, ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

interface DataTableCardProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function DataTableCard({
  title,
  subtitle,
  action,
  className,
  children
}: DataTableCardProps) {
  return (
    <Card className={cn("overflow-hidden rounded-[20px] border-line bg-white/90", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/55">
            {title}
          </p>
          {subtitle ? (
            <p className="mt-0.5 text-[12px] text-foreground/50">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </Card>
  );
}
