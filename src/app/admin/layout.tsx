import type { PropsWithChildren } from "react";

import { AdminShell } from "@/components/layout/admin-shell";

export default function AdminLayout({ children }: PropsWithChildren) {
  return <AdminShell>{children}</AdminShell>;
}

