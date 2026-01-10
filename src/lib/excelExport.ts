import ExcelJS from 'exceljs';
import type { Transaction } from '@/hooks/useTransactions';

interface Wallet {
  id: string;
  name: string;
  address: string;
  chain: string;
}

// Get current date formatted for filename
const getFileNameDate = (): string => {
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear();
  return `${day}-${month}-${year}`;
};

// Format date as DD/MM/YYYY HH:mm
const formatDateXLSX = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

// Get BSCScan explorer link for tx hash
const getExplorerLink = (txHash: string): string => {
  return `https://bscscan.com/tx/${txHash}`;
};

// Format token amount
const formatTokenAmount = (amount: number, symbol: string): string => {
  if (amount === 0 || amount === null || amount === undefined) {
    return '0';
  }
  if (symbol === 'CAMLY' || amount >= 1000000) {
    return Math.round(amount).toLocaleString('en-US');
  }
  return amount.toFixed(6).replace(/\.?0+$/, '');
};

// Color schemes for tokens
const TOKEN_COLORS = {
  USDT: {
    background: 'E3F2FD', // Light blue
    text: '1565C0',       // Dark blue
  },
  CAMLY: {
    background: 'FFF8E1', // Light gold
    text: 'F57F17',       // Dark gold (darker for better readability)
  },
};

export const exportTransactionsXLSX = async (
  transactions: Transaction[],
  wallets: Wallet[],
  onSuccess?: (count: number) => void,
  onError?: (error: Error) => void
): Promise<void> => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'FUN Treasury';
    workbook.created = new Date();
    
    const worksheet = workbook.addWorksheet('Transactions', {
      views: [{ state: 'frozen', ySplit: 1 }], // Freeze header row
    });

    // Define columns with WIDE widths for easy reading
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 22 },
      { header: 'Wallet Name', key: 'wallet', width: 28 },
      { header: 'Direction', key: 'direction', width: 12 },
      { header: 'Token', key: 'token', width: 14 },
      { header: 'Amount', key: 'amount', width: 22 },
      { header: 'USD Value', key: 'usd', width: 18 },
      { header: 'From Address', key: 'from', width: 48 },
      { header: 'To Address', key: 'to', width: 48 },
      { header: 'Explorer Link', key: 'link', width: 50 },
      { header: 'Tx Hash', key: 'hash', width: 72 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Category', key: 'category', width: 18 },
      { header: 'Note', key: 'note', width: 30 },
      { header: 'Tags', key: 'tags', width: 25 },
    ];

    // Style header row - Dark background with white bold text
    const headerRow = worksheet.getRow(1);
    headerRow.height = 28;
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F2937' }, // Dark gray
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    
    // Add border to header
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF374151' } },
        bottom: { style: 'medium', color: { argb: 'FF374151' } },
        left: { style: 'thin', color: { argb: 'FF374151' } },
        right: { style: 'thin', color: { argb: 'FF374151' } },
      };
    });

    // Helper to get wallet name
    const getWalletName = (walletId: string): string => {
      const wallet = wallets.find(w => w.id === walletId);
      return wallet?.name || 'Unknown';
    };

    // Add data rows with color coding
    transactions.forEach((tx, index) => {
      const amountSign = tx.direction === 'IN' ? '+' : '-';
      const formattedAmount = amountSign + formatTokenAmount(tx.amount, tx.token_symbol);
      
      const row = worksheet.addRow({
        date: formatDateXLSX(tx.timestamp),
        wallet: getWalletName(tx.wallet_id),
        direction: tx.direction,
        token: tx.token_symbol,
        amount: formattedAmount,
        usd: '$' + tx.usd_value.toFixed(2),
        from: tx.from_address,
        to: tx.to_address,
        link: getExplorerLink(tx.tx_hash),
        hash: tx.tx_hash,
        status: tx.status,
        category: tx.metadata?.category || '',
        note: tx.metadata?.note || '',
        tags: (tx.metadata?.tags || []).join('; '),
      });

      row.height = 24;
      row.alignment = { vertical: 'middle' };

      // Get token color scheme
      const tokenSymbol = tx.token_symbol.toUpperCase();
      const colorScheme = TOKEN_COLORS[tokenSymbol as keyof typeof TOKEN_COLORS];

      if (colorScheme) {
        // Apply background color to entire row
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF' + colorScheme.background },
        };

        // Apply text color to all cells
        row.eachCell((cell) => {
          cell.font = { color: { argb: 'FF' + colorScheme.text }, size: 10 };
        });
      } else {
        // Default styling for other tokens
        row.eachCell((cell) => {
          cell.font = { size: 10 };
        });
      }

      // Add borders to all cells
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        };
      });

      // Special styling for Direction column
      const directionCell = row.getCell('direction');
      if (tx.direction === 'IN') {
        directionCell.font = { 
          bold: true, 
          color: { argb: 'FF16A34A' }, // Green
          size: 10,
        };
      } else {
        directionCell.font = { 
          bold: true, 
          color: { argb: 'FFDC2626' }, // Red
          size: 10,
        };
      }

      // Make explorer link clickable
      const linkCell = row.getCell('link');
      linkCell.value = {
        text: getExplorerLink(tx.tx_hash),
        hyperlink: getExplorerLink(tx.tx_hash),
      };
      linkCell.font = { 
        ...linkCell.font,
        underline: true,
        color: { argb: 'FF2563EB' }, // Blue link color
      };
    });

    // Add auto filter
    worksheet.autoFilter = {
      from: 'A1',
      to: `N${transactions.length + 1}`,
    };

    // Generate buffer and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FUN-Treasury-Transactions-${getFileNameDate()}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);

    onSuccess?.(transactions.length);
  } catch (error) {
    console.error('Excel export error:', error);
    onError?.(error as Error);
  }
};
