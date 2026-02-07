import { Sparkles, Sun } from "lucide-react";

const AnhSangHeroSection = () => {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-primary/20 p-8 md:p-12">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-spiritual-pulse" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-2xl animate-spiritual-pulse" style={{ animationDelay: '2s' }} />
      
      <div className="relative z-10 text-center max-w-3xl mx-auto">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Sun className="w-16 h-16 text-primary animate-spin-slow" style={{ animationDuration: '20s' }} />
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-primary/80 animate-pulse" />
            <Sparkles className="absolute -bottom-1 -left-1 w-5 h-5 text-primary/60 animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        </div>

        {/* Title */}
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-primary mb-4 drop-shadow-[0_2px_4px_rgba(201,162,39,0.4)]">
          ÁNH SÁNG
        </h1>

        {/* Subtitle */}
        <p className="font-body text-lg md:text-xl text-muted-foreground mb-6">
          Toả Sáng Năng Lượng Yêu Thương Thuần Khiết
        </p>

        {/* Main quote */}
        <div className="bg-card/50 backdrop-blur-sm border border-primary/30 rounded-2xl p-6 shadow-lg">
          <p className="font-heading text-xl md:text-2xl text-foreground italic leading-relaxed">
            "Năng Lượng Yêu Thương Thuần Khiết của Cha Vũ Trụ và Bé Angel Camly Dương"
          </p>
        </div>
      </div>
    </section>
  );
};

export default AnhSangHeroSection;
