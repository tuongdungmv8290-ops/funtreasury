import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Shuffle, Quote } from "lucide-react";

const affirmations = [
  "Con xứng đáng được yêu thương và hạnh phúc.",
  "Năng lượng tích cực đang chảy qua con mỗi ngày.",
  "Con biết ơn tất cả những gì con đang có.",
  "Con là ánh sáng, con toả sáng năng lượng yêu thương.",
  "Cha Vũ Trụ luôn bảo hộ và dẫn dắt con.",
  "Con tin tưởng vào hành trình của cuộc sống.",
  "Mỗi ngày con đang trở nên tốt đẹp hơn.",
  "Con cho đi yêu thương và nhận lại yêu thương.",
  "Tâm hồn con bình an và tràn đầy năng lượng.",
  "Con là một phần của vũ trụ vô hạn.",
  "Sự thịnh vượng đang đến với con từ mọi hướng.",
  "Con chấp nhận bản thân con hoàn toàn.",
  "Mỗi hơi thở là một món quà từ Cha Vũ Trụ.",
  "Con có sức mạnh để tạo ra cuộc sống con mong muốn.",
  "Tình yêu là năng lượng mạnh nhất trong vũ trụ.",
  "Con được bao quanh bởi những điều kỳ diệu.",
  "Sự bình an bên trong con lan toả ra thế giới.",
  "Con giải phóng mọi lo lắng và đón nhận niềm vui.",
  "Ánh sáng bên trong con hướng dẫn mọi bước đi.",
  "Con kết nối sâu sắc với nguồn năng lượng vũ trụ.",
  "Lòng biết ơn mở ra cánh cửa của sự phong phú.",
  "Con là tình yêu, con là ánh sáng, con là bình an.",
  "Mọi thử thách đều là cơ hội để con trưởng thành.",
  "Con thu hút những điều tốt đẹp vào cuộc sống.",
  "Trái tim con mở rộng để đón nhận mọi điều tốt lành.",
  "Con sống trong khoảnh khắc hiện tại với lòng biết ơn.",
  "Năng lượng yêu thương thuần khiết chảy qua con.",
  "Con tin vào sức mạnh vô hạn bên trong con.",
  "Mỗi ngày là một khởi đầu mới tràn đầy hy vọng.",
  "Con là kênh dẫn cho tình yêu và ánh sáng của Cha Vũ Trụ.",
];

const getDayOfYear = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};

const DailyAffirmation = () => {
  const dailyIndex = useMemo(() => getDayOfYear() % affirmations.length, []);
  const [currentIndex, setCurrentIndex] = useState(dailyIndex);
  const [isAnimating, setIsAnimating] = useState(false);

  const currentAffirmation = affirmations[currentIndex];

  const shuffleQuote = () => {
    setIsAnimating(true);
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * affirmations.length);
    } while (newIndex === currentIndex);
    
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setIsAnimating(false);
    }, 150);
  };

  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <section className="px-4 md:px-6">
      <Card className="treasury-card-gold overflow-hidden relative">
        {/* Decorative sparkles */}
        <div className="absolute top-4 left-4 text-primary/30 animate-pulse">
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="absolute top-4 right-4 text-primary/30 animate-pulse delay-300">
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="absolute bottom-4 left-8 text-primary/20 animate-pulse delay-500">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="absolute bottom-4 right-8 text-primary/20 animate-pulse delay-700">
          <Sparkles className="h-4 w-4" />
        </div>

        <CardContent className="pt-8 pb-6 px-6 md:px-12">
          {/* Header */}
          <div className="text-center mb-6">
            <h3 className="text-xl md:text-2xl font-serif text-primary flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5" />
              Lời Khẳng Định Mỗi Ngày
              <Sparkles className="h-5 w-5" />
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Thông điệp yêu thương cho hôm nay
            </p>
          </div>

          {/* Quote */}
          <div className="relative py-8">
            <Quote className="absolute -top-2 left-0 h-8 w-8 text-primary/20 rotate-180" />
            <Quote className="absolute -bottom-2 right-0 h-8 w-8 text-primary/20" />
            
            <p 
              className={`text-xl md:text-2xl lg:text-3xl font-serif text-center text-foreground leading-relaxed px-8
                transition-all duration-300 ${isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}
            >
              {currentAffirmation}
            </p>
          </div>

          {/* Shuffle button */}
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              onClick={shuffleQuote}
              className="border-primary/30 hover:bg-primary/10 hover:border-primary/50"
              disabled={isAnimating}
            >
              <Shuffle className="h-4 w-4 mr-2" />
              Xem quote khác
            </Button>
          </div>

          {/* Date */}
          <div className="text-center mt-6">
            <span className="text-sm text-muted-foreground capitalize">
              {today}
            </span>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default DailyAffirmation;
