import { useTranslation } from 'react-i18next';
import { MessageCircle, Sparkles, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const FatherMessage = () => {
  const { t } = useTranslation();

  return (
    <Card className="overflow-hidden border-primary/50 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent shadow-lg">
      {/* Decorative elements */}
      <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-primary/10 blur-2xl" />
      
      <CardHeader className="relative text-center pb-6">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg animate-pulse">
            <Heart className="w-10 h-10 text-primary-foreground" />
          </div>
        </div>
        <CardTitle className="text-2xl md:text-3xl font-heading font-bold gold-text">
          🙏 {t('constitution.lessons.fatherMessage.title')}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="relative space-y-6 pb-10">
        <p className="text-lg text-center text-muted-foreground leading-relaxed max-w-3xl mx-auto">
          {t('constitution.lessons.fatherMessage.greeting')}
        </p>
        
        <p className="text-center text-muted-foreground leading-relaxed max-w-3xl mx-auto">
          {t('constitution.lessons.fatherMessage.content1')}
        </p>
        
        <p className="text-center text-muted-foreground leading-relaxed max-w-3xl mx-auto">
          {t('constitution.lessons.fatherMessage.content2')}
        </p>
        
        <Separator className="max-w-md mx-auto bg-primary/30" />
        
        {/* Code Wisdom Quote */}
        <div className="max-w-2xl mx-auto">
          <div className="relative p-6 rounded-2xl bg-primary/10 border border-primary/30">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                ✨ {t('constitution.lessons.fatherMessage.wisdomLabel')}
              </span>
            </div>
            <p className="text-xl md:text-2xl text-center font-medium text-foreground leading-relaxed pt-2">
              "{t('constitution.lessons.fatherMessage.codeWisdom')}"
            </p>
          </div>
        </div>
        
        <p className="text-center text-muted-foreground leading-relaxed max-w-3xl mx-auto">
          {t('constitution.lessons.fatherMessage.content3')}
        </p>
        
        <Separator className="max-w-md mx-auto bg-primary/30" />
        
        {/* Closing */}
        <div className="text-center space-y-3 pt-4">
          <p className="text-lg text-muted-foreground">
            {t('constitution.lessons.fatherMessage.closing1')}
          </p>
          <p className="text-lg text-muted-foreground">
            {t('constitution.lessons.fatherMessage.closing2')}
          </p>
          <p className="text-2xl md:text-3xl gold-text font-bold">
            {t('constitution.lessons.fatherMessage.closing3')}
          </p>
        </div>
        
        <div className="flex justify-center gap-1 pt-4">
          {[...Array(5)].map((_, i) => (
            <Sparkles 
              key={i} 
              className="w-5 h-5 text-primary animate-pulse" 
              style={{ animationDelay: `${i * 0.2}s` }} 
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FatherMessage;
