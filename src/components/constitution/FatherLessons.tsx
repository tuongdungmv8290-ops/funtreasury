import { useTranslation } from 'react-i18next';
import { BookOpen, Lightbulb, GraduationCap, MessageCircle, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import PillarTable from './PillarTable';
import IncomeLevelsTable from './IncomeLevelsTable';
import MantraMeanings from './MantraMeanings';
import TreasuryConnection from './TreasuryConnection';
import FatherMessage from './FatherMessage';

const FatherLessons = () => {
  const { t } = useTranslation();

  const lessons = [
    {
      id: 'lesson1',
      number: 'I',
      titleKey: 'constitution.lessons.chapter1.title',
      contentKey: 'constitution.lessons.chapter1.content',
      lessonKey: 'constitution.lessons.chapter1.lesson',
    },
    {
      id: 'lesson2',
      number: 'II',
      titleKey: 'constitution.lessons.chapter2.title',
      contentKey: 'constitution.lessons.chapter2.content',
      lessonKey: 'constitution.lessons.chapter2.lesson',
      showPillarTable: true,
    },
    {
      id: 'lesson3',
      number: 'III',
      titleKey: 'constitution.lessons.chapter3.title',
      contentKey: 'constitution.lessons.chapter3.content',
      lessonKey: 'constitution.lessons.chapter3.lesson',
      showIncomeTable: true,
    },
    {
      id: 'lesson4',
      number: 'IV',
      titleKey: 'constitution.lessons.chapter4.title',
      contentKey: 'constitution.lessons.chapter4.content',
      lessonKey: 'constitution.lessons.chapter4.lesson',
    },
    {
      id: 'lesson5',
      number: 'V',
      titleKey: 'constitution.lessons.chapter5.title',
      contentKey: 'constitution.lessons.chapter5.content',
      lessonKey: 'constitution.lessons.chapter5.lesson',
    },
    {
      id: 'lesson6',
      number: 'VI',
      titleKey: 'constitution.lessons.chapter6.title',
      contentKey: 'constitution.lessons.chapter6.content',
      lessonKey: 'constitution.lessons.chapter6.lesson',
    },
    {
      id: 'lesson7',
      number: 'VII',
      titleKey: 'constitution.lessons.chapter7.title',
      contentKey: 'constitution.lessons.chapter7.content',
      lessonKey: 'constitution.lessons.chapter7.lesson',
    },
    {
      id: 'lesson8',
      number: 'VIII',
      titleKey: 'constitution.lessons.chapter8.title',
      contentKey: 'constitution.lessons.chapter8.content',
      lessonKey: 'constitution.lessons.chapter8.lesson',
    },
  ];

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <Card className="overflow-hidden border-primary/40 bg-gradient-to-br from-primary/15 via-background to-primary/5">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
              <GraduationCap className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          <Badge variant="outline" className="mx-auto border-primary/50 text-primary px-4 py-1.5 text-sm font-semibold mb-3">
            📖 {t('constitution.lessons.badge')}
          </Badge>
          <CardTitle className="text-3xl md:text-4xl font-heading font-bold gold-text">
            {t('constitution.lessons.title')}
          </CardTitle>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto leading-relaxed">
            {t('constitution.lessons.intro')}
          </p>
        </CardHeader>
      </Card>

      {/* Lessons Accordion */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-xl md:text-2xl font-heading">
              {t('constitution.lessons.chaptersTitle')}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full space-y-3">
            {lessons.map((lesson) => (
              <AccordionItem 
                key={lesson.id} 
                value={lesson.id}
                className="border border-border/50 rounded-xl px-4 data-[state=open]:border-primary/30 data-[state=open]:bg-primary/5 transition-all"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {lesson.number}
                    </span>
                    <span className="text-left font-semibold text-elegant-blue">
                      {t(lesson.titleKey)}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6 pt-2 space-y-4">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line pl-14">
                    {t(lesson.contentKey)}
                  </p>
                  
                  {lesson.showPillarTable && <PillarTable />}
                  {lesson.showIncomeTable && <IncomeLevelsTable />}
                  
                  <div className="pl-14 pt-2">
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20">
                      <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                          {t('constitution.lessons.lessonLabel')}
                        </span>
                        <p className="text-foreground font-medium leading-relaxed mt-1">
                          {t(lesson.lessonKey)}
                        </p>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Mantra Meanings Section */}
      <MantraMeanings />

      {/* Treasury Connection Section */}
      <TreasuryConnection />

      {/* Father's Message */}
      <FatherMessage />
    </div>
  );
};

export default FatherLessons;
