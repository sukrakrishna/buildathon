import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";

export interface StudentReportData {
  studentName: string;
  generatedAt: string;
  attendanceRate: number | null;
  attendancePresent: number;
  attendanceTotal: number;
  overallAssignmentAvgPercent: number | null;
  overallExamAvgPercent: number | null;
  subjects: { subject: string; attendanceRate: number | null; assignmentAvgPercent: number | null; examAvgPercent: number | null }[];
  insight?: { riskLevel: string; summary: string; weakSubjects: string[]; recommendations: string[] } | null;
}

function finalY(doc: jsPDF): number {
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

export function generateStudentReportPdf(data: StudentReportData): jsPDF {
  const doc = new jsPDF();
  const marginX = 14;
  const pageWidth = doc.internal.pageSize.getWidth() - marginX * 2;
  let y = 18;

  doc.setFontSize(18);
  doc.text("Academic Performance Report", marginX, y);
  y += 8;
  doc.setFontSize(11);
  doc.setTextColor(110);
  doc.text(`${data.studentName} · Generated ${new Date(data.generatedAt).toLocaleString()}`, marginX, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [["Attendance", "Assignment avg", "Exam avg"]],
    body: [
      [
        data.attendanceRate != null ? `${data.attendanceRate}% (${data.attendancePresent}/${data.attendanceTotal})` : "N/A",
        data.overallAssignmentAvgPercent != null ? `${data.overallAssignmentAvgPercent}%` : "N/A",
        data.overallExamAvgPercent != null ? `${data.overallExamAvgPercent}%` : "N/A",
      ],
    ],
    theme: "grid",
    margin: { left: marginX, right: marginX },
    headStyles: { fillColor: [42, 120, 214] },
  });
  y = finalY(doc) + 10;

  doc.setTextColor(0);
  doc.setFontSize(13);
  doc.text("Performance by subject", marginX, y);
  y += 3;
  autoTable(doc, {
    startY: y + 3,
    head: [["Subject", "Attendance", "Assignments", "Exams"]],
    body: data.subjects.map((s) => [
      s.subject,
      s.attendanceRate != null ? `${s.attendanceRate}%` : "—",
      s.assignmentAvgPercent != null ? `${s.assignmentAvgPercent}%` : "—",
      s.examAvgPercent != null ? `${s.examAvgPercent}%` : "—",
    ]),
    theme: "striped",
    margin: { left: marginX, right: marginX },
    headStyles: { fillColor: [42, 120, 214] },
  });
  y = finalY(doc) + 12;

  if (data.insight) {
    if (y > 245) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(13);
    doc.setTextColor(0);
    doc.text("AI Insight", marginX, y);
    y += 7;

    doc.setFontSize(10);
    doc.setTextColor(120, 60, 200);
    doc.text(`Risk level: ${data.insight.riskLevel.toUpperCase()}`, marginX, y);
    y += 6;

    doc.setTextColor(60);
    const summaryLines = doc.splitTextToSize(data.insight.summary, pageWidth);
    doc.text(summaryLines, marginX, y);
    y += summaryLines.length * 5 + 5;

    if (data.insight.weakSubjects.length > 0) {
      doc.setTextColor(0);
      doc.setFontSize(11);
      doc.text("Weak subjects", marginX, y);
      y += 5;
      doc.setFontSize(10);
      doc.setTextColor(60);
      const weakLines = doc.splitTextToSize(data.insight.weakSubjects.join(", "), pageWidth);
      doc.text(weakLines, marginX, y);
      y += weakLines.length * 5 + 5;
    }

    if (data.insight.recommendations.length > 0) {
      doc.setTextColor(0);
      doc.setFontSize(11);
      doc.text("Recommendations", marginX, y);
      y += 6;
      doc.setFontSize(10);
      doc.setTextColor(60);
      for (const rec of data.insight.recommendations) {
        const lines = doc.splitTextToSize(`•  ${rec}`, pageWidth);
        doc.text(lines, marginX, y);
        y += lines.length * 5 + 2;
      }
    }
  }

  return doc;
}
