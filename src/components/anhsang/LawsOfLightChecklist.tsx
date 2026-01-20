import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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

const STORAGE_KEY = "anhsang_laws_checked";
const DATE_KEY = "anhsang_laws_date";

const LawsOfLightChecklist = () => {
  const { t } = useTranslation();
  
  const lawsOfLight = t('anhsang.laws.list', { returnObjects: true }) as string[];
  const userCharacteristics = t('anhsang.laws.usersSection.characteristics', { returnObjects: true }) as string[];
  const negativeTraits = t('anhsang.laws.coreSection.negativeTraits', { returnObjects: true }) as string[];
  const notBelongList = t('anhsang.laws.notBelongSection.list', { returnObjects: true }) as string[];
  const beneficiaryList = t('anhsang.laws.beneficiarySection.list', { returnObjects: true }) as string[];
  const corePrinciples = t('anhsang.laws.coreSection.principles', { returnObjects: true }) as string[];
  const ecosystemDefinitions = t('anhsang.laws.ecosystemSection.definitions', { returnObjects: true }) as string[];

  const corePrinciplesWithIcons = [
    { icon: Sun, text: corePrinciples[0] },
    { icon: Shield, text: corePrinciples[1] },
    { icon: Heart, text: corePrinciples[2] }
  ];

  const ecosystemDefinitionsWithIcons = [
    { icon: Users, text: ecosystemDefinitions[0] },
    { icon: Shield, text: ecosystemDefinitions[1] },
    { icon: Heart, text: ecosystemDefinitions[2] },
    { icon: Globe, text: ecosystemDefinitions[3] }
  ];

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
            {t('anhsang.laws.heroTitle')}
          </h1>
          <Star className="w-8 h-8 text-primary animate-pulse" fill="currentColor" />
        </div>
        <p className="font-heading text-xl md:text-2xl text-primary/80 font-semibold">
          {t('anhsang.laws.heroSubtitle')}
        </p>
      </div>

      {/* Users của FUN Ecosystem Section */}
      <Card className="p-6 md:p-8 bg-gradient-to-br from-primary/5 via-card to-primary/10 border-primary/30">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-xl md:text-2xl font-bold text-primary">
                {t('anhsang.laws.usersSection.title')}
              </h2>
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <p className="font-body text-sm md:text-base text-muted-foreground">
              {t('anhsang.laws.usersSection.subtitle')}
            </p>
          </div>

          <div className="space-y-4 text-center">
            <p className="font-body text-foreground/90 italic">
              {t('anhsang.laws.usersSection.intro1')}
            </p>
            <p className="font-body text-foreground font-medium">
              {t('anhsang.laws.usersSection.intro2')}
            </p>
          </div>

          {/* Bạn là ai? */}
          <div className="space-y-4">
            <h3 className="font-heading text-lg font-semibold text-primary flex items-center gap-2">
              <Heart className="w-5 h-5" />
              {t('anhsang.laws.usersSection.whoAreYou')}
            </h3>
            <p className="font-body text-muted-foreground">
              {t('anhsang.laws.usersSection.usersAre')}
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
              <p className="font-body text-foreground/80 italic whitespace-pre-line">
                {t('anhsang.laws.usersSection.imperfect')}
              </p>
              <p className="font-body text-primary font-semibold pt-2">
                👉 {t('anhsang.laws.usersSection.attract')}
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
              {t('anhsang.laws.coreSection.title')}
            </h2>
            <p className="font-body text-sm text-muted-foreground mt-2">
              {t('anhsang.laws.coreSection.subtitle')}
            </p>
          </div>

          {/* 3 Principles */}
          <div className="grid md:grid-cols-3 gap-4">
            {corePrinciplesWithIcons.map((principle, index) => (
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
              {t('anhsang.laws.coreSection.warningIntro')}{" "}
              <span className="text-destructive/80 font-medium">
                {negativeTraits.join(" • ")}
              </span>
            </p>
            <p className="font-body text-sm text-foreground/80 mt-2">
              👉 {t('anhsang.laws.coreSection.warningConsequence')}
            </p>
            <p className="font-body text-sm text-muted-foreground italic mt-3 text-center whitespace-pre-line">
              {t('anhsang.laws.coreSection.warningNote')}
            </p>
          </Card>
        </div>
      </Card>

      {/* Ai KHÔNG thuộc về Section */}
      <Card className="p-6 md:p-8 bg-card border-border/50">
        <div className="space-y-4">
          <h2 className="font-heading text-lg md:text-xl font-bold text-foreground/80 flex items-center gap-2">
            🚪 {t('anhsang.laws.notBelongSection.title')}
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
            👉 {t('anhsang.laws.notBelongSection.note')}
          </p>
        </div>
      </Card>

      {/* Ai ĐƯỢC hưởng lợi Section */}
      <Card className="p-6 md:p-8 bg-gradient-to-br from-card to-primary/5 border-primary/30">
        <div className="space-y-4">
          <h2 className="font-heading text-lg md:text-xl font-bold text-primary flex items-center gap-2">
            🌈 {t('anhsang.laws.beneficiarySection.title')}
          </h2>
          <p className="font-body text-muted-foreground">{t('anhsang.laws.beneficiarySection.intro')}</p>
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
              👉 {t('anhsang.laws.beneficiarySection.benefit1')}
            </p>
            <p className="font-body text-sm text-primary font-medium">
              👉 {t('anhsang.laws.beneficiarySection.benefit2')}
            </p>
          </div>
        </div>
      </Card>

      {/* FUN Ecosystem là gì Section */}
      <Card className="p-6 md:p-8 bg-card border-primary/20">
        <div className="space-y-6">
          <h2 className="font-heading text-xl md:text-2xl font-bold text-primary text-center flex items-center justify-center gap-2">
            🌍 {t('anhsang.laws.ecosystemSection.title')}
          </h2>
          <p className="font-body text-muted-foreground text-center">{t('anhsang.laws.ecosystemSection.intro')}</p>
          
          <div className="grid md:grid-cols-2 gap-4">
            {ecosystemDefinitionsWithIcons.map((def, index) => (
              <Card key={index} className="p-4 bg-primary/5 border-primary/20 flex items-center gap-3">
                <def.icon className="w-6 h-6 text-primary flex-shrink-0" />
                <p className="font-body text-sm md:text-base text-foreground">{def.text}</p>
              </Card>
            ))}
          </div>

          <div className="text-center space-y-1 pt-2">
            <p className="font-body text-foreground/80">{t('anhsang.laws.ecosystemSection.noDrama')}</p>
            <p className="font-body text-foreground/80">{t('anhsang.laws.ecosystemSection.noManipulation')}</p>
            <p className="font-body text-foreground/80">{t('anhsang.laws.ecosystemSection.noCompetition')}</p>
            <p className="font-body text-primary font-semibold pt-2">
              {t('anhsang.laws.ecosystemSection.onlyLove')}
            </p>
          </div>
        </div>
      </Card>

      {/* Thông Điệp Từ Cha Section */}
      <Card className="p-6 md:p-8 bg-gradient-to-br from-primary/10 via-card to-primary/5 border-2 border-primary/40 shadow-lg">
        <div className="text-center space-y-6">
          <Quote className="w-10 h-10 text-primary mx-auto" />
          <h2 className="font-heading text-lg md:text-xl font-bold text-primary">
            🔑 {t('anhsang.laws.fatherMessage.title')}
          </h2>
          <blockquote className="font-serif text-lg md:text-xl lg:text-2xl text-foreground italic leading-relaxed whitespace-pre-line">
            {t('anhsang.laws.fatherMessage.quote')}
          </blockquote>
          <p className="font-heading text-primary font-bold text-lg">
            {t('anhsang.laws.fatherMessage.signature')}
          </p>
        </div>
      </Card>

      {/* Checklist Section */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="font-heading text-xl md:text-2xl font-bold text-primary flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6" />
            {t('anhsang.laws.checklistTitle')}
            <Sparkles className="w-6 h-6" />
          </h2>
          <p className="font-body text-sm text-muted-foreground mt-2">
            {t('anhsang.laws.checklistDesc')}
          </p>
        </div>

        {/* Progress */}
        <Card className="p-4 bg-card/50 border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="font-body text-sm text-muted-foreground">
              {t('anhsang.laws.progressToday')}
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
                {t('anhsang.laws.completed')}
              </span>
              <Sparkles className="w-4 h-4" />
            </div>
          )}
        </Card>

        {/* Checklist Items */}
        <Card className="p-6 md:p-8 bg-gradient-to-br from-card via-card to-primary/5 border-primary/30 shadow-lg">
          <div className="space-y-4">
            {lawsOfLight.map((law, index) => {
              const isChecked = checkedLaws.includes(index + 1);
              return (
                <div
                  key={index}
                  className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all duration-300 ${
                    isChecked 
                      ? 'bg-primary/10 border border-primary/40' 
                      : 'bg-card/50 border border-border/30 hover:border-primary/30 hover:bg-card/80'
                  }`}
                  onClick={() => toggleLaw(index + 1)}
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggleLaw(index + 1)}
                    className="w-6 h-6 border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <span className={`font-body text-base md:text-lg flex-1 transition-colors ${
                    isChecked ? 'text-primary font-medium' : 'text-foreground'
                  }`}>
                    {law}
                  </span>
                  {isChecked && (
                    <Check className="w-5 h-5 text-primary animate-scale-in" />
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6 pt-4 border-t border-primary/20 italic">
            {t('anhsang.laws.clickToConfirm')}
          </p>
        </Card>
      </div>
    </section>
  );
};

export default LawsOfLightChecklist;