import { redirect } from "next/navigation";

/**
 * /admin/creators has no standalone index — the creators table lives on the
 * main admin dashboard (/admin). Redirect there to avoid a 404 when the
 * back-button or a stale link points here.
 */
export default function AdminCreatorsIndexPage() {
  redirect("/admin");
}
