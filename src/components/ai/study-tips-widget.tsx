import { Sparkles } from "lucide-react";
import { getStudyTips } from "@/lib/ai/study-tips";
import { Badge } from "@/components/ui/badge";

export async function StudyTipsWidget() {
  const { tips, source } = await getStudyTips();

  return (
    <div className="ai-gradient-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-ai/15 text-ai">
            <Sparkles className="size-4" />
          </span>
          <h3 className="font-semibold">AI Study Tips</h3>
        </div>
        <Badge variant="outline" className="border-ai/30 text-ai text-[10px] font-medium">
          {source === "ai" ? "Claude-generated" : "Curated"}
        </Badge>
      </div>
      <ul className="mt-4 space-y-3">
        {tips.map((tip) => (
          <li key={tip.title} className="text-sm">
            <span className="font-medium">{tip.title}.</span>{" "}
            <span className="text-muted-foreground">{tip.tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
