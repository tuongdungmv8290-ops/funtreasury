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
      toast.info('🔒 Chế độ Chỉ Xem - Vui lòng đăng nhập để truy cập Google Sheets', { duration: 3000 });
      return;
    }
    window.open('https://docs.google.com/spreadsheets/d/1KePMTNAyHd1rCKEgiQ2f7HyGcPNQmhgzh9CkomsaYyc/edit?usp=sharing', '_blank');
    toast.success('📊 Đã mở Bảng Thủ Công trên Google Sheets!', { duration: 3000 });
  };

  return (
    <div className={`treasury-card bg-white ${isReadOnly ? 'opacity-90' : ''}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-treasury-gold to-treasury-gold-dark flex items-center justify-center shadow-lg">
          <Table2 className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold gold-text">📊 Bảng Thủ Công</h2>
          <p className="text-sm text-muted-foreground">Quản lý giao dịch thủ công trực tiếp trên Google Sheets</p>
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
            ? 'Đây là khu vực quản lý giao dịch thủ công. Đăng nhập để truy cập đầy đủ.'
            : 'Nhấn nút bên dưới để mở Google Sheets và nhập giao dịch thủ công. Dữ liệu sẽ được đồng bộ với hệ thống.'
          }
        </p>
        <Button
          className={`gap-2 font-semibold shadow-lg transition-all px-6 ${
            isReadOnly 
              ? 'bg-gray-400 cursor-not-allowed opacity-60' 
              : 'bg-gradient-to-r from-treasury-gold to-treasury-gold-dark hover:from-treasury-gold-dark hover:to-treasury-gold text-white hover:shadow-xl'
          }`}
          onClick={handleOpenSheet}
          disabled={isReadOnly}
        >
          <ExternalLink className="w-4 h-4" />
          Mở Google Sheets
        </Button>
      </div>
    </div>
  );
};
