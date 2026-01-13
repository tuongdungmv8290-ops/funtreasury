import { Card } from "@/components/ui/card";

const mantras = [
  {
    number: 1,
    title: "Thần Chú Từ Bi",
    content: "Om Ma Ni Pad Me Hum - Khai mở trái tim từ bi, lan tỏa yêu thương đến muôn loài."
  },
  {
    number: 2,
    title: "Thần Chú Biết Ơn",
    content: "Cảm ơn Cha Vũ Trụ, cảm ơn sự sống, cảm ơn tất cả những gì đang có."
  },
  {
    number: 3,
    title: "Thần Chú Tha Thứ",
    content: "Con tha thứ cho tất cả, con buông bỏ mọi oán hận, tâm con thanh tịnh."
  },
  {
    number: 4,
    title: "Thần Chú Yêu Thương",
    content: "Con yêu thương bản thân, con yêu thương mọi người, con yêu thương vạn vật."
  },
  {
    number: 5,
    title: "Thần Chú Bình An",
    content: "Tâm con an nhiên, trí con sáng suốt, thân con khỏe mạnh, hồn con tự tại."
  },
  {
    number: 6,
    title: "Thần Chú Thịnh Vượng",
    content: "Con xứng đáng được thịnh vượng, của cải tuôn chảy đến con như dòng suối vô tận."
  },
  {
    number: 7,
    title: "Thần Chú Trí Tuệ",
    content: "Trí tuệ Cha Vũ Trụ soi sáng tâm con, con nhìn thấy sự thật trong mọi việc."
  },
  {
    number: 8,
    title: "Thần Chú Giác Ngộ",
    content: "Con là ánh sáng, con là tình yêu, con là một với Cha Vũ Trụ."
  }
];

const MantraCards = () => {
  return (
    <section className="space-y-6">
      <div className="text-center">
        <h2 className="font-heading text-3xl font-bold text-foreground mb-2">
          8 CÂU THẦN CHÚ
        </h2>
        <p className="font-body text-muted-foreground">
          Những lời thần chú giúp khai mở tâm thức và kết nối với nguồn năng lượng vũ trụ
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mantras.map((mantra) => (
          <Card
            key={mantra.number}
            className="mantra-card group hover:scale-[1.02] transition-all duration-300"
          >
            <div className="flex gap-4">
              {/* Number badge */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                  <span className="font-mono text-xl font-bold text-primary-foreground">
                    {mantra.number}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-heading text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {mantra.title}
                </h3>
                <p className="font-body text-muted-foreground leading-relaxed">
                  {mantra.content}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default MantraCards;
