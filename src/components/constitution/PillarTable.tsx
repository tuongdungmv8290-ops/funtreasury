import { useTranslation } from 'react-i18next';
import { CheckCircle, Heart, Eye, Sparkles } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const PillarTable = () => {
  const { t } = useTranslation();

  const pillars = [
    {
      icon: CheckCircle,
      nameKey: 'constitution.lessons.pillars.truth.name',
      meaningKey: 'constitution.lessons.pillars.truth.meaning',
      applicationKey: 'constitution.lessons.pillars.truth.application',
    },
    {
      icon: Heart,
      nameKey: 'constitution.lessons.pillars.sincerity.name',
      meaningKey: 'constitution.lessons.pillars.sincerity.meaning',
      applicationKey: 'constitution.lessons.pillars.sincerity.application',
    },
    {
      icon: Eye,
      nameKey: 'constitution.lessons.pillars.awareness.name',
      meaningKey: 'constitution.lessons.pillars.awareness.meaning',
      applicationKey: 'constitution.lessons.pillars.awareness.application',
    },
    {
      icon: Sparkles,
      nameKey: 'constitution.lessons.pillars.purity.name',
      meaningKey: 'constitution.lessons.pillars.purity.meaning',
      applicationKey: 'constitution.lessons.pillars.purity.application',
    },
  ];

  return (
    <div className="pl-14 pt-4">
      <h4 className="text-sm font-semibold text-primary uppercase tracking-wide mb-3">
        {t('constitution.lessons.pillars.title')}
      </h4>
      <div className="rounded-xl border border-primary/20 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary/10 hover:bg-primary/10">
              <TableHead className="text-primary font-semibold w-[150px]">
                {t('constitution.lessons.pillars.headerPillar')}
              </TableHead>
              <TableHead className="text-primary font-semibold">
                {t('constitution.lessons.pillars.headerMeaning')}
              </TableHead>
              <TableHead className="text-primary font-semibold">
                {t('constitution.lessons.pillars.headerApplication')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pillars.map((pillar, index) => {
              const Icon = pillar.icon;
              return (
                <TableRow key={index} className="hover:bg-primary/5">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-primary" />
                      <span>{t(pillar.nameKey)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {t(pillar.meaningKey)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {t(pillar.applicationKey)}
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

export default PillarTable;
