import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { useTransactions } from '@/hooks/useTransactions';
import { useWallets } from '@/hooks/useWallets';
import { useUpdateTxMetadata } from '@/hooks/useTxMetadata';
import { useViewMode } from '@/contexts/ViewModeContext';
import { formatCurrency, shortenAddress } from '@/lib/mockData';
import {
  ArrowUpRight,
  ArrowDownLeft,
  ExternalLink,
  Search,
  Download,
  Copy,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Filter,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditableCategory } from '@/components/transactions/EditableCategory';
import { EditableNote } from '@/components/transactions/EditableNote';
import { EditableTags } from '@/components/transactions/EditableTags';
import { TransactionAlertsSection } from '@/components/transactions/TransactionAlertsSection';
import { ManualSheetSection } from '@/components/transactions/ManualSheetSection';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Transaction } from '@/hooks/useTransactions';

type SortField = 'timestamp' | 'token_symbol' | 'amount' | 'usd_value' | 'direction';
type SortOrder = 'asc' | 'desc';

const PAGE_SIZE_OPTIONS = [20, 50, 100];

// Format date as DD/MM/YYYY HH:mm for CSV (Excel compatible)
const formatDateCSV = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

// Format date for display
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format USD value for CSV - raw number for Excel calculations
const formatUSDValueCSV = (value: number): string => {
  if (value === 0 || value === null || value === undefined) {
    return '0.00';
  }
  // Return raw number without $ for Excel calculations
  return value.toFixed(2);
};

// Format USD value for display with $
const formatUSDValue = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Format token amount for CSV - raw number for Excel calculations
const formatTokenAmountCSV = (amount: number, symbol: string): string => {
  if (amount === 0 || amount === null || amount === undefined) {
    return '0';
  }
  // Return raw number for Excel - use precision based on token
  if (symbol === 'CAMLY' || amount >= 1000000) {
    return Math.round(amount).toString();
  }
  // Keep decimal precision for other tokens
  return amount.toFixed(6).replace(/\.?0+$/, '');
};

// Shorten address for CSV display
const shortenAddressCSV = (address: string): string => {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Get BSCScan explorer link for tx hash
const getExplorerLink = (txHash: string): string => {
  return `https://bscscan.com/tx/${txHash}`;
};

// Escape CSV values properly - handle special characters for Excel
const escapeCSV = (value: string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '';
  const str = String(value);
  // If contains comma, newline, or double quote - wrap in quotes
  if (str.includes(',') || str.includes('\n') || str.includes('"') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// Get current date formatted for filename
const getFileNameDate = (): string => {
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear();
  return `${day}-${month}-${year}`;
};

const Transactions = () => {
  const { isViewOnly } = useViewMode();
  const [search, setSearch] = useState('');
  const [walletFilter, setWalletFilter] = useState<string>('all');
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [tokenFilter, setTokenFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const { data: wallets } = useWallets();
  const { data: transactions, isLoading } = useTransactions({
    walletId: walletFilter !== 'all' ? walletFilter : undefined,
    direction: directionFilter !== 'all' ? (directionFilter as 'IN' | 'OUT') : undefined,
    tokenSymbol: tokenFilter !== 'all' ? tokenFilter : undefined,
    search: search || undefined,
  });
  
  const updateMetadata = useUpdateTxMetadata();
  const [savingTxId, setSavingTxId] = useState<string | null>(null);

  const handleUpdateCategory = async (txId: string, category: string | null) => {
    setSavingTxId(txId);
    await updateMetadata.mutateAsync({ transactionId: txId, category });
    setSavingTxId(null);
  };

  const handleUpdateNote = async (txId: string, note: string | null) => {
    setSavingTxId(txId);
    await updateMetadata.mutateAsync({ transactionId: txId, note });
    setSavingTxId(null);
  };

  const handleUpdateTags = async (txId: string, tags: string[] | null) => {
    setSavingTxId(txId);
    await updateMetadata.mutateAsync({ transactionId: txId, tags });
    setSavingTxId(null);
  };

  const tokens = useMemo(() => {
    if (!transactions) return [];
    const tokenSet = new Set(transactions.map((tx) => tx.token_symbol));
    return Array.from(tokenSet);
  }, [transactions]);

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    if (!transactions) return [];
    
    return [...transactions].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'timestamp':
          comparison = a.timestamp.getTime() - b.timestamp.getTime();
          break;
        case 'token_symbol':
          comparison = a.token_symbol.localeCompare(b.token_symbol);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'usd_value':
          comparison = a.usd_value - b.usd_value;
          break;
        case 'direction':
          comparison = a.direction.localeCompare(b.direction);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [transactions, sortField, sortOrder]);

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedTransactions.slice(start, start + pageSize);
  }, [sortedTransactions, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(sortedTransactions.length / pageSize));

  // Reset page when filters or page size change
  const handlePageSizeChange = (newSize: string) => {
    setPageSize(Number(newSize));
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground/50" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="w-3.5 h-3.5 text-treasury-gold" />
      : <ArrowDown className="w-3.5 h-3.5 text-treasury-gold" />;
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({
      title: "✅ Đã copy!",
      description: text.slice(0, 20) + "...",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getWalletName = (walletId: string) => {
    const wallet = wallets?.find(w => w.id === walletId);
    return wallet?.name || 'Unknown';
  };

  const getWalletShortName = (walletId: string) => {
    const wallet = wallets?.find(w => w.id === walletId);
    return wallet?.name?.replace('Treasury Wallet ', 'W') || 'Unknown';
  };

  // Generate CSV content from transactions - Excel-friendly format with proper separator
  const generateCSV = (txList: Transaction[]): string => {
    // Use semicolon as separator for better Excel compatibility (especially non-US locales)
    const sep = ',';
    
    // Headers with clear labels for Excel
    const headers = [
      'Date',
      'Wallet Name',
      'Direction',
      'Token',
      'Amount',
      'USD Value',
      'From (Short)',
      'To (Short)',
      'From (Full)',
      'To (Full)',
      'Explorer Link',
      'Tx Hash',
      'Status',
      'Category',
      'Note',
      'Tags',
    ];
    
    const rows = txList.map((tx) => {
      // Wrap all text fields properly for Excel
      return [
        formatDateCSV(tx.timestamp),           // Date - no quotes needed
        escapeCSV(getWalletName(tx.wallet_id)), // Wallet Name
        tx.direction,                           // Direction - IN/OUT
        tx.token_symbol,                        // Token symbol
        formatTokenAmountCSV(tx.amount, tx.token_symbol), // Amount as number
        formatUSDValueCSV(tx.usd_value),       // USD Value as number (no $ symbol)
        shortenAddressCSV(tx.from_address),    // From short
        shortenAddressCSV(tx.to_address),      // To short
        escapeCSV(tx.from_address),            // From full
        escapeCSV(tx.to_address),              // To full
        getExplorerLink(tx.tx_hash),           // Explorer link
        tx.tx_hash,                            // Tx Hash
        tx.status,                             // Status
        escapeCSV(tx.metadata?.category || ''), // Category
        escapeCSV(tx.metadata?.note || ''),    // Note
        escapeCSV((tx.metadata?.tags || []).join('; ')), // Tags with semicolon separator
      ];
    });

    return [headers.join(sep), ...rows.map((row) => row.join(sep))].join('\r\n');
  };

  // Download CSV file with BOM for Excel UTF-8 support
  const downloadCSV = (content: string, count: number) => {
    // Add BOM (Byte Order Mark) for Excel to recognize UTF-8
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FUN-Treasury-Transactions-${getFileNameDate()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "✅ Export CSV thành công!",
      description: `Đã export ${count} transactions từ 3 ví Treasury`,
    });
  };

  // Export filtered transactions (currently visible after filters)
  const exportFilteredCSV = () => {
    if (sortedTransactions.length === 0) {
      toast({
        title: "Không có dữ liệu",
        description: "Không có transactions nào để export",
        variant: "destructive",
      });
      return;
    }
    
    const csv = generateCSV(sortedTransactions);
    downloadCSV(csv, sortedTransactions.length);
  };

  // Export ALL transactions from database
  const exportAllCSV = async () => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          tx_metadata (category, note, tags)
        `)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const allTransactions: Transaction[] = (data || []).map(tx => ({
        id: tx.id,
        wallet_id: tx.wallet_id,
        tx_hash: tx.tx_hash,
        block_number: tx.block_number,
        timestamp: new Date(tx.timestamp),
        from_address: tx.from_address,
        to_address: tx.to_address,
        direction: tx.direction as 'IN' | 'OUT',
        token_address: tx.token_address,
        token_symbol: tx.token_symbol,
        amount: Number(tx.amount),
        usd_value: Number(tx.usd_value),
        gas_fee: Number(tx.gas_fee),
        status: tx.status,
        metadata: tx.tx_metadata ? {
          category: tx.tx_metadata.category,
          note: tx.tx_metadata.note,
          tags: tx.tx_metadata.tags,
        } : undefined,
      }));

      if (allTransactions.length === 0) {
        toast({
          title: "Không có dữ liệu",
          description: "Không có transactions nào trong database",
          variant: "destructive",
        });
        return;
      }

      const csv = generateCSV(allTransactions);
      downloadCSV(csv, allTransactions.length);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Lỗi export",
        description: "Không thể export dữ liệu. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 max-w-[1600px]">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">
              <span className="gold-text">📊 Transactions</span>
            </h1>
            <p className="text-muted-foreground">
              {sortedTransactions.length} transactions found • Excel-style view
            </p>
          </div>
          
          {/* Hide Export CSV in View Only mode to protect data */}
          {!isViewOnly && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  className="gap-2 bg-gradient-to-r from-treasury-gold to-treasury-gold-light text-treasury-dark hover:from-treasury-gold-light hover:to-treasury-gold shadow-lg font-semibold"
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Export to CSV
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border-border shadow-xl">
                <DropdownMenuItem 
                  onClick={exportFilteredCSV}
                  className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10"
                >
                  <Filter className="w-4 h-4 mr-2 text-treasury-gold" />
                  <div className="flex flex-col">
                    <span className="font-medium">Export Filtered</span>
                    <span className="text-xs text-muted-foreground">
                      {sortedTransactions.length} transactions
                    </span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={exportAllCSV}
                  className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10"
                  disabled={isExporting}
                >
                  <Download className="w-4 h-4 mr-2 text-treasury-gold" />
                  <div className="flex flex-col">
                    <span className="font-medium">Export All</span>
                    <span className="text-xs text-muted-foreground">
                      All transactions in database
                    </span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Filters - Excel-style toolbar */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-treasury-gold/20 rounded-lg p-4 mb-4 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="🔍 Search by hash, token, address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white border-treasury-gold/30 focus:border-treasury-gold focus:ring-treasury-gold/20"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Select value={walletFilter} onValueChange={setWalletFilter}>
                <SelectTrigger className="w-[160px] bg-white border-treasury-gold/30 hover:border-treasury-gold transition-colors">
                  <SelectValue placeholder="All Wallets" />
                </SelectTrigger>
                <SelectContent className="bg-white border-border shadow-lg">
                  <SelectItem value="all">All Wallets</SelectItem>
                  {wallets?.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      {wallet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={directionFilter} onValueChange={setDirectionFilter}>
                <SelectTrigger className="w-[140px] bg-white border-treasury-gold/30 hover:border-treasury-gold transition-colors">
                  <SelectValue placeholder="All Directions" />
                </SelectTrigger>
                <SelectContent className="bg-white border-border shadow-lg">
                  <SelectItem value="all">All Directions</SelectItem>
                  <SelectItem value="IN">↓ Inflow</SelectItem>
                  <SelectItem value="OUT">↑ Outflow</SelectItem>
                </SelectContent>
              </Select>

              <Select value={tokenFilter} onValueChange={setTokenFilter}>
                <SelectTrigger className="w-[120px] bg-white border-treasury-gold/30 hover:border-treasury-gold transition-colors">
                  <SelectValue placeholder="All Tokens" />
                </SelectTrigger>
                <SelectContent className="bg-white border-border shadow-lg">
                  <SelectItem value="all">All Tokens</SelectItem>
                  {tokens.map((token) => (
                    <SelectItem key={token} value={token}>
                      {token}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-[110px] bg-white border-treasury-gold/30 hover:border-treasury-gold transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-border shadow-lg">
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Transactions Table - Excel Style */}
        <div className="bg-white rounded-lg border border-treasury-gold/20 shadow-lg overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-treasury-gold" />
              <span className="ml-3 text-muted-foreground">Loading transactions...</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto max-h-[calc(100vh-320px)]">
                <table className="w-full min-w-[1400px]">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gradient-to-r from-treasury-gold/10 to-amber-100 border-b-2 border-treasury-gold/30">
                      <th 
                        className="text-left py-3 px-4 text-xs font-bold text-treasury-dark uppercase tracking-wide cursor-pointer hover:bg-treasury-gold/20 transition-colors"
                        onClick={() => handleSort('timestamp')}
                      >
                        <div className="flex items-center gap-1.5">
                          Date {getSortIcon('timestamp')}
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-treasury-dark uppercase tracking-wide">
                        Wallet
                      </th>
                      <th 
                        className="text-left py-3 px-4 text-xs font-bold text-treasury-dark uppercase tracking-wide cursor-pointer hover:bg-treasury-gold/20 transition-colors"
                        onClick={() => handleSort('direction')}
                      >
                        <div className="flex items-center gap-1.5">
                          Direction {getSortIcon('direction')}
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-4 text-xs font-bold text-treasury-dark uppercase tracking-wide cursor-pointer hover:bg-treasury-gold/20 transition-colors"
                        onClick={() => handleSort('token_symbol')}
                      >
                        <div className="flex items-center gap-1.5">
                          Token {getSortIcon('token_symbol')}
                        </div>
                      </th>
                      <th 
                        className="text-right py-3 px-4 text-xs font-bold text-treasury-dark uppercase tracking-wide cursor-pointer hover:bg-treasury-gold/20 transition-colors"
                        onClick={() => handleSort('amount')}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          Amount {getSortIcon('amount')}
                        </div>
                      </th>
                      <th 
                        className="text-right py-3 px-4 text-xs font-bold text-treasury-dark uppercase tracking-wide cursor-pointer hover:bg-treasury-gold/20 transition-colors"
                        onClick={() => handleSort('usd_value')}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          USD Value {getSortIcon('usd_value')}
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-treasury-dark uppercase tracking-wide">
                        From/To
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-treasury-dark uppercase tracking-wide">
                        Tx Hash
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-bold text-treasury-dark uppercase tracking-wide">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-treasury-dark uppercase tracking-wide">
                        Category
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-treasury-dark uppercase tracking-wide">
                        Note
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-treasury-dark uppercase tracking-wide">
                        Tags
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {paginatedTransactions.map((tx, index) => (
                      <tr
                        key={tx.id}
                        className={cn(
                          "hover:bg-treasury-gold/5 transition-colors group",
                          index % 2 === 0 ? "bg-white" : "bg-amber-50/30"
                        )}
                      >
                        <td className="py-3 px-4">
                          <span className="text-sm text-foreground font-medium">
                            {formatDate(tx.timestamp)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-muted-foreground font-medium bg-secondary/50 px-2 py-0.5 rounded">
                            {getWalletShortName(tx.wallet_id)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold',
                              tx.direction === 'IN'
                                ? 'bg-inflow/15 text-inflow border border-inflow/30'
                                : 'bg-outflow/15 text-outflow border border-outflow/30'
                            )}
                          >
                            {tx.direction === 'IN' ? (
                              <ArrowDownLeft className="w-3 h-3" />
                            ) : (
                              <ArrowUpRight className="w-3 h-3" />
                            )}
                            {tx.direction}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm font-bold text-foreground bg-treasury-gold/10 px-2 py-0.5 rounded">
                            {tx.token_symbol}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <p
                            className={cn(
                              'text-sm font-mono font-bold',
                              tx.direction === 'IN' ? 'text-inflow' : 'text-outflow'
                            )}
                          >
                            {tx.direction === 'IN' ? '+' : '-'}
                            {tx.amount.toLocaleString('en-US', { maximumFractionDigits: 4 })}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <p className="text-sm font-semibold text-foreground">
                            {formatCurrency(tx.usd_value)}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground font-mono bg-secondary/50 px-2 py-0.5 rounded">
                              {shortenAddress(
                                tx.direction === 'IN' ? tx.from_address : tx.to_address
                              )}
                            </span>
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  tx.direction === 'IN' ? tx.from_address : tx.to_address,
                                  `addr-${tx.id}`
                                )
                              }
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-secondary rounded"
                              title="Copy full address"
                            >
                              {copiedId === `addr-${tx.id}` ? (
                                <CheckCircle className="w-3.5 h-3.5 text-inflow" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-treasury-gold" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground font-mono">
                              {shortenAddress(tx.tx_hash)}
                            </span>
                            <a
                              href={getExplorerLink(tx.tx_hash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 hover:bg-treasury-gold/10 rounded transition-colors"
                              title="View on BscScan"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-treasury-gold hover:text-treasury-gold-dark" />
                            </a>
                            <button
                              onClick={() => copyToClipboard(tx.tx_hash, `hash-${tx.id}`)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-secondary rounded"
                              title="Copy tx hash"
                            >
                              {copiedId === `hash-${tx.id}` ? (
                                <CheckCircle className="w-3.5 h-3.5 text-inflow" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-treasury-gold" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={cn(
                              'inline-flex px-2.5 py-1 rounded-full text-xs font-bold',
                              tx.status === 'success'
                                ? 'bg-inflow/15 text-inflow'
                                : tx.status === 'failed'
                                ? 'bg-outflow/15 text-outflow'
                                : 'bg-primary/15 text-primary'
                            )}
                          >
                            {tx.status === 'success' ? '✓' : tx.status === 'failed' ? '✗' : '⏳'} {tx.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <EditableCategory
                            value={tx.metadata?.category || null}
                            onSave={(category) => handleUpdateCategory(tx.id, category)}
                            isLoading={savingTxId === tx.id && updateMetadata.isPending}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <EditableNote
                            value={tx.metadata?.note || null}
                            onSave={(note) => handleUpdateNote(tx.id, note)}
                            isLoading={savingTxId === tx.id && updateMetadata.isPending}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <EditableTags
                            value={tx.metadata?.tags || null}
                            onSave={(tags) => handleUpdateTags(tx.id, tags)}
                            isLoading={savingTxId === tx.id && updateMetadata.isPending}
                          />
                        </td>
                      </tr>
                    ))}
                    {paginatedTransactions.length === 0 && (
                      <tr>
                        <td colSpan={12} className="py-12 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <Search className="w-8 h-8 text-muted-foreground/50" />
                            <p>No transactions found</p>
                            <p className="text-sm">Try adjusting your filters</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination - Excel-style footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t-2 border-treasury-gold/20 bg-gradient-to-r from-amber-50 to-yellow-50 gap-3">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-bold text-foreground">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-bold text-foreground">{Math.min(currentPage * pageSize, sortedTransactions.length)}</span> of{' '}
                  <span className="font-bold text-treasury-gold">{sortedTransactions.length}</span> transactions
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="bg-white hover:bg-treasury-gold/10 border-treasury-gold/30 text-xs"
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="bg-white hover:bg-treasury-gold/10 border-treasury-gold/30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={cn(
                            "min-w-[36px]",
                            currentPage === pageNum 
                              ? "bg-treasury-gold hover:bg-treasury-gold-light text-treasury-dark font-bold" 
                              : "bg-white hover:bg-treasury-gold/10 border-treasury-gold/30"
                          )}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="bg-white hover:bg-treasury-gold/10 border-treasury-gold/30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="bg-white hover:bg-treasury-gold/10 border-treasury-gold/30 text-xs"
                  >
                    Last
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Admin Only: Transaction Alerts & Manual Sheet Sections */}
        {!isViewOnly && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <TransactionAlertsSection />
            <ManualSheetSection />
          </div>
        )}
      </main>
    </div>
  );
};

export default Transactions;
