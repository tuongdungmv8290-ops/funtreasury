import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const MantraMeanings = () => {
  const { t } = useTranslation();

  const mantras = [
    {
      number: 1,
      mantraKey: 'constitution.lessons.mantraMeanings.1.mantra',
      meaningKey: 'constitution.lessons.mantraMeanings.1.meaning',
      detailKey: 'constitution.lessons.mantraMeanings.1.detail',
    },
    {
      number: 2,
      mantraKey: 'constitution.lessons.mantraMeanings.2.mantra',
      meaningKey: 'constitution.lessons.mantraMeanings.2.meaning',
      detailKey: 'constitution.lessons.mantraMeanings.2.detail',
    },
    {
      number: 3,
      mantraKey: 'constitution.lessons.mantraMeanings.3.mantra',
      meaningKey: 'constitution.lessons.mantraMeanings.3.meaning',
      detailKey: 'constitution.lessons.mantraMeanings.3.detail',
    },
    {
      number: 4,
      mantraKey: 'constitution.lessons.mantraMeanings.4.mantra',
      meaningKey: 'constitution.lessons.mantraMeanings.4.meaning',
      detailKey: 'constitution.lessons.mantraMeanings.4.detail',
    },
    {
      number: 5,
      mantraKey: 'constitution.lessons.mantraMeanings.5.mantra',
      meaningKey: 'constitution.lessons.mantraMeanings.5.meaning',
      detailKey: 'constitution.lessons.mantraMeanings.5.detail',
    },
    {
      number: 6,
      mantraKey: 'constitution.lessons.mantraMeanings.6.mantra',
      meaningKey: 'constitution.lessons.mantraMeanings.6.meaning',
      detailKey: 'constitution.lessons.mantraMeanings.6.detail',
    },
    {
      number: 7,
      mantraKey: 'constitution.lessons.mantraMeanings.7.mantra',
      meaningKey: 'constitution.lessons.mantraMeanings.7.meaning',
      detailKey: 'constitution.lessons.mantraMeanings.7.detail',
    },
    {
      number: 8,
      mantraKey: 'constitution.lessons.mantraMeanings.8.mantra',
      meaningKey: 'constitution.lessons.mantraMeanings.8.meaning',
      detailKey: 'constitution.lessons.mantraMeanings.8.detail',
    },
  ];

  return (
    <Card className="border-primary/30 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl md:text-2xl font-heading">
              {t('constitution.lessons.mantraMeanings.title')}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {t('constitution.lessons.mantraMeanings.subtitle')}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="rounded-xl border border-primary/20 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/10 hover:bg-primary/10">
                <TableHead className="text-primary font-semibold w-[50px] text-center">
                  #
                </TableHead>
                <TableHead className="text-primary font-semibold">
                  {t('constitution.lessons.mantraMeanings.headerMantra')}
                </TableHead>
                <TableHead className="text-primary font-semibold w-[150px]">
                  {t('constitution.lessons.mantraMeanings.headerMeaning')}
                </TableHead>
                <TableHead className="text-primary font-semibold">
                  {t('constitution.lessons.mantraMeanings.headerDetail')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mantras.map((mantra) => (
                <TableRow key={mantra.number} className="hover:bg-primary/5">
                  <TableCell className="text-center">
                    <span className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm mx-auto">
                      {mantra.number}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {t(mantra.mantraKey)}
                  </TableCell>
                  <TableCell className="text-primary font-semibold">
                    {t(mantra.meaningKey)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {t(mantra.detailKey)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default MantraMeanings;
