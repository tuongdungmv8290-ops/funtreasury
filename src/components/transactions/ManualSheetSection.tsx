import { Button } from '@/components/ui/button';
import { ExternalLink, Table2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useViewMode } from '@/contexts/ViewModeContext';

interface ManualSheetSectionProps {
  viewOnly?: boolean;
}

export const ManualSheetSection = ({ viewOnly = false }: ManualSheetSectionProps) => {
  const { isViewOnly: contextViewOnly } = useViewMode();
  const isReadOnly = viewOnly || contextViewOnly;

  const handleOpenSheet = () => {
    if (isReadOnly) {
      // Khách mở ở chế độ VIEW ONLY
      window.open('https://docs.google.com/spreadsheets/d/1KePMTNAyHd1rCKEgiQ2f7HyGcPNQmhgzh9CkomsaYyc/view', '_blank');
      toast.info('👁️ Đang mở Bảng Thủ Công ở chế độ Chỉ Xem', { duration: 3000 });
    } else {
      // Admin mở chế độ EDIT
      window.open('https://docs.google.com/spreadsheets/d/1KePMTNAyHd1rCKEgiQ2f7HyGcPNQmhgzh9CkomsaYyc/edit?usp=sharing', '_blank');
      toast.success('📊 Đã mở Bảng Thủ Công trên Google Sheets!', { duration: 3000 });
    }
  };

  return (
    <div className={`treasury-card bg-white ${isReadOnly ? 'opacity-90' : ''}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-treasury-gold to-treasury-gold-dark flex items-center justify-center shadow-lg">
          <Table2 className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="font-heading text-xl font-bold tracking-wide gold-text">📊 Bảng Thủ Công</h2>
          <p className="font-body text-sm text-muted-foreground">Quản lý giao dịch thủ công trực tiếp trên Google Sheets</p>
        </div>
        {isReadOnly && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
            <Eye className="w-3 h-3" />
            Chỉ xem
          </div>
        )}
      </div>

      <div className="p-4 rounded-xl bg-gradient-to-r from-treasury-gold/10 to-treasury-gold/5 border border-treasury-gold/30">
        <p className="text-sm text-muted-foreground mb-4">
          {isReadOnly 
            ? 'Nhấn nút bên dưới để xem Bảng Thủ Công Treasury (chỉ xem, không chỉnh sửa được).'
            : 'Nhấn nút bên dưới để mở Google Sheets và nhập giao dịch thủ công. Dữ liệu sẽ được đồng bộ với hệ thống.'
          }
        </p>
        <Button
          className={`gap-2 font-semibold shadow-lg transition-all px-6 ${
            isReadOnly 
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white hover:shadow-xl' 
              : 'bg-gradient-to-r from-treasury-gold to-treasury-gold-dark hover:from-treasury-gold-dark hover:to-treasury-gold text-white hover:shadow-xl'
          }`}
          onClick={handleOpenSheet}
        >
          <ExternalLink className="w-4 h-4" />
          {isReadOnly ? 'Xem Google Sheets' : 'Mở Google Sheets'}
        </Button>
      </div>
    </div>
  );
};
