import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  Send, 
  Upload, 
  Eye, 
  Coins, 
  Users, 
  DollarSign,
  Fuel,
  FileSpreadsheet,
  X,
  Search,
  Check,
  Lock
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatNumber, formatUSD } from '@/lib/formatNumber';

// Token configuration with prices (for preview/estimation only)
const TOKENS = [
  { symbol: 'CAMLY', name: 'CAMLY COIN', price: 0.000022, visible: true },
  { symbol: 'USDT', name: 'Tether USD', price: 1.0, visible: true },
  { symbol: 'BTCB', name: 'Bitcoin BEP20', price: 97000, visible: true },
  { symbol: 'BNB', name: 'BNB', price: 710, visible: true },
  // Hidden tokens - show when searched
  { symbol: 'DOGE', name: 'Dogecoin', price: 0.32, visible: false },
  { symbol: 'TON', name: 'Toncoin', price: 5.8, visible: false },
  { symbol: 'SHIB', name: 'Shiba Inu', price: 0.000022, visible: false },
  { symbol: 'ADA', name: 'Cardano', price: 0.98, visible: false },
  { symbol: 'XRP', name: 'Ripple', price: 2.35, visible: false },
  { symbol: 'TRUMP', name: 'TRUMP Token', price: 35.5, visible: false },
];

interface AddressEntry {
  address: string;
  amount: number;
  usdValue: number;
  isValid: boolean;
}

interface BulkTransferSectionProps {
  viewOnly?: boolean;
}

export const BulkTransferSection = ({ viewOnly = false }: BulkTransferSectionProps) => {
  const [selectedToken, setSelectedToken] = useState('CAMLY');
  const [tokenSearch, setTokenSearch] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [amountPerAddress, setAmountPerAddress] = useState('');
  const [parsedAddresses, setParsedAddresses] = useState<AddressEntry[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const token = TOKENS.find(t => t.symbol === selectedToken) || TOKENS[0];
  
  // Filter tokens based on search
  const filteredTokens = TOKENS.filter(t => {
    if (tokenSearch) {
      return t.symbol.toLowerCase().includes(tokenSearch.toLowerCase()) ||
             t.name.toLowerCase().includes(tokenSearch.toLowerCase());
    }
    return t.visible;
  });

  const parseAddresses = (input: string, amount: number): AddressEntry[] => {
    const lines = input.split(/[\n,]/).map(l => l.trim()).filter(Boolean);
    return lines.map(address => {
      const isValid = /^0x[a-fA-F0-9]{40}$/.test(address);
      const usdValue = amount * token.price;
      return { address, amount, usdValue, isValid };
    });
  };

  const handleParseAddresses = () => {
    const amount = parseFloat(amountPerAddress) || 0;
    if (!addressInput.trim()) {
      toast.error('Vui lòng nhập danh sách địa chỉ');
      return;
    }
    if (amount <= 0) {
      toast.error('Vui lòng nhập số lượng token hợp lệ');
      return;
    }
    
    const addresses = parseAddresses(addressInput, amount);
    setParsedAddresses(addresses);
    setShowPreview(true);
    toast.success(`📋 Đã parse ${addresses.length} địa chỉ`);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      // Parse CSV - assume first column is address
      const lines = text.split('\n').slice(1); // Skip header
      const addresses = lines
        .map(line => line.split(',')[0]?.trim())
        .filter(addr => addr && /^0x[a-fA-F0-9]{40}$/.test(addr));
      
      setAddressInput(addresses.join('\n'));
      toast.success(`📁 Đã import ${addresses.length} địa chỉ từ CSV`);
    };
    reader.readAsText(file);
  };

  const handlePreviewSend = () => {
    const validAddresses = parsedAddresses.filter(a => a.isValid);
    const totalAmount = validAddresses.reduce((sum, a) => sum + a.amount, 0);
    const totalUSD = validAddresses.reduce((sum, a) => sum + a.usdValue, 0);
    
    toast.success(
      `✅ Preview thành công – ${validAddresses.length} địa chỉ, ${formatNumber(totalAmount)} ${selectedToken} (~${formatUSD(totalUSD)}) – Chưa gửi thật!`,
      { duration: 5000 }
    );
  };

  const clearAll = () => {
    setAddressInput('');
    setAmountPerAddress('');
    setParsedAddresses([]);
    setShowPreview(false);
  };

  const totalAmount = parsedAddresses.reduce((sum, a) => sum + a.amount, 0);
  const totalUSD = parsedAddresses.reduce((sum, a) => sum + a.usdValue, 0);
  const validCount = parsedAddresses.filter(a => a.isValid).length;
  const estimatedGas = parsedAddresses.length * 0.0005 * 710; // ~0.0005 BNB per tx

  return (
    <Card className="relative overflow-hidden border-treasury-gold/30 bg-gradient-to-br from-treasury-gold/5 via-background to-treasury-gold/10">
      {/* Decorative elements */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-treasury-gold/10 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-treasury-gold/15 blur-2xl" />
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-lg md:text-xl">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-treasury-gold to-treasury-gold-dark flex items-center justify-center shadow-lg">
              <Send className="w-5 h-5 text-white" />
            </div>
            <span className="gold-text">Bulk Transfer</span>
            <Badge variant="outline" className="border-treasury-gold/50 text-treasury-gold text-xs">
              Preview Only
            </Badge>
            {viewOnly && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="flex items-center gap-1 bg-muted text-muted-foreground">
                      <Lock className="w-3 h-3" />
                      Chỉ xem
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Đăng nhập Admin để sử dụng tính năng này</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </CardTitle>
          {showPreview && !viewOnly && (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="relative space-y-6">
        {/* Token Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Coins className="w-4 h-4 text-treasury-gold" />
              Token
            </Label>
            <Select value={selectedToken} onValueChange={setSelectedToken} disabled={viewOnly}>
              <SelectTrigger className="border-treasury-gold/30 focus:ring-treasury-gold/50 disabled:opacity-60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tokens..."
                      value={tokenSearch}
                      onChange={(e) => setTokenSearch(e.target.value)}
                      className="pl-8 h-9"
                    />
                  </div>
                </div>
                {filteredTokens.map((t) => (
                  <SelectItem key={t.symbol} value={t.symbol}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t.symbol}</span>
                      <span className="text-muted-foreground text-xs">({t.name})</span>
                      {!t.visible && (
                        <Badge variant="secondary" className="text-[10px] px-1">HOT</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Price: {formatUSD(token.price)}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-inflow" />
              Amount per Address
            </Label>
            <Input
              type="number"
              placeholder="e.g. 1000"
              value={amountPerAddress}
              onChange={(e) => setAmountPerAddress(e.target.value)}
              className="border-treasury-gold/30 focus:ring-treasury-gold/50 disabled:opacity-60"
              disabled={viewOnly}
            />
            {amountPerAddress && (
              <p className="text-xs text-muted-foreground">
                ≈ {formatUSD(parseFloat(amountPerAddress) * token.price)} per address
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              CSV Upload
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              className="w-full border-dashed border-treasury-gold/50 hover:bg-treasury-gold/10 disabled:opacity-60"
              onClick={() => fileInputRef.current?.click()}
              disabled={viewOnly}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload CSV
            </Button>
          </div>
        </div>

        {/* Address Input */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4 text-treasury-gold" />
            Addresses (one per line or comma-separated)
          </Label>
          <Textarea
            placeholder="0x609a49e1E8D8bECDc5E67F3E3bE8e91a06a4519d&#10;0x742d35Cc6634C0532925a3b844Bc9e7595f45678&#10;0x8ba1f109551bD432803012645Ac136ddd64DBA72"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            className="min-h-[120px] font-mono text-sm border-treasury-gold/30 focus:ring-treasury-gold/50 disabled:opacity-60"
            disabled={viewOnly}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {addressInput.split(/[\n,]/).filter(l => l.trim()).length} addresses detected
            </span>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-treasury-gold disabled:opacity-60"
              onClick={handleParseAddresses}
              disabled={viewOnly}
            >
              Parse & Preview
            </Button>
          </div>
        </div>

        {/* Preview Table */}
        {showPreview && parsedAddresses.length > 0 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold flex items-center gap-2">
                <Eye className="w-4 h-4 text-treasury-gold" />
                Preview ({parsedAddresses.length} addresses)
              </h4>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-inflow">
                  <Check className="w-4 h-4" />
                  {validCount} valid
                </span>
                {parsedAddresses.length - validCount > 0 && (
                  <span className="text-outflow">
                    {parsedAddresses.length - validCount} invalid
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-treasury-gold/20 overflow-hidden max-h-[300px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-secondary">
                  <TableRow>
                    <TableHead className="text-xs">#</TableHead>
                    <TableHead className="text-xs">Address</TableHead>
                    <TableHead className="text-xs text-right">Amount</TableHead>
                    <TableHead className="text-xs text-right">USD Value</TableHead>
                    <TableHead className="text-xs text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedAddresses.slice(0, 20).map((entry, idx) => (
                    <TableRow key={idx} className={!entry.isValid ? 'bg-outflow/5' : ''}>
                      <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {entry.address.slice(0, 10)}...{entry.address.slice(-8)}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        {formatNumber(entry.amount)} {selectedToken}
                      </TableCell>
                      <TableCell className="text-xs text-right text-muted-foreground">
                        {formatUSD(entry.usdValue)}
                      </TableCell>
                      <TableCell className="text-center">
                        {entry.isValid ? (
                          <Badge variant="outline" className="text-inflow border-inflow/50 text-[10px]">
                            Valid
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-outflow border-outflow/50 text-[10px]">
                            Invalid
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {parsedAddresses.length > 20 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-2">
                        ... and {parsedAddresses.length - 20} more addresses
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-secondary/50 rounded-lg p-3 border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
                <p className="font-semibold text-foreground">
                  {formatNumber(totalAmount)} {selectedToken}
                </p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3 border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Total USD</p>
                <p className="font-semibold text-inflow">{formatUSD(totalUSD)}</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3 border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Recipients</p>
                <p className="font-semibold text-foreground">{validCount} addresses</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3 border border-border/50">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Fuel className="w-3 h-3" />
                  Est. Gas Fee
                </p>
                <p className="font-semibold text-treasury-gold">~{formatUSD(estimatedGas)}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                className="flex-1 bg-gradient-to-r from-treasury-gold to-treasury-gold-dark hover:from-treasury-gold-dark hover:to-treasury-gold text-white font-semibold shadow-lg disabled:opacity-60"
                onClick={handlePreviewSend}
                disabled={validCount === 0 || viewOnly}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview Send
              </Button>
              <Button
                variant="outline"
                className="border-treasury-gold/50 text-treasury-gold hover:bg-treasury-gold/10"
                disabled
              >
                <Send className="w-4 h-4 mr-2" />
                Send (Coming Soon)
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              ⚠️ Preview mode only – Real transactions require 2FA + Wallet signature
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
