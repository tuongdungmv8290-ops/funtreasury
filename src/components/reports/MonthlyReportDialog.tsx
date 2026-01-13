import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarDays, FileDown, Loader2 } from 'lucide-react';
import { useMonthlyReport, MonthlyReportOptions } from '@/hooks/useMonthlyReport';
import { toast } from '@/hooks/use-toast';

interface MonthlyReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MONTHS = [
  { value: 1, label: 'Tháng 1' },
  { value: 2, label: 'Tháng 2' },
  { value: 3, label: 'Tháng 3' },
  { value: 4, label: 'Tháng 4' },
  { value: 5, label: 'Tháng 5' },
  { value: 6, label: 'Tháng 6' },
  { value: 7, label: 'Tháng 7' },
  { value: 8, label: 'Tháng 8' },
  { value: 9, label: 'Tháng 9' },
  { value: 10, label: 'Tháng 10' },
  { value: 11, label: 'Tháng 11' },
  { value: 12, label: 'Tháng 12' },
];

const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

export function MonthlyReportDialog({ open, onOpenChange }: MonthlyReportDialogProps) {
  const currentMonth = new Date().getMonth() + 1;
  
  const [options, setOptions] = useState<MonthlyReportOptions>({
    month: currentMonth,
    year: currentYear,
    includeTransactions: true,
  });

  const { generateMonthlyReport, isGenerating } = useMonthlyReport();

  const handleGenerate = async () => {
    try {
      await generateMonthlyReport(options);
      toast({
        title: '✅ Xuất báo cáo thành công!',
        description: `Báo cáo tháng ${options.month}/${options.year} đã được tải xuống.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Lỗi xuất báo cáo',
        description: 'Không thể xuất báo cáo. Vui lòng thử lại.',
        variant: 'destructive',
      });
    }
  };

  const monthLabel = MONTHS.find(m => m.value === options.month)?.label || '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-xl tracking-wide">
            <CalendarDays className="w-5 h-5 text-treasury-gold" />
            Báo cáo theo tháng
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Month & Year Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tháng</Label>
              <Select
                value={options.month.toString()}
                onValueChange={(value) =>
                  setOptions({ ...options, month: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn tháng" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Năm</Label>
              <Select
                value={options.year.toString()}
                onValueChange={(value) =>
                  setOptions({ ...options, year: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn năm" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tùy chọn</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeTransactions"
                checked={options.includeTransactions}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, includeTransactions: checked === true })
                }
              />
              <label
                htmlFor="includeTransactions"
                className="text-sm cursor-pointer"
              >
                Bao gồm danh sách giao dịch
              </label>
            </div>
          </div>

          {/* Preview info */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="text-muted-foreground">
              Báo cáo sẽ bao gồm:
            </p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>• Tổng Inflow/Outflow/Net Flow Treasury</li>
              <li>• Chi tiết theo từng ví (CAMLY + USDT)</li>
              <li>• Số lượng giao dịch theo hướng</li>
              {options.includeTransactions && (
                <li>• Danh sách giao dịch trong tháng</li>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="gap-2 bg-gradient-to-r from-treasury-gold to-treasury-gold-dark hover:from-treasury-gold-dark hover:to-treasury-gold text-white"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            Xuất báo cáo {monthLabel}/{options.year}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
