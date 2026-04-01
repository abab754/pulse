import { redirect } from "next/navigation";

export default function Home() {
  // For MVP, redirect straight to the demo project dashboard.
  // We'll replace this with a landing page in Step 12.
  redirect("/dashboard");
}
