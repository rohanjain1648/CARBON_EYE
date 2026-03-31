import { CarbonGrade } from "@/types/carbon";
import { cn } from "@/lib/utils";

const gradeColors: Record<CarbonGrade, string> = {
  A: "bg-grade-a text-primary-foreground",
  B: "bg-grade-b text-primary-foreground",
  C: "bg-grade-c text-warning-foreground",
  D: "bg-grade-d text-primary-foreground",
  F: "bg-grade-f text-destructive-foreground",
};

const gradeLabels: Record<CarbonGrade, string> = {
  A: "Excellent",
  B: "Good",
  C: "Average",
  D: "Poor",
  F: "Very Poor",
};

const GradeBadge = ({ grade, size = "lg" }: { grade: CarbonGrade; size?: "sm" | "lg" }) => {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "rounded-lg font-orbitron font-bold flex items-center justify-center",
          gradeColors[grade],
          size === "lg" ? "w-20 h-20 text-4xl" : "w-10 h-10 text-xl"
        )}
      >
        {grade}
      </div>
      {size === "lg" && (
        <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
          {gradeLabels[grade]}
        </span>
      )}
    </div>
  );
};

export default GradeBadge;
