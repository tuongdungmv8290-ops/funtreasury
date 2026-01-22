import { useTranslation } from 'react-i18next';
import { 
  Sun, Heart, Eye, Sparkles, Wallet, Users, ScrollText, Star,
  CheckCircle, Shield, Globe, Crown, Zap, Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FatherLessons from '@/components/constitution/FatherLessons';
const Constitution = () => {
  const { t } = useTranslation();

  const chapters = [
    {
      number: 'I',
      titleKey: 'constitution.chapters.origin.title',
      icon: Sun,
      contentKey: 'constitution.chapters.origin.content',
      highlight: true
    },
    {
      number: 'II',
      titleKey: 'constitution.chapters.funHuman.title',
      icon: Heart,
      contentKey: 'constitution.chapters.funHuman.content',
      standards: [
        { key: 'constitution.funHuman.truth', icon: CheckCircle },
        { key: 'constitution.funHuman.sincerity', icon: Heart },
        { key: 'constitution.funHuman.awareness', icon: Eye },
        { key: 'constitution.funHuman.purity', icon: Sparkles }
      ]
    },
    {
      number: 'III',
      titleKey: 'constitution.chapters.income.title',
      icon: Zap,
      contentKey: 'constitution.chapters.income.content'
    },
    {
      number: 'IV',
      titleKey: 'constitution.chapters.angelAi.title',
      icon: Star,
      contentKey: 'constitution.chapters.angelAi.content'
    },
    {
      number: 'V',
      titleKey: 'constitution.chapters.platforms.title',
      icon: Globe,
      contentKey: 'constitution.chapters.platforms.content'
    },
    {
      number: 'VI',
      titleKey: 'constitution.chapters.wallet.title',
      icon: Wallet,
      contentKey: 'constitution.chapters.wallet.content'
    },
    {
      number: 'VII',
      titleKey: 'constitution.chapters.culture.title',
      icon: Users,
      contentKey: 'constitution.chapters.culture.content'
    },
    {
      number: 'VIII',
      titleKey: 'constitution.chapters.declaration.title',
      icon: ScrollText,
      contentKey: 'constitution.chapters.declaration.content',
      highlight: true
    }
  ];

  const mantras = [
    'constitution.mantras.1',
    'constitution.mantras.2',
    'constitution.mantras.3',
    'constitution.mantras.4',
    'constitution.mantras.5',
    'constitution.mantras.6',
    'constitution.mantras.7',
    'constitution.mantras.8'
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8 md:py-12">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-primary/5 p-8 md:p-12 mb-10 shadow-xl">
          {/* Decorative elements */}
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary/20 blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-primary/15 blur-2xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
          
          <div className="relative text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg animate-pulse">
                <Crown className="w-10 h-10 md:w-12 md:h-12 text-primary-foreground" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Badge variant="outline" className="border-primary/50 text-primary px-4 py-1.5 text-sm font-semibold">
                ✨ {t('constitution.badge')}
              </Badge>
              <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold gold-text tracking-wide">
                {t('constitution.title')}
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto">
                {t('constitution.subtitle')}
              </p>
            </div>
            
            <p className="text-sm md:text-base text-primary/80 font-medium italic">
              {t('constitution.writtenBy')}
            </p>
          </div>
        </div>

        {/* Tabs for Constitution and Father's Lessons */}
        <Tabs defaultValue="constitution" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="constitution" className="text-base">
              📜 {t('constitution.tabs.constitution')}
            </TabsTrigger>
            <TabsTrigger value="lessons" className="text-base">
              📖 {t('constitution.tabs.lessons')}
            </TabsTrigger>
          </TabsList>

          {/* Constitution Tab */}
          <TabsContent value="constitution" className="space-y-8">
            {/* Chapters Grid */}
            <div className="space-y-8 mb-12">
              {chapters.map((chapter, index) => {
                const Icon = chapter.icon;
                return (
                  <Card 
                    key={chapter.number}
                    className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${
                      chapter.highlight 
                        ? 'border-primary/40 bg-gradient-to-br from-primary/5 to-transparent' 
                        : 'border-border/60 hover:border-primary/30'
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                          chapter.highlight 
                            ? 'bg-gradient-to-br from-primary to-primary/60' 
                            : 'bg-primary/10'
                        }`}>
                          <Icon className={`w-7 h-7 ${chapter.highlight ? 'text-primary-foreground' : 'text-primary'}`} />
                        </div>
                        <div>
                          <Badge variant="outline" className="mb-1 text-xs border-primary/30 text-primary">
                            {t('constitution.chapter')} {chapter.number}
                          </Badge>
                          <CardTitle className="text-xl md:text-2xl font-heading font-bold text-elegant-blue">
                            {t(chapter.titleKey)}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                        {t(chapter.contentKey)}
                      </p>
                      
                      {/* FUN Human Standards */}
                      {chapter.standards && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                          {chapter.standards.map((standard, idx) => {
                            const StandardIcon = standard.icon;
                            return (
                              <div 
                                key={idx}
                                className="flex items-start gap-3 p-4 rounded-xl bg-secondary/50 border border-border/50"
                              >
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                  <StandardIcon className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <p className="text-sm text-foreground leading-relaxed">
                                    {t(standard.key)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* 8 Mantras Section */}
            <Card className="overflow-hidden border-primary/40 bg-gradient-to-br from-primary/10 via-background to-primary/5 mb-10">
              <CardHeader className="text-center pb-6">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-primary-foreground" />
                  </div>
                </div>
                <CardTitle className="text-2xl md:text-3xl font-heading font-bold gold-text">
                  🌈 {t('constitution.mantras.title')}
                </CardTitle>
                <p className="text-muted-foreground mt-2">
                  {t('constitution.mantras.subtitle')}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mantras.map((mantraKey, index) => (
                    <div 
                      key={index}
                      className="group relative overflow-hidden rounded-xl border border-primary/20 bg-card/50 p-5 transition-all duration-300 hover:border-primary/40 hover:shadow-md"
                    >
                      <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-primary/10 blur-xl group-hover:bg-primary/20 transition-colors" />
                      <div className="relative flex items-start gap-4">
                        <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                          {index + 1}
                        </span>
                        <p className="text-foreground font-medium leading-relaxed">
                          {t(mantraKey)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Closing Message */}
            <div className="text-center py-12 space-y-4">
              <Separator className="max-w-md mx-auto bg-primary/20" />
              <div className="space-y-2 pt-4">
                <p className="text-lg md:text-xl text-muted-foreground font-medium">
                  {t('constitution.closing.line1')}
                </p>
                <p className="text-lg md:text-xl text-muted-foreground font-medium">
                  {t('constitution.closing.line2')}
                </p>
                <p className="text-2xl md:text-3xl gold-text font-bold pt-2">
                  {t('constitution.closing.line3')}
                </p>
              </div>
              <div className="flex justify-center gap-1 pt-4">
                {[...Array(5)].map((_, i) => (
                  <Sparkles key={i} className="w-5 h-5 text-primary animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Father's Lessons Tab */}
          <TabsContent value="lessons">
            <FatherLessons />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Constitution;
