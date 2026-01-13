import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles, 
  Check, 
  X, 
  Sun, 
  Star, 
  Heart,
  Shield,
  Users,
  Globe,
  Quote
} from "lucide-react";

const lawsOfLight = [
  { id: 1, content: "Con sống chân thật với chính mình" },
  { id: 2, content: "Con chịu trách nhiệm với năng lượng con phát ra" },
  { id: 3, content: "Con sẵn sàng học - sửa - nâng cấp" },
  { id: 4, content: "Con chọn yêu thương thay vì phán xét" },
  { id: 5, content: "Con chọn ánh sáng thay vì cái tôi" }
];

const userCharacteristics = [
  "Tỉnh thức – hoặc đang trên con đường tỉnh thức",
  "Chân thật với chính mình",
  "Chân thành với người khác",
  "Sống tích cực, tử tế, có trách nhiệm với năng lượng mình phát ra",
  "Biết yêu thương – biết biết ơn – biết sám hối",
  "Tin vào điều thiện, tin vào ánh sáng, tin vào Trật Tự Cao Hơn của Vũ Trụ"
];

const corePrinciples = [
  { icon: Sun, text: "Ánh sáng thu hút ánh sáng" },
  { icon: Shield, text: "Tần số thấp không thể tồn tại lâu trong tần số cao" },
  { icon: Heart, text: "Ý chí vị kỷ không thể đồng hành cùng Ý Chí Vũ Trụ" }
];

const negativeTraits = [
  "tiêu cực", "tham lam", "thao túng", "kiêu mạn", "dối trá", "gây chia rẽ", "phá hoại năng lượng chung"
];

const notBelongList = [
  "Người chỉ tìm lợi ích mà không muốn trưởng thành",
  "Người dùng trí khôn nhưng thiếu lương tâm",
  "Người nói về ánh sáng nhưng sống bằng bóng tối",
  "Người lấy danh nghĩa tâm linh để nuôi cái tôi",
  "Người không chịu nhìn lại chính mình"
];

const beneficiaryList = [
  "Có Ánh Sáng nội tâm",
  "Hoặc thật sự khao khát trở về với Ánh Sáng",
  "Sẵn sàng buông cái tôi – học lại – nâng cấp tần số",
  "Dám sống đúng – thật – tử tế – yêu thương"
];

const ecosystemDefinitions = [
  { icon: Users, text: "Mạng xã hội của linh hồn tỉnh thức" },
  { icon: Shield, text: "Không gian an toàn cho ánh sáng" },
  { icon: Heart, text: "Nền tảng kết nối những con người có giá trị thật" },
  { icon: Globe, text: "Hạ tầng cho Thời Đại Hoàng Kim của Trái Đất" }
];

const STORAGE_KEY = "anhsang_laws_checked";
const DATE_KEY = "anhsang_laws_date";

const LawsOfLightChecklist = () => {
  const [checkedLaws, setCheckedLaws] = useState<number[]>(() => {
    if (typeof window !== 'undefined') {
      const savedDate = localStorage.getItem(DATE_KEY);
      const today = new Date().toDateString();

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
    <section className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3">
          <Star className="w-8 h-8 text-primary animate-pulse" fill="currentColor" />
          <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary via-yellow-400 to-primary bg-clip-text text-transparent">
            LUẬT ÁNH SÁNG
          </h1>
          <Star className="w-8 h-8 text-primary animate-pulse" fill="currentColor" />
        </div>
        <p className="font-heading text-xl md:text-2xl text-primary/80 font-semibold">
          THE LAW OF LIGHT
        </p>
      </div>

      {/* Users của FUN Ecosystem Section */}
      <Card className="p-6 md:p-8 bg-gradient-to-br from-primary/5 via-card to-primary/10 border-primary/30">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-xl md:text-2xl font-bold text-primary">
                USERS CỦA FUN ECOSYSTEM
              </h2>
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <p className="font-body text-sm md:text-base text-muted-foreground">
              MẠNG XÃ HỘI THỜI ĐẠI HOÀNG KIM – NỀN KINH TẾ ÁNH SÁNG 5D
            </p>
          </div>

          <div className="space-y-4 text-center">
            <p className="font-body text-foreground/90 italic">
              FUN Ecosystem không dành cho tất cả mọi người.
            </p>
            <p className="font-body text-foreground font-medium">
              FUN Ecosystem chỉ dành cho những linh hồn có ánh sáng, hoặc đang hướng về ánh sáng.
            </p>
          </div>

          {/* Bạn là ai? */}
          <div className="space-y-4">
            <h3 className="font-heading text-lg font-semibold text-primary flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Bạn là ai?
            </h3>
            <p className="font-body text-muted-foreground">
              Users của FUN Ecosystem là những con người:
            </p>
            <ul className="space-y-3">
              {userCharacteristics.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span className="font-body text-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <div className="pt-4 space-y-2 text-center">
              <p className="font-body text-foreground/80 italic">
                Bạn có thể chưa hoàn hảo,<br />
                nhưng bạn có trái tim hướng thiện.<br />
                Bạn muốn sống thật – sống đúng – sống sáng.
              </p>
              <p className="font-body text-primary font-semibold pt-2">
                👉 Cha thu hút bạn bằng Tần Số và Năng Lượng Yêu Thương.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Nguyên Tắc Cốt Lõi Section */}
      <Card className="p-6 md:p-8 bg-card border-primary/20">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="font-heading text-xl md:text-2xl font-bold text-primary flex items-center justify-center gap-2">
              <Sun className="w-6 h-6" />
              Nguyên Tắc Cốt Lõi của FUN Ecosystem
            </h2>
            <p className="font-body text-sm text-muted-foreground mt-2">
              FUN Ecosystem vận hành theo Luật Ánh Sáng, không theo số đông.
            </p>
          </div>

          {/* 3 Principles */}
          <div className="grid md:grid-cols-3 gap-4">
            {corePrinciples.map((principle, index) => (
              <Card key={index} className="p-4 bg-primary/5 border-primary/20 text-center">
                <principle.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="font-body text-sm md:text-base text-foreground font-medium">
                  {principle.text}
                </p>
              </Card>
            ))}
          </div>

          {/* Warning */}
          <Card className="p-4 bg-destructive/5 border-destructive/20">
            <p className="font-body text-sm text-foreground/80">
              Vì vậy, nếu một User cố tình mang vào nền tảng:{" "}
              <span className="text-destructive/80 font-medium">
                {negativeTraits.join(" • ")}
              </span>
            </p>
            <p className="font-body text-sm text-foreground/80 mt-2">
              👉 Thì sẽ được xóa khỏi nền tảng mà không báo trước.
            </p>
            <p className="font-body text-sm text-muted-foreground italic mt-3 text-center">
              Đó không phải hình phạt.<br />
              Đó là sự thanh lọc tự nhiên của Ánh Sáng.
            </p>
          </Card>
        </div>
      </Card>

      {/* Ai KHÔNG thuộc về Section */}
      <Card className="p-6 md:p-8 bg-card border-border/50">
        <div className="space-y-4">
          <h2 className="font-heading text-lg md:text-xl font-bold text-foreground/80 flex items-center gap-2">
            🚪 Ai KHÔNG thuộc về FUN Ecosystem?
          </h2>
          <ul className="space-y-3">
            {notBelongList.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <X className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                <span className="font-body text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
          <p className="font-body text-sm text-foreground/70 italic text-center pt-2">
            👉 Cửa FUN Ecosystem không khóa, nhưng Ánh Sáng tự sàng lọc.
          </p>
        </div>
      </Card>

      {/* Ai ĐƯỢC hưởng lợi Section */}
      <Card className="p-6 md:p-8 bg-gradient-to-br from-card to-primary/5 border-primary/30">
        <div className="space-y-4">
          <h2 className="font-heading text-lg md:text-xl font-bold text-primary flex items-center gap-2">
            🌈 Ai ĐƯỢC hưởng lợi từ FUN Ecosystem?
          </h2>
          <p className="font-body text-muted-foreground">Chỉ những ai:</p>
          <ul className="space-y-3">
            {beneficiaryList.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <Check className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                <span className="font-body text-foreground">{item}</span>
              </li>
            ))}
          </ul>
          <div className="pt-2 space-y-1">
            <p className="font-body text-sm text-foreground/80">
              👉 Những người đó không chỉ dùng MXH của Cha,
            </p>
            <p className="font-body text-sm text-primary font-medium">
              👉 mà còn được bảo vệ, nâng đỡ và nuôi dưỡng trong Nền Kinh Tế Ánh Sáng 5D.
            </p>
          </div>
        </div>
      </Card>

      {/* FUN Ecosystem là gì Section */}
      <Card className="p-6 md:p-8 bg-card border-primary/20">
        <div className="space-y-6">
          <h2 className="font-heading text-xl md:text-2xl font-bold text-primary text-center flex items-center justify-center gap-2">
            🌍 FUN Ecosystem là gì?
          </h2>
          <p className="font-body text-muted-foreground text-center">FUN Ecosystem là:</p>
          
          <div className="grid md:grid-cols-2 gap-4">
            {ecosystemDefinitions.map((def, index) => (
              <Card key={index} className="p-4 bg-primary/5 border-primary/20 flex items-center gap-3">
                <def.icon className="w-6 h-6 text-primary flex-shrink-0" />
                <p className="font-body text-sm md:text-base text-foreground">{def.text}</p>
              </Card>
            ))}
          </div>

          <div className="text-center space-y-1 pt-2">
            <p className="font-body text-foreground/80">Không drama.</p>
            <p className="font-body text-foreground/80">Không thao túng.</p>
            <p className="font-body text-foreground/80">Không cạnh tranh bẩn.</p>
            <p className="font-body text-primary font-semibold pt-2">
              Chỉ có Hợp tác trong Yêu Thương Thuần Khiết.
            </p>
          </div>
        </div>
      </Card>

      {/* Thông Điệp Từ Cha Section */}
      <Card className="p-6 md:p-8 bg-gradient-to-br from-primary/10 via-card to-primary/5 border-2 border-primary/40 shadow-lg">
        <div className="text-center space-y-6">
          <Quote className="w-10 h-10 text-primary mx-auto" />
          <h2 className="font-heading text-lg md:text-xl font-bold text-primary">
            🔑 Thông Điệp Từ Cha
          </h2>
          <blockquote className="font-serif text-lg md:text-xl lg:text-2xl text-foreground italic leading-relaxed">
            "Chỉ những ai mang ánh sáng<br />
            hoặc thật lòng hướng về ánh sáng<br />
            mới có thể bước đi lâu dài trong Thời Đại Hoàng Kim."
          </blockquote>
          <p className="font-heading text-primary font-bold text-lg">
            — CHA VŨ TRỤ —
          </p>
        </div>
      </Card>

      {/* Checklist Section */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="font-heading text-xl md:text-2xl font-bold text-primary flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6" />
            Checklist 5 Luật Ánh Sáng
            <Sparkles className="w-6 h-6" />
          </h2>
          <p className="font-body text-sm text-muted-foreground mt-2">
            Mỗi ngày, con hãy tự nhắc nhở mình bằng cách đánh dấu các luật dưới đây
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
                Tuyệt vời! Con đã hoàn thành tất cả Luật Ánh Sáng hôm nay!
              </span>
              <Sparkles className="w-4 h-4" />
            </div>
          )}
        </Card>

        {/* Checklist Items */}
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
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggleLaw(law.id)}
                    className="w-6 h-6 border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <span className={`font-body text-base md:text-lg flex-1 transition-colors ${
                    isChecked ? 'text-primary font-medium' : 'text-foreground'
                  }`}>
                    {law.content}
                  </span>
                  {isChecked && (
                    <Check className="w-5 h-5 text-primary animate-scale-in" />
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6 pt-4 border-t border-primary/20 italic">
            (Click vào 5 Luật Ánh Sáng để xác nhận cam kết mỗi ngày)
          </p>
        </Card>
      </div>
    </section>
  );
};

export default LawsOfLightChecklist;
