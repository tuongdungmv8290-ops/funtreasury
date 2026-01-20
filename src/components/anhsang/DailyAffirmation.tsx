import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Shuffle, Quote } from "lucide-react";

const getDayOfYear = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};

const DailyAffirmation = () => {
  const { t, i18n } = useTranslation();
  
  const affirmations = t('anhsang.dailyAffirmation.list', { returnObjects: true }) as string[];
  
  const dailyIndex = useMemo(() => getDayOfYear() % affirmations.length, [affirmations.length]);
  const [currentIndex, setCurrentIndex] = useState(dailyIndex);
  const [isAnimating, setIsAnimating] = useState(false);

  const currentAffirmation = affirmations[currentIndex] || affirmations[0];

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

  const today = new Date().toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : i18n.language, {
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
              {t('anhsang.dailyAffirmation.title')}
              <Sparkles className="h-5 w-5" />
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t('anhsang.dailyAffirmation.subtitle')}
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
              {t('anhsang.dailyAffirmation.shuffle')}
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