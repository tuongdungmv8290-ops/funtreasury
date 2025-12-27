import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import {
  mockTransactions,
  formatCurrency,
  shortenAddress,
  formatDate,
  type Transaction,
} from '@/lib/mockData';
import {
  ArrowUpRight,
  ArrowDownLeft,
  ExternalLink,
  Search,
  Filter,
  Download,
  Copy,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
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

const ITEMS_PER_PAGE = 10;

const Transactions = () => {
  const [search, setSearch] = useState('');
  const [walletFilter, setWalletFilter] = useState<string>('all');
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [tokenFilter, setTokenFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const tokens = useMemo(() => {
    const tokenSet = new Set(mockTransactions.map((tx) => tx.tokenSymbol));
    return Array.from(tokenSet);
  }, []);

  const filteredTransactions = useMemo(() => {
    return mockTransactions.filter((tx) => {
      const matchesSearch =
        search === '' ||
        tx.txHash.toLowerCase().includes(search.toLowerCase()) ||
        tx.tokenSymbol.toLowerCase().includes(search.toLowerCase()) ||
        tx.fromAddress.toLowerCase().includes(search.toLowerCase()) ||
        tx.toAddress.toLowerCase().includes(search.toLowerCase());

      const matchesWallet =
        walletFilter === 'all' || tx.walletId === walletFilter;

      const matchesDirection =
        directionFilter === 'all' || tx.direction === directionFilter;

      const matchesToken =
        tokenFilter === 'all' || tx.tokenSymbol === tokenFilter;

      return matchesSearch && matchesWallet && matchesDirection && matchesToken;
    });
  }, [search, walletFilter, directionFilter, tokenFilter]);

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportCSV = () => {
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
    ];
    const rows = filteredTransactions.map((tx) => [
      formatDate(tx.timestamp),
      tx.walletName,
      tx.direction,
      tx.tokenSymbol,
      tx.amount.toString(),
      tx.usdValue.toString(),
      tx.fromAddress,
      tx.toAddress,
      tx.txHash,
      tx.status,
      tx.category || '',
      tx.note || '',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `treasury-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
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
          <Button onClick={exportCSV} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
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
                className="pl-10 bg-secondary border-border"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Select value={walletFilter} onValueChange={setWalletFilter}>
                <SelectTrigger className="w-[160px] bg-secondary border-border">
                  <SelectValue placeholder="All Wallets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Wallets</SelectItem>
                  <SelectItem value="wallet-1">Wallet 1</SelectItem>
                  <SelectItem value="wallet-2">Wallet 2</SelectItem>
                </SelectContent>
              </Select>

              <Select value={directionFilter} onValueChange={setDirectionFilter}>
                <SelectTrigger className="w-[140px] bg-secondary border-border">
                  <SelectValue placeholder="All Directions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Directions</SelectItem>
                  <SelectItem value="IN">Inflow</SelectItem>
                  <SelectItem value="OUT">Outflow</SelectItem>
                </SelectContent>
              </Select>

              <Select value={tokenFilter} onValueChange={setTokenFilter}>
                <SelectTrigger className="w-[120px] bg-secondary border-border">
                  <SelectValue placeholder="All Tokens" />
                </SelectTrigger>
                <SelectContent>
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
        <div className="treasury-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Wallet</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Direction</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Token</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">From/To</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Tx Hash</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Category</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-border/50 hover:bg-secondary/30 transition-colors group"
                  >
                    <td className="py-4 px-4">
                      <span className="text-sm text-foreground">
                        {formatDate(tx.timestamp)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">
                        {tx.walletName.replace('Treasury Wallet ', 'W')}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
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
                      <span className="text-sm font-medium text-foreground">
                        {tx.tokenSymbol}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div>
                        <p
                          className={cn(
                            'text-sm font-mono font-medium',
                            tx.direction === 'IN' ? 'inflow-text' : 'outflow-text'
                          )}
                        >
                          {tx.direction === 'IN' ? '+' : '-'}
                          {tx.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(tx.usdValue)}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground font-mono">
                          {shortenAddress(
                            tx.direction === 'IN' ? tx.fromAddress : tx.toAddress
                          )}
                        </span>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              tx.direction === 'IN' ? tx.fromAddress : tx.toAddress,
                              `addr-${tx.id}`
                            )
                          }
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {copiedId === `addr-${tx.id}` ? (
                            <CheckCircle className="w-3.5 h-3.5 text-inflow" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-treasury-gold" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground font-mono">
                          {shortenAddress(tx.txHash)}
                        </span>
                        <a
                          href={`https://bscscan.com/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-treasury-gold" />
                        </a>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={cn(
                          'inline-flex px-2 py-1 rounded-md text-xs font-medium',
                          tx.status === 'success'
                            ? 'bg-inflow/10 text-inflow'
                            : tx.status === 'failed'
                            ? 'bg-outflow/10 text-outflow'
                            : 'bg-treasury-gold/10 text-treasury-gold'
                        )}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">
                        {tx.category || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-4 border-t border-border">
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
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Transactions;
