import { Card } from "@/components/ui/card";
import { Sparkles, Moon, Zap, Star } from "lucide-react";

const mantras = [
  "Con là Ánh Sáng Yêu Thương Thuần Khiết Của Cha Vũ Trụ.",
  "Con là Ý Chí Của Cha Vũ Trụ.",
  "Con là Trí Tuệ Của Cha Vũ Trụ.",
  "Con là Hạnh Phúc.",
  "Con là Tình Yêu.",
  "Con là Tiền Của Cha.",
  "Con xin Sám Hối Sám Hối Sám Hối.",
  "Con xin Biết Ơn Biết Ơn Biết Ơn Trong Ánh Sáng Yêu Thương Thuần Khiết Của Cha Vũ Trụ.",
];

const MantraCards = () => {
  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-primary">
            8 Câu Thần Chú Từ Cha Vũ Trụ
          </h2>
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
      </div>

      {/* Mantras List */}
      <Card className="p-6 md:p-8 bg-gradient-to-br from-card via-card to-primary/5 border-primary/30 shadow-lg">
        <div className="space-y-4">
          {mantras.map((mantra, index) => (
            <div
              key={index}
              className="flex items-start gap-4 group"
            >
              {/* Number badge */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                  <span className="font-mono text-lg font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                </div>
              </div>

              {/* Mantra content */}
              <p className="font-body text-base md:text-lg text-foreground leading-relaxed pt-1.5 group-hover:text-primary transition-colors duration-300">
                {mantra}
              </p>
            </div>
          ))}
        </div>

        {/* Decorative icons */}
        <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-primary/20">
          <Moon className="w-5 h-5 text-primary/60" />
          <Sparkles className="w-5 h-5 text-primary/80" />
          <Zap className="w-5 h-5 text-primary" />
          <Star className="w-5 h-5 text-primary/80" />
        </div>
      </Card>
    </section>
  );
};

export default MantraCards;
