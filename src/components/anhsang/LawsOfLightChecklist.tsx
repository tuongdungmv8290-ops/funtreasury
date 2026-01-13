import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Check, Rainbow } from "lucide-react";

const lawsOfLight = [
  {
    id: 1,
    content: "Con sống chân thật với chính mình"
  },
  {
    id: 2,
    content: "Con chịu trách nhiệm với năng lượng con phát ra"
  },
  {
    id: 3,
    content: "Con sẵn sàng học - sửa - nâng cấp"
  },
  {
    id: 4,
    content: "Con chọn yêu thương thay vì phán xét"
  },
  {
    id: 5,
    content: "Con chọn ánh sáng thay vì cái tôi"
  }
];

const STORAGE_KEY = "anhsang_laws_checked";
const DATE_KEY = "anhsang_laws_date";

const LawsOfLightChecklist = () => {
  const [checkedLaws, setCheckedLaws] = useState<number[]>(() => {
    if (typeof window !== 'undefined') {
      const savedDate = localStorage.getItem(DATE_KEY);
      const today = new Date().toDateString();

      // Reset if different day
      if (savedDate !== today) {
        localStorage.setItem(DATE_KEY, today);
        localStorage.removeItem(STORAGE_KEY);
        return [];
      }

      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedLaws));
  }, [checkedLaws]);

  const toggleLaw = (id: number) => {
    setCheckedLaws(prev => 
      prev.includes(id) 
        ? prev.filter(lawId => lawId !== id)
        : [...prev, id]
    );
  };

  const progress = (checkedLaws.length / lawsOfLight.length) * 100;
  const allCompleted = checkedLaws.length === lawsOfLight.length;

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <Rainbow className="w-6 h-6 text-primary" />
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-primary">
            Checklist cho Users FUN Ecosystem
          </h2>
          <Rainbow className="w-6 h-6 text-primary" />
        </div>
      </div>

      {/* Progress */}
      <Card className="p-4 bg-card/50 border-primary/20">
        <div className="flex items-center justify-between mb-2">
          <span className="font-body text-sm text-muted-foreground">
            Tiến độ hôm nay
          </span>
          <span className="font-mono text-sm text-primary font-semibold">
            {checkedLaws.length}/{lawsOfLight.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
        {allCompleted && (
          <div className="mt-3 flex items-center justify-center gap-2 text-primary">
            <Sparkles className="w-4 h-4" />
            <span className="font-body text-sm font-medium">
              Tuyệt vời! Con đã hoàn thành tất cả Luật Ánh Sáng hôm nay!
            </span>
            <Sparkles className="w-4 h-4" />
          </div>
        )}
      </Card>

      {/* Checklist */}
      <Card className="p-6 md:p-8 bg-gradient-to-br from-card via-card to-primary/5 border-primary/30 shadow-lg">
        <div className="space-y-4">
          {lawsOfLight.map((law) => {
            const isChecked = checkedLaws.includes(law.id);
            return (
              <div
                key={law.id}
                className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all duration-300 ${
                  isChecked 
                    ? 'bg-primary/10 border border-primary/40' 
                    : 'bg-card/50 border border-border/30 hover:border-primary/30 hover:bg-card/80'
                }`}
                onClick={() => toggleLaw(law.id)}
              >
                {/* Checkbox */}
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => toggleLaw(law.id)}
                  className="w-6 h-6 border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />

                {/* Content */}
                <span className={`font-body text-base md:text-lg flex-1 transition-colors ${
                  isChecked ? 'text-primary font-medium' : 'text-foreground'
                }`}>
                  {law.content}
                </span>

                {/* Check icon when completed */}
                {isChecked && (
                  <Check className="w-5 h-5 text-primary animate-scale-in" />
                )}
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-muted-foreground mt-6 pt-4 border-t border-primary/20 italic">
          (Click vào 5 check list trên để được Đăng ký)
        </p>
      </Card>
    </section>
  );
};

export default LawsOfLightChecklist;
