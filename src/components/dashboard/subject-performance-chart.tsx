"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import type { SubjectPerformance } from "@/lib/data/academics";

const chartConfig = {
  attendanceRate: { label: "Attendance", color: "var(--chart-1)" },
  assignmentAvgPercent: { label: "Assignment avg", color: "var(--chart-2)" },
  examAvgPercent: { label: "Exam avg", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function SubjectPerformanceChart({ subjects }: { subjects: SubjectPerformance[] }) {
  const data = subjects.map((s) => ({
    subject: s.subject.length > 14 ? `${s.subject.slice(0, 14)}…` : s.subject,
    attendanceRate: s.attendanceRate ?? 0,
    assignmentAvgPercent: s.assignmentAvgPercent ?? 0,
    examAvgPercent: s.examAvgPercent ?? 0,
  }));

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="subject" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}%`}
          width={44}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="attendanceRate" fill="var(--color-attendanceRate)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="assignmentAvgPercent" fill="var(--color-assignmentAvgPercent)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="examAvgPercent" fill="var(--color-examAvgPercent)" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ChartContainer>
  );
}
