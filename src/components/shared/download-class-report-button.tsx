"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateClassReportPdf, type ClassReportData } from "@/lib/pdf/class-report";

export function DownloadClassReportButton({ data }: { data: ClassReportData }) {
  function handleDownload() {
    const doc = generateClassReportPdf(data);
    doc.save(`${data.title.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  }

  return (
    <Button variant="outline" onClick={handleDownload}>
      <Download /> Download report
    </Button>
  );
}
