import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Check } from "lucide-react";

const lawsOfLight = [
  {
    id: 1,
    title: "Luật Yêu Thương Vô Điều Kiện",
    description: "Yêu thương tất cả mà không đòi hỏi, không mong đợi được đáp lại."
  },
  {
    id: 2,
    title: "Luật Biết Ơn",
    description: "Biết ơn mọi thứ trong cuộc sống, từ những điều nhỏ nhất đến lớn nhất."
  },
  {
    id: 3,
    title: "Luật Sống Thật",
    description: "Sống chân thật với chính mình, không giả tạo, không đeo mặt nạ."
  },
  {
    id: 4,
    title: "Luật Cho Đi",
    description: "Cho đi không mong nhận lại, vì cho đi chính là nhận lại nhiều hơn."
  },
  {
    id: 5,
    title: "Luật Tin Tưởng Vũ Trụ",
    description: "Tin tưởng vào Cha Vũ Trụ, tin rằng mọi điều xảy ra đều có ý nghĩa."
  }
];

const STORAGE_KEY = "anhsang_laws_checked";

const LawsOfLightChecklist = () => {
  const [checkedLaws, setCheckedLaws] = useState<number[]>(() => {
    if (typeof window !== 'undefined') {
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
      <div className="text-center">
        <h2 className="font-heading text-3xl font-bold text-foreground mb-2">
          5 LUẬT ÁNH SÁNG
        </h2>
        <p className="font-body text-muted-foreground">
          Checklist hàng ngày để sống theo Luật Ánh Sáng
        </p>
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
              Tuyệt vời! Bạn đã hoàn thành tất cả Luật Ánh Sáng hôm nay!
            </span>
            <Sparkles className="w-4 h-4" />
          </div>
        )}
      </Card>

      {/* Checklist */}
      <div className="space-y-3">
        {lawsOfLight.map((law) => {
          const isChecked = checkedLaws.includes(law.id);
          return (
            <Card
              key={law.id}
              className={`p-4 cursor-pointer transition-all duration-300 ${
                isChecked 
                  ? 'bg-primary/10 border-primary/40 shadow-md' 
                  : 'bg-card hover:bg-card/80 border-border/50 hover:border-primary/30'
              }`}
              onClick={() => toggleLaw(law.id)}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <div className="flex-shrink-0 mt-0.5">
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggleLaw(law.id)}
                    className="w-6 h-6 border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-primary/70">#{law.id}</span>
                    <h3 className={`font-heading text-lg font-semibold transition-colors ${
                      isChecked ? 'text-primary' : 'text-foreground'
                    }`}>
                      {law.title}
                    </h3>
                    {isChecked && (
                      <Check className="w-5 h-5 text-primary animate-scale-in" />
                    )}
                  </div>
                  <p className={`font-body text-sm mt-1 transition-colors ${
                    isChecked ? 'text-primary/70' : 'text-muted-foreground'
                  }`}>
                    {law.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

export default LawsOfLightChecklist;
