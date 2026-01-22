import { useTranslation } from 'react-i18next';
import { TrendingUp, Waves, Expand } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const IncomeLevelsTable = () => {
  const { t } = useTranslation();

  const levels = [
    {
      icon: TrendingUp,
      livingKey: 'constitution.lessons.incomeLevels.level1.living',
      resultKey: 'constitution.lessons.incomeLevels.level1.result',
    },
    {
      icon: Waves,
      livingKey: 'constitution.lessons.incomeLevels.level2.living',
      resultKey: 'constitution.lessons.incomeLevels.level2.result',
    },
    {
      icon: Expand,
      livingKey: 'constitution.lessons.incomeLevels.level3.living',
      resultKey: 'constitution.lessons.incomeLevels.level3.result',
    },
  ];

  return (
    <div className="pl-14 pt-4">
      <h4 className="text-sm font-semibold text-primary uppercase tracking-wide mb-3">
        {t('constitution.lessons.incomeLevels.title')}
      </h4>
      <div className="rounded-xl border border-primary/20 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary/10 hover:bg-primary/10">
              <TableHead className="text-primary font-semibold">
                {t('constitution.lessons.incomeLevels.headerLiving')}
              </TableHead>
              <TableHead className="text-primary font-semibold">
                {t('constitution.lessons.incomeLevels.headerResult')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {levels.map((level, index) => {
              const Icon = level.icon;
              return (
                <TableRow key={index} className="hover:bg-primary/5">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-primary" />
                      <span>{t(level.livingKey)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {t(level.resultKey)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default IncomeLevelsTable;
