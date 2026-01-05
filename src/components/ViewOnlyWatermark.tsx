import { Eye } from 'lucide-react';
import { useViewMode } from '@/contexts/ViewModeContext';

export const ViewOnlyWatermark = () => {
  const { isViewOnly } = useViewMode();

  if (!isViewOnly) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 pointer-events-none">
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100/90 border border-amber-300/50 shadow-lg backdrop-blur-sm">
        <Eye className="w-4 h-4 text-amber-600" />
        <span className="text-sm font-medium text-amber-700">Chế độ Chỉ Xem</span>
      </div>
    </div>
  );
};
