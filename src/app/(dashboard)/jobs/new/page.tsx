import type { Metadata } from "next";
import JobWizard from "@/components/jobs/JobWizard";

export const metadata: Metadata = { title: "משרה חדשה" };

export default function NewJobPage() {
  return <JobWizard />;
}
