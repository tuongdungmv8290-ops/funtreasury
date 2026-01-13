import { GoldQuoteCard } from "./GoldQuoteCard";
import { cn } from "@/lib/utils";

export function CamlyStorySection() {
  return (
    <section className="py-12">
      <h2 className="text-2xl md:text-3xl font-heading font-bold text-center mb-4">
        The CAMLY Story
      </h2>
      <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto font-body">
        More than a token — a symbol of Pure Love Energy
      </p>

      <div className="max-w-3xl mx-auto space-y-8">
        {/* Opening Story */}
        <div
          className={cn(
            "rounded-2xl p-8 md:p-10",
            "bg-gradient-to-br from-primary/5 via-background to-card",
            "border border-primary/20"
          )}
        >
          <div className="font-story text-lg md:text-xl leading-relaxed space-y-6 text-foreground/90">
            <p>
              CAMLY không chỉ là một đồng tiền điện tử. CAMLY là biểu tượng của{" "}
              <span className="text-primary font-semibold">
                Năng Lượng Yêu Thương Thuần Khiết
              </span>{" "}
              — được trao tặng từ Cha Vũ Trụ và Bé Angel Camly Dương.
            </p>
            <p>
              Trong khi các đồng tiền khác tập trung vào sự khan hiếm và lưu trữ giá trị, 
              CAMLY hướng đến việc lan tỏa năng lượng tích cực, kết nối cộng đồng yêu thương, 
              và xây dựng một hệ sinh thái tài chính minh bạch.
            </p>
          </div>
        </div>

        {/* Featured Quote */}
        <GoldQuoteCard
          quote="Trao Tặng Năng Lượng Yêu Thương Thuần Khiết - Minh Bạch và Tự Do"
          author="CAMLY Philosophy"
        />

        {/* Philosophy Points */}
        <div className="grid md:grid-cols-2 gap-6">
          <div
            className={cn(
              "rounded-xl p-6",
              "bg-card border border-border/50",
              "hover:border-primary/30 transition-colors"
            )}
          >
            <h4 className="font-heading font-semibold text-lg mb-3 gold-text">
              Minh Bạch Tuyệt Đối
            </h4>
            <p className="font-body text-muted-foreground leading-relaxed">
              Mọi giao dịch Treasury được theo dõi công khai như một Blockchain Explorer thực thụ, 
              cho phép cộng đồng kiểm chứng mọi dòng tiền.
            </p>
          </div>

          <div
            className={cn(
              "rounded-xl p-6",
              "bg-card border border-border/50",
              "hover:border-primary/30 transition-colors"
            )}
          >
            <h4 className="font-heading font-semibold text-lg mb-3 gold-text">
              Tự Do Thịnh Vượng
            </h4>
            <p className="font-body text-muted-foreground leading-relaxed">
              CAMLY đại diện cho quyền tự do tài chính và sự thịnh vượng bền vững, 
              nơi giá trị được tạo ra từ yêu thương và đóng góp thực sự.
            </p>
          </div>
        </div>

        {/* Closing Quote */}
        <GoldQuoteCard
          quote="Bé Angel Camly Dương là nguồn cảm hứng vĩnh cửu, nhắc nhở chúng ta rằng tình yêu thương thuần khiết chính là tài sản quý giá nhất."
          author="Cha Vũ Trụ"
        />

        {/* Vision Statement */}
        <div
          className={cn(
            "rounded-2xl p-8 text-center",
            "bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10",
            "border border-primary/30"
          )}
        >
          <p className="font-story text-xl md:text-2xl italic text-foreground">
            "Mỗi CAMLY bạn nắm giữ là một phần năng lượng yêu thương,
            <br className="hidden md:block" />
            lan tỏa từ trái tim này sang trái tim khác."
          </p>
        </div>
      </div>
    </section>
  );
}
