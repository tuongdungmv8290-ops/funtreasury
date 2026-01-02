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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, FileDown, Filter, Loader2 } from 'lucide-react';
import { format, subDays } from 'date-fns';

export interface ReportFilters {
  startDate: string;
  endDate: string;
  tokenSymbol: string;
  direction: 'ALL' | 'IN' | 'OUT';
  limit: number;
}

interface ReportFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (filters: ReportFilters) => void;
  isGenerating: boolean;
  availableTokens: string[];
}

export function ReportFilterDialog({
  open,
  onOpenChange,
  onGenerate,
  isGenerating,
  availableTokens,
}: ReportFilterDialogProps) {
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    tokenSymbol: 'ALL',
    direction: 'ALL',
    limit: 50,
  });

  const handleGenerate = () => {
    onGenerate(filters);
  };

  const presetDates = [
    { label: '7 ngày', days: 7 },
    { label: '30 ngày', days: 30 },
    { label: '90 ngày', days: 90 },
    { label: '1 năm', days: 365 },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5 text-treasury-gold" />
            Tùy chọn báo cáo PDF
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Date Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Khoảng thời gian
            </Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {presetDates.map((preset) => (
                <Button
                  key={preset.days}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() =>
                    setFilters({
                      ...filters,
                      startDate: format(subDays(new Date(), preset.days), 'yyyy-MM-dd'),
                      endDate: format(new Date(), 'yyyy-MM-dd'),
                    })
                  }
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Từ ngày</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters({ ...filters, startDate: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Đến ngày</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters({ ...filters, endDate: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Token Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Token</Label>
            <Select
              value={filters.tokenSymbol}
              onValueChange={(value) =>
                setFilters({ ...filters, tokenSymbol: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn token" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả tokens</SelectItem>
                {availableTokens.map((token) => (
                  <SelectItem key={token} value={token}>
                    {token}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Direction Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Loại giao dịch</Label>
            <Select
              value={filters.direction}
              onValueChange={(value: 'ALL' | 'IN' | 'OUT') =>
                setFilters({ ...filters, direction: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả (IN + OUT)</SelectItem>
                <SelectItem value="IN">
                  <span className="text-green-500">↓ IN</span> - Giao dịch nhận
                </SelectItem>
                <SelectItem value="OUT">
                  <span className="text-red-500">↑ OUT</span> - Giao dịch gửi
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Limit */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Số giao dịch tối đa</Label>
            <Select
              value={filters.limit.toString()}
              onValueChange={(value) =>
                setFilters({ ...filters, limit: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Số lượng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20 giao dịch</SelectItem>
                <SelectItem value="50">50 giao dịch</SelectItem>
                <SelectItem value="100">100 giao dịch</SelectItem>
                <SelectItem value="200">200 giao dịch</SelectItem>
              </SelectContent>
            </Select>
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
            Xuất PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
