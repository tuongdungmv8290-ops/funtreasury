import ExcelJS from 'exceljs';
import type { GiftData } from '@/hooks/useGifts';

const getFileNameDate = (): string => {
  const now = new Date();
  return `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
};

const formatDate = (d: string): string => {
  const date = new Date(d);
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const TOKEN_COLORS: Record<string, { background: string; text: string }> = {
  CAMLY: { background: 'FFF8E1', text: 'F57F17' },
  USDT:  { background: 'E3F2FD', text: '1565C0' },
  BNB:   { background: 'FFF3E0', text: 'E65100' },
};

export async function exportGiftsXLSX(gifts: GiftData[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FUN Treasury';
  workbook.created = new Date();

  const ws = workbook.addWorksheet('Gift History', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  ws.columns = [
    { header: 'Ngày', key: 'date', width: 22 },
    { header: 'Người gửi', key: 'sender', width: 24 },
    { header: 'Người nhận', key: 'receiver', width: 24 },
    { header: 'Token', key: 'token', width: 12 },
    { header: 'Số lượng', key: 'amount', width: 18 },
    { header: 'Giá trị USD', key: 'usd', width: 16 },
    { header: 'Lời nhắn', key: 'message', width: 30 },
    { header: 'Tx Hash', key: 'hash', width: 50 },
    { header: 'Explorer', key: 'link', width: 42 },
    { header: 'Trạng thái', key: 'status', width: 14 },
  ];

  // Header style
  const headerRow = ws.getRow(1);
  headerRow.height = 28;
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.eachCell(cell => {
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF374151' } },
      bottom: { style: 'medium', color: { argb: 'FF374151' } },
      left: { style: 'thin', color: { argb: 'FF374151' } },
      right: { style: 'thin', color: { argb: 'FF374151' } },
    };
  });

  gifts.forEach(g => {
    const explorerUrl = g.tx_hash ? `https://bscscan.com/tx/${g.tx_hash}` : '';
    const row = ws.addRow({
      date: formatDate(g.created_at),
      sender: g.sender_name || 'Unknown',
      receiver: g.receiver_name || 'Unknown',
      token: g.token_symbol,
      amount: g.amount,
      usd: `$${g.usd_value.toFixed(2)}`,
      message: g.message || '',
      hash: g.tx_hash || '',
      link: explorerUrl,
      status: g.status === 'confirmed' ? 'Đã xác nhận' : g.status,
    });

    row.height = 24;
    row.alignment = { vertical: 'middle' };

    const colors = TOKEN_COLORS[g.token_symbol.toUpperCase()];
    if (colors) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + colors.background } };
      row.eachCell(cell => { cell.font = { color: { argb: 'FF' + colors.text }, size: 10 }; });
    } else {
      row.eachCell(cell => { cell.font = { size: 10 }; });
    }

    row.eachCell(cell => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      };
    });

    // Clickable explorer link
    if (explorerUrl) {
      const linkCell = row.getCell('link');
      linkCell.value = { text: explorerUrl, hyperlink: explorerUrl };
      linkCell.font = { underline: true, color: { argb: 'FF2563EB' }, size: 10 };
    }
  });

  ws.autoFilter = { from: 'A1', to: `J${gifts.length + 1}` };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `FUN-Rewards-Gifts-${getFileNameDate()}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
