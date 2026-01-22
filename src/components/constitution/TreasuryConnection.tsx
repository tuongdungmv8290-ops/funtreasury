import { useTranslation } from 'react-i18next';
import { Link } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const TreasuryConnection = () => {
  const { t } = useTranslation();

  const connections = [
    {
      constitutionKey: 'constitution.lessons.treasuryConnection.row1.constitution',
      treasuryKey: 'constitution.lessons.treasuryConnection.row1.treasury',
    },
    {
      constitutionKey: 'constitution.lessons.treasuryConnection.row2.constitution',
      treasuryKey: 'constitution.lessons.treasuryConnection.row2.treasury',
    },
    {
      constitutionKey: 'constitution.lessons.treasuryConnection.row3.constitution',
      treasuryKey: 'constitution.lessons.treasuryConnection.row3.treasury',
    },
    {
      constitutionKey: 'constitution.lessons.treasuryConnection.row4.constitution',
      treasuryKey: 'constitution.lessons.treasuryConnection.row4.treasury',
    },
  ];

  return (
    <Card className="border-primary/30 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Link className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl md:text-2xl font-heading">
              💡 {t('constitution.lessons.treasuryConnection.title')}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {t('constitution.lessons.treasuryConnection.subtitle')}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="rounded-xl border border-primary/20 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/10 hover:bg-primary/10">
                <TableHead className="text-primary font-semibold">
                  {t('constitution.lessons.treasuryConnection.headerConstitution')}
                </TableHead>
                <TableHead className="text-primary font-semibold">
                  {t('constitution.lessons.treasuryConnection.headerTreasury')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {connections.map((connection, index) => (
                <TableRow key={index} className="hover:bg-primary/5">
                  <TableCell className="font-medium text-foreground">
                    {t(connection.constitutionKey)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {t(connection.treasuryKey)}
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

export default TreasuryConnection;
