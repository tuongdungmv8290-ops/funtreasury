import jsPDF from 'jspdf';
import type { GiftData } from '@/hooks/useGifts';

export function generateGiftReceiptPDF(gift: GiftData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();

  // Gold accent bar
  doc.setFillColor(218, 165, 32);
  doc.rect(0, 0, w, 8, 'F');

  // Title
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text('FUN Treasury', w / 2, 25, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(180, 130, 20);
  doc.text('Chứng Nhận Tặng Thưởng', w / 2, 34, { align: 'center' });

  // Divider
  doc.setDrawColor(218, 165, 32);
  doc.setLineWidth(0.5);
  doc.line(30, 40, w - 30, 40);

  // Content
  const startY = 52;
  const leftX = 30;
  const rightX = w - 30;
  let y = startY;
  const lineH = 10;

  const addRow = (label: string, value: string) => {
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(label, leftX, y);
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(11);
    doc.text(value, rightX, y, { align: 'right' });
    y += lineH;
  };

  addRow('Mã giao dịch', gift.id.slice(0, 8) + '...');
  addRow('Ngày giờ', new Date(gift.created_at).toLocaleString('vi-VN'));
  addRow('Người gửi', gift.sender_name || 'N/A');
  addRow('Người nhận', gift.receiver_name || 'N/A');

  // Token amount (gold highlight)
  y += 4;
  doc.setFillColor(255, 248, 225);
  doc.roundedRect(leftX - 4, y - 6, w - 52, 14, 3, 3, 'F');
  doc.setFontSize(14);
  doc.setTextColor(180, 130, 20);
  doc.text(`${gift.amount} ${gift.token_symbol}`, w / 2, y + 2, { align: 'center' });
  y += 18;

  addRow('Giá trị USD', `~$${gift.usd_value.toFixed(2)}`);

  if (gift.message) {
    y += 2;
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('Lời nhắn', leftX, y);
    y += 6;
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(`"${gift.message}"`, rightX - leftX);
    doc.text(lines, leftX, y);
    y += lines.length * 5 + 4;
  }

  if (gift.tx_hash) {
    y += 2;
    addRow('Tx Hash', gift.tx_hash.slice(0, 12) + '...' + gift.tx_hash.slice(-8));
    doc.setFontSize(9);
    doc.setTextColor(37, 99, 235);
    const bscUrl = `https://bscscan.com/tx/${gift.tx_hash}`;
    doc.textWithLink('Xem trên BscScan →', leftX, y, { url: bscUrl });
    y += lineH;
  }

  addRow('Trạng thái', gift.status === 'confirmed' ? '✓ Đã xác nhận' : gift.status);

  // Bottom divider
  y += 6;
  doc.setDrawColor(218, 165, 32);
  doc.line(30, y, w - 30, y);

  // Footer
  y += 10;
  doc.setFontSize(9);
  doc.setTextColor(160, 160, 160);
  doc.text('FUN Ecosystem • BNB Chain • funtreasury.lovable.app', w / 2, y, { align: 'center' });

  // Bottom gold bar
  const h = doc.internal.pageSize.getHeight();
  doc.setFillColor(218, 165, 32);
  doc.rect(0, h - 6, w, 6, 'F');

  // Download
  const dateStr = new Date(gift.created_at).toISOString().slice(0, 10);
  doc.save(`FUN-Gift-Receipt-${dateStr}-${gift.id.slice(0, 8)}.pdf`);
}
