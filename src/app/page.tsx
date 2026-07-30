import { redirect } from "next/navigation";

// Root route — redirect authenticated users to dashboard, others to login
export default function Home() {
  redirect("/login");
}
