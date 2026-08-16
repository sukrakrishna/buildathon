"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateStudentReportPdf, type StudentReportData } from "@/lib/pdf/student-report";

export function DownloadStudentReportButton({ data }: { data: StudentReportData }) {
  function handleDownload() {
    const doc = generateStudentReportPdf(data);
    doc.save(`${data.studentName.replace(/\s+/g, "-").toLowerCase()}-report.pdf`);
  }

  return (
    <Button variant="outline" onClick={handleDownload}>
      <Download /> Download report
    </Button>
  );
}
