import { Button } from '@/components/ui/button';
import { ExternalLink, Table2 } from 'lucide-react';
import { toast } from 'sonner';

export const ManualSheetSection = () => {
  const handleOpenSheet = () => {
    window.open('https://docs.google.com/spreadsheets/d/1KePMTNAyHd1rCKEgiQ2f7HyGcPNQmhgzh9CkomsaYyc/edit?usp=sharing', '_blank');
    toast.success('📊 Đã mở Bảng Thủ Công trên Google Sheets!', { duration: 3000 });
  };

  return (
    <div className="treasury-card bg-white">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-treasury-gold to-treasury-gold-dark flex items-center justify-center shadow-lg">
          <Table2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold gold-text">📊 Bảng Thủ Công</h2>
          <p className="text-sm text-muted-foreground">Quản lý giao dịch thủ công trực tiếp trên Google Sheets</p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-gradient-to-r from-treasury-gold/10 to-treasury-gold/5 border border-treasury-gold/30">
        <p className="text-sm text-muted-foreground mb-4">
          Nhấn nút bên dưới để mở Google Sheets và nhập giao dịch thủ công. Dữ liệu sẽ được đồng bộ với hệ thống.
        </p>
        <Button
          className="gap-2 bg-gradient-to-r from-treasury-gold to-treasury-gold-dark hover:from-treasury-gold-dark hover:to-treasury-gold text-white font-semibold shadow-lg hover:shadow-xl transition-all px-6"
          onClick={handleOpenSheet}
        >
          <ExternalLink className="w-4 h-4" />
          Mở Google Sheets
        </Button>
      </div>
    </div>
  );
};
