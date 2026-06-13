import { redirect } from "next/navigation";

/** Legacy route — kundresan startar på /. */
export default function MaskinerPage() {
  redirect("/");
}
