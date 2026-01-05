import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, Bell, Save, RefreshCw, Eye } from 'lucide-react';
import { useTransactionAlerts } from '@/hooks/useTransactionAlerts';
import { useViewMode } from '@/contexts/ViewModeContext';

interface TransactionAlertsSectionProps {
  viewOnly?: boolean;
}

export const TransactionAlertsSection = ({ viewOnly = false }: TransactionAlertsSectionProps) => {
  const { isViewOnly: contextViewOnly } = useViewMode();
  const isReadOnly = viewOnly || contextViewOnly;
  const { alertConfig, isLoading, updateAlert, isUpdating } = useTransactionAlerts();
  
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState('100');
  const [alertDirection, setAlertDirection] = useState('all');
  const [alertToken, setAlertToken] = useState('all');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from database
  useEffect(() => {
    if (alertConfig && !isInitialized) {
      setAlertEnabled(alertConfig.enabled);
      setAlertThreshold(String(alertConfig.threshold_usd));
      setAlertDirection(alertConfig.direction);
      setAlertToken(alertConfig.token_symbol || 'all');
      setIsInitialized(true);
    }
  }, [alertConfig, isInitialized]);

  const handleSaveAlerts = () => {
    updateAlert({
      enabled: alertEnabled,
      threshold_usd: parseFloat(alertThreshold) || 100,
      direction: alertDirection,
      token_symbol: alertToken === 'all' ? null : alertToken
    });
  };

  if (isLoading) {
    return (
      <div className="treasury-card bg-white">
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
        </div>
      </div>
    );
  }

  return (
    <div className={`treasury-card bg-white ${isReadOnly ? 'opacity-90' : ''}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-sm">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-foreground">Transaction Alerts</h2>
          <p className="text-sm text-muted-foreground">Cảnh báo khi có giao dịch lớn (Bước 7.4)</p>
        </div>
        {isReadOnly && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
            <Eye className="w-3 h-3" />
            Chỉ xem
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Enable/Disable Alert */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20">
          <div>
            <Label htmlFor="alertEnabled" className="text-foreground font-medium">Enable Transaction Alerts</Label>
            <p className="text-sm text-muted-foreground">
              Nhận thông báo khi có giao dịch vượt ngưỡng
            </p>
          </div>
          <Switch
            id="alertEnabled"
            checked={alertEnabled}
            onCheckedChange={setAlertEnabled}
            disabled={isReadOnly}
            className="data-[state=checked]:bg-amber-500"
          />
        </div>

        {/* Threshold */}
        <div className="space-y-2">
          <Label htmlFor="alertThreshold" className="text-foreground font-medium">
            Ngưỡng cảnh báo (USD)
          </Label>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-amber-500">$</span>
            <Input
              id="alertThreshold"
              type="number"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(e.target.value)}
              placeholder="100"
              disabled={!alertEnabled || isReadOnly}
              className="w-40 bg-white border-border focus:border-amber-500 focus:ring-amber-500/20 shadow-sm text-lg font-bold disabled:opacity-50"
            />
            <span className="text-sm text-muted-foreground">
              Chỉ cảnh báo giao dịch &gt; ${alertThreshold || '100'}
            </span>
          </div>
        </div>

        {/* Direction Filter */}
        <div className="space-y-2">
          <Label htmlFor="alertDirection" className="text-foreground font-medium">
            Loại giao dịch
          </Label>
          <Select value={alertDirection} onValueChange={setAlertDirection} disabled={!alertEnabled || isReadOnly}>
            <SelectTrigger className="w-full md:w-[200px] bg-white border-border hover:border-amber-500/50 transition-colors shadow-sm disabled:opacity-50">
              <SelectValue placeholder="Chọn loại" />
            </SelectTrigger>
            <SelectContent className="bg-white border-border shadow-lg z-50">
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  Tất cả (IN + OUT)
                </div>
              </SelectItem>
              <SelectItem value="in">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-inflow"></span>
                  Chỉ nhận (IN)
                </div>
              </SelectItem>
              <SelectItem value="out">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-outflow"></span>
                  Chỉ chuyển (OUT)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Token Filter */}
        <div className="space-y-2">
          <Label htmlFor="alertToken" className="text-foreground font-medium">
            Token cụ thể
          </Label>
          <Select value={alertToken} onValueChange={setAlertToken} disabled={!alertEnabled || isReadOnly}>
            <SelectTrigger className="w-full md:w-[200px] bg-white border-border hover:border-amber-500/50 transition-colors shadow-sm disabled:opacity-50">
              <SelectValue placeholder="Chọn token" />
            </SelectTrigger>
            <SelectContent className="bg-white border-border shadow-lg z-50">
              <SelectItem value="all">Tất cả tokens</SelectItem>
              <SelectItem value="CAMLY">CAMLY</SelectItem>
              <SelectItem value="USDT">USDT</SelectItem>
              <SelectItem value="BTCB">BTCB</SelectItem>
              <SelectItem value="BNB">BNB</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Save Button - Only show for admin */}
        {!isReadOnly && (
          <div className="pt-2">
            <Button
              onClick={handleSaveAlerts}
              disabled={isUpdating}
              className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 shadow-lg"
            >
              {isUpdating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Lưu Alert Settings
            </Button>
          </div>
        )}

        {/* Preview Current Config */}
        {alertEnabled && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 mt-4">
            <div className="flex items-center gap-2 text-amber-600 font-medium mb-2">
              <Bell className="w-4 h-4" />
              Đang theo dõi:
            </div>
            <p className="text-sm text-muted-foreground">
              {alertDirection === 'all' ? 'Mọi giao dịch' : alertDirection === 'in' ? 'Giao dịch nhận' : 'Giao dịch chuyển'}
              {' '}{alertToken !== 'all' ? `token ${alertToken}` : 'tất cả tokens'}
              {' '}có giá trị &gt; <span className="font-bold text-amber-600">${alertThreshold || '100'}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
