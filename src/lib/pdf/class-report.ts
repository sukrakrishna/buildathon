import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";

export interface ClassReportRow {
  className: string;
  courseTitle: string;
  studentCount: number;
  avgAttendance: number | null;
  avgAssignment: number | null;
  avgExam: number | null;
  atRiskCount: number;
}

export interface ClassReportData {
  title: string;
  generatedAt: string;
  rows: ClassReportRow[];
}

export function generateClassReportPdf(data: ClassReportData): jsPDF {
  const doc = new jsPDF();
  const marginX = 14;
  let y = 18;

  doc.setFontSize(18);
  doc.text(data.title, marginX, y);
  y += 8;
  doc.setFontSize(11);
  doc.setTextColor(110);
  doc.text(`Generated ${new Date(data.generatedAt).toLocaleString()}`, marginX, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [["Class", "Course", "Students", "Avg attendance", "Avg assignment", "Avg exam", "At risk"]],
    body: data.rows.map((r) => [
      r.className,
      r.courseTitle,
      String(r.studentCount),
      r.avgAttendance != null ? `${r.avgAttendance}%` : "—",
      r.avgAssignment != null ? `${r.avgAssignment}%` : "—",
      r.avgExam != null ? `${r.avgExam}%` : "—",
      String(r.atRiskCount),
    ]),
    theme: "grid",
    margin: { left: marginX, right: marginX },
    headStyles: { fillColor: [42, 120, 214] },
    styles: { fontSize: 9 },
  });

  return doc;
}
