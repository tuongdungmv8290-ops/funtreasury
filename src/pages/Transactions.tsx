import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { useTransactions } from '@/hooks/useTransactions';
import { useWallets } from '@/hooks/useWallets';
import { useUpdateTxMetadata } from '@/hooks/useTxMetadata';
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
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Transaction } from '@/hooks/useTransactions';

const ITEMS_PER_PAGE = 10;

// Format date as DD/MM/YYYY HH:mm
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

// Format USD value as $1,234.56
const formatUSDValue = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Escape CSV values properly
const escapeCSV = (value: string): string => {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
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
  const [search, setSearch] = useState('');
  const [walletFilter, setWalletFilter] = useState<string>('all');
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [tokenFilter, setTokenFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

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

  const filteredTransactions = transactions || [];

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE));

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
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

  // Generate CSV content from transactions
  const generateCSV = (txList: Transaction[]): string => {
    const headers = [
      'Date',
      'Wallet',
      'Direction',
      'Token',
      'Amount',
      'USD Value',
      'From',
      'To',
      'Tx Hash',
      'Status',
      'Category',
      'Note',
      'Tags',
    ];
    
    const rows = txList.map((tx) => [
      formatDateCSV(tx.timestamp),
      escapeCSV(getWalletName(tx.wallet_id)),
      tx.direction,
      tx.token_symbol,
      tx.amount.toString(),
      formatUSDValue(tx.usd_value),
      tx.from_address,
      tx.to_address,
      tx.tx_hash,
      tx.status,
      escapeCSV(tx.metadata?.category || ''),
      escapeCSV(tx.metadata?.note || ''),
      escapeCSV((tx.metadata?.tags || []).join(', ')),
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  };

  // Download CSV file
  const downloadCSV = (content: string, count: number) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `treasury-transactions-${getFileNameDate()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export thành công",
      description: `Đã export ${count} transactions ra file CSV`,
    });
  };

  // Export filtered transactions (currently visible after filters)
  const exportFilteredCSV = () => {
    if (filteredTransactions.length === 0) {
      toast({
        title: "Không có dữ liệu",
        description: "Không có transactions nào để export",
        variant: "destructive",
      });
      return;
    }
    
    const csv = generateCSV(filteredTransactions);
    downloadCSV(csv, filteredTransactions.length);
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

      <main className="container py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">
              <span className="gold-text">Transactions</span>
            </h1>
            <p className="text-muted-foreground">
              {filteredTransactions.length} transactions found
            </p>
          </div>
          
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
                    {filteredTransactions.length} transactions
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
        </div>

        {/* Filters */}
        <div className="treasury-card mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by hash, token, address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white border-border focus:border-primary focus:ring-primary/20"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Select value={walletFilter} onValueChange={setWalletFilter}>
                <SelectTrigger className="w-[160px] bg-white border-border hover:border-primary/50 transition-colors">
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
                <SelectTrigger className="w-[140px] bg-white border-border hover:border-primary/50 transition-colors">
                  <SelectValue placeholder="All Directions" />
                </SelectTrigger>
                <SelectContent className="bg-white border-border shadow-lg">
                  <SelectItem value="all">All Directions</SelectItem>
                  <SelectItem value="IN">Inflow</SelectItem>
                  <SelectItem value="OUT">Outflow</SelectItem>
                </SelectContent>
              </Select>

              <Select value={tokenFilter} onValueChange={setTokenFilter}>
                <SelectTrigger className="w-[120px] bg-white border-border hover:border-primary/50 transition-colors">
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
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="treasury-card overflow-hidden bg-white">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-treasury-gold" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">Date</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">Wallet</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">Direction</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">Token</th>
                      <th className="text-right py-4 px-4 text-sm font-semibold text-foreground">Amount</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">From/To</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">Tx Hash</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">Status</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">Category</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">Note</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">Tags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTransactions.map((tx, index) => (
                      <tr
                        key={tx.id}
                        className={cn(
                          "border-b border-border/50 hover:bg-primary/5 transition-colors group",
                          index % 2 === 0 ? "bg-white" : "bg-secondary/30"
                        )}
                      >
                        <td className="py-4 px-4">
                          <span className="text-sm text-foreground">
                            {formatDate(tx.timestamp)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-muted-foreground font-medium">
                            {getWalletShortName(tx.wallet_id)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
                              tx.direction === 'IN'
                                ? 'bg-inflow/10 text-inflow border border-inflow/20'
                                : 'bg-outflow/10 text-outflow border border-outflow/20'
                            )}
                          >
                            {tx.direction === 'IN' ? (
                              <ArrowDownLeft className="w-3 h-3" />
                            ) : (
                              <ArrowUpRight className="w-3 h-3" />
                            )}
                            {tx.direction === 'IN' ? 'In' : 'Out'}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm font-semibold text-foreground">
                            {tx.token_symbol}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div>
                            <p
                              className={cn(
                                'text-sm font-mono font-semibold',
                                tx.direction === 'IN' ? 'text-inflow' : 'text-outflow'
                              )}
                            >
                              {tx.direction === 'IN' ? '+' : '-'}
                              {tx.amount.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(tx.usd_value)}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground font-mono">
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
                            >
                              {copiedId === `addr-${tx.id}` ? (
                                <CheckCircle className="w-3.5 h-3.5 text-inflow" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground font-mono">
                              {shortenAddress(tx.tx_hash)}
                            </span>
                            <a
                              href={`https://bscscan.com/tx/${tx.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-secondary rounded"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                            </a>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={cn(
                              'inline-flex px-2.5 py-1 rounded-full text-xs font-semibold',
                              tx.status === 'success'
                                ? 'bg-inflow/10 text-inflow'
                                : tx.status === 'failed'
                                ? 'bg-outflow/10 text-outflow'
                                : 'bg-primary/10 text-primary'
                            )}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <EditableCategory
                            value={tx.metadata?.category || null}
                            onSave={(category) => handleUpdateCategory(tx.id, category)}
                            isLoading={savingTxId === tx.id && updateMetadata.isPending}
                          />
                        </td>
                        <td className="py-4 px-4">
                          <EditableNote
                            value={tx.metadata?.note || null}
                            onSave={(note) => handleUpdateNote(tx.id, note)}
                            isLoading={savingTxId === tx.id && updateMetadata.isPending}
                          />
                        </td>
                        <td className="py-4 px-4">
                          <EditableTags
                            value={tx.metadata?.tags || null}
                            onSave={(tags) => handleUpdateTags(tx.id, tags)}
                            isLoading={savingTxId === tx.id && updateMetadata.isPending}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-4 border-t border-border bg-secondary/30">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} of{' '}
                  {filteredTransactions.length} results
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="bg-white hover:bg-secondary border-border"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-foreground font-medium px-3 py-1 bg-white rounded border border-border">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="bg-white hover:bg-secondary border-border"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Transactions;
