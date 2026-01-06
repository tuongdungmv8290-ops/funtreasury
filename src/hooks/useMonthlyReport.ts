import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { jsPDF } from 'jspdf';
import { formatTokenAmount, formatUSD, formatNumber } from '@/lib/formatNumber';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { vi } from 'date-fns/locale';

interface WalletSummary {
  walletId: string;
  walletName: string;
  tokens: {
    symbol: string;
    inflow: number;
    inflowUsd: number;
    inflowCount: number;
    outflow: number;
    outflowUsd: number;
    outflowCount: number;
    net: number;
    netUsd: number;
  }[];
  totalInflowUsd: number;
  totalOutflowUsd: number;
  totalNetUsd: number;
}

interface MonthlyTransaction {
  id: string;
  timestamp: string;
  wallet_name: string;
  direction: string;
  token_symbol: string;
  amount: number;
  usd_value: number;
  tx_hash: string;
}

export interface MonthlyReportOptions {
  month: number; // 1-12
  year: number;
  includeTransactions: boolean;
}

export function useMonthlyReport() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateMonthlyReport = async (options: MonthlyReportOptions) => {
    setIsGenerating(true);

    try {
      const { month, year, includeTransactions } = options;
      
      // Get date range for the selected month
      const startDate = startOfMonth(new Date(year, month - 1));
      const endDate = endOfMonth(new Date(year, month - 1));
      const monthName = format(startDate, 'MMMM yyyy');

      // Fetch wallets
      const { data: wallets } = await supabase.from('wallets').select('*');
      const walletMap = new Map(wallets?.map(w => [w.id, w.name]) || []);

      // Fetch transactions for the month
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString())
        .order('timestamp', { ascending: false });

      // Aggregate data by wallet and token
      const summaryMap = new Map<string, WalletSummary>();

      (transactions || []).forEach((tx) => {
        const walletId = tx.wallet_id;
        const walletName = walletMap.get(walletId) || 'Unknown';
        
        if (!summaryMap.has(walletId)) {
          summaryMap.set(walletId, {
            walletId,
            walletName,
            tokens: [],
            totalInflowUsd: 0,
            totalOutflowUsd: 0,
            totalNetUsd: 0,
          });
        }

        const summary = summaryMap.get(walletId)!;
        let tokenData = summary.tokens.find(t => t.symbol === tx.token_symbol);
        
        if (!tokenData) {
          tokenData = {
            symbol: tx.token_symbol,
            inflow: 0,
            inflowUsd: 0,
            inflowCount: 0,
            outflow: 0,
            outflowUsd: 0,
            outflowCount: 0,
            net: 0,
            netUsd: 0,
          };
          summary.tokens.push(tokenData);
        }

        const amount = Number(tx.amount);
        const usdValue = Number(tx.usd_value);

        if (tx.direction === 'IN') {
          tokenData.inflow += amount;
          tokenData.inflowUsd += usdValue;
          tokenData.inflowCount++;
          summary.totalInflowUsd += usdValue;
        } else {
          tokenData.outflow += amount;
          tokenData.outflowUsd += usdValue;
          tokenData.outflowCount++;
          summary.totalOutflowUsd += usdValue;
        }

        tokenData.net = tokenData.inflow - tokenData.outflow;
        tokenData.netUsd = tokenData.inflowUsd - tokenData.outflowUsd;
        summary.totalNetUsd = summary.totalInflowUsd - summary.totalOutflowUsd;
      });

      const walletSummaries = Array.from(summaryMap.values()).sort((a, b) => 
        a.walletName.localeCompare(b.walletName)
      );

      // Calculate grand totals
      const grandTotalInflow = walletSummaries.reduce((sum, w) => sum + w.totalInflowUsd, 0);
      const grandTotalOutflow = walletSummaries.reduce((sum, w) => sum + w.totalOutflowUsd, 0);
      const grandTotalNet = grandTotalInflow - grandTotalOutflow;

      // Create PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let yPos = 20;

      // Colors
      const goldColor: [number, number, number] = [201, 162, 39];
      const darkText: [number, number, number] = [30, 30, 30];
      const grayText: [number, number, number] = [100, 100, 100];
      const greenColor: [number, number, number] = [34, 197, 94];
      const redColor: [number, number, number] = [239, 68, 68];

      // ========== HEADER ==========
      doc.setFillColor(...goldColor);
      doc.rect(0, 0, pageWidth, 45, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('FUN Treasury', margin, 18);
      doc.setFontSize(14);
      doc.text('Monthly Report', margin, 28);
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(monthName, pageWidth - margin, 20, { align: 'right' });
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: vi })}`,
        pageWidth - margin,
        30,
        { align: 'right' }
      );

      yPos = 55;

      // ========== TREASURY TOTAL BOX ==========
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(margin, yPos, pageWidth - margin * 2, 35, 3, 3, 'F');
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkText);
      doc.text(`💎 TREASURY TOTAL - ${monthName.toUpperCase()}`, margin + 8, yPos + 12);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      // Inflow
      doc.setTextColor(...grayText);
      doc.text('Total Inflow:', margin + 8, yPos + 22);
      doc.setTextColor(...greenColor);
      doc.text(formatUSD(grandTotalInflow), margin + 45, yPos + 22);
      
      // Outflow
      doc.setTextColor(...grayText);
      doc.text('Total Outflow:', margin + 85, yPos + 22);
      doc.setTextColor(...redColor);
      doc.text(formatUSD(grandTotalOutflow), margin + 125, yPos + 22);

      // Net Flow
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...grayText);
      doc.text('NET FLOW:', margin + 8, yPos + 31);
      doc.setTextColor(grandTotalNet >= 0 ? greenColor[0] : redColor[0], 
                       grandTotalNet >= 0 ? greenColor[1] : redColor[1],
                       grandTotalNet >= 0 ? greenColor[2] : redColor[2]);
      const netSign = grandTotalNet >= 0 ? '+' : '';
      doc.text(`${netSign}${formatUSD(grandTotalNet)}`, margin + 40, yPos + 31);

      yPos += 45;

      // ========== WALLET SUMMARIES ==========
      walletSummaries.forEach((wallet) => {
        if (yPos > 230) {
          doc.addPage();
          yPos = 20;
        }

        // Wallet header
        doc.setFillColor(...goldColor);
        doc.roundedRect(margin, yPos, pageWidth - margin * 2, 10, 2, 2, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(`🏦 ${wallet.walletName}`, margin + 5, yPos + 7);
        yPos += 14;

        // Token summaries
        wallet.tokens.forEach((token) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }

          const tokenIcon = token.symbol === 'CAMLY' ? '📈' : '💵';
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...darkText);
          doc.text(`${tokenIcon} ${token.symbol}`, margin + 5, yPos + 5);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);

          // Inflow line
          doc.setTextColor(...greenColor);
          doc.text('↓ Inflow:', margin + 35, yPos + 5);
          doc.setTextColor(...darkText);
          doc.text(
            `${formatTokenAmount(token.inflow, token.symbol)} (${formatUSD(token.inflowUsd)})`,
            margin + 55,
            yPos + 5
          );
          doc.setTextColor(...grayText);
          doc.text(`${token.inflowCount} tx`, margin + 130, yPos + 5);

          // Outflow line
          doc.setTextColor(...redColor);
          doc.text('↑ Outflow:', margin + 35, yPos + 11);
          doc.setTextColor(...darkText);
          doc.text(
            `${formatTokenAmount(token.outflow, token.symbol)} (${formatUSD(token.outflowUsd)})`,
            margin + 55,
            yPos + 11
          );
          doc.setTextColor(...grayText);
          doc.text(`${token.outflowCount} tx`, margin + 130, yPos + 11);

          // Net line
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(token.netUsd >= 0 ? greenColor[0] : redColor[0],
                           token.netUsd >= 0 ? greenColor[1] : redColor[1],
                           token.netUsd >= 0 ? greenColor[2] : redColor[2]);
          const tokenNetSign = token.net >= 0 ? '+' : '';
          const tokenNetUsdSign = token.netUsd >= 0 ? '+' : '';
          doc.text(
            `└─ Net: ${tokenNetSign}${formatTokenAmount(Math.abs(token.net), token.symbol)} (${tokenNetUsdSign}${formatUSD(token.netUsd)})`,
            margin + 35,
            yPos + 17
          );

          yPos += 22;
        });

        // Wallet total
        doc.setDrawColor(...goldColor);
        doc.line(margin + 5, yPos, pageWidth - margin - 5, yPos);
        yPos += 5;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...darkText);
        doc.text('💰 WALLET NET:', margin + 5, yPos + 5);
        doc.setTextColor(wallet.totalNetUsd >= 0 ? greenColor[0] : redColor[0],
                         wallet.totalNetUsd >= 0 ? greenColor[1] : redColor[1],
                         wallet.totalNetUsd >= 0 ? greenColor[2] : redColor[2]);
        const walletNetSign = wallet.totalNetUsd >= 0 ? '+' : '';
        doc.text(`${walletNetSign}${formatUSD(wallet.totalNetUsd)}`, margin + 50, yPos + 5);

        yPos += 15;
      });

      // ========== TRANSACTION LIST ==========
      if (includeTransactions && transactions && transactions.length > 0) {
        doc.addPage();
        yPos = 20;

        doc.setTextColor(...darkText);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`📋 Transaction List - ${monthName}`, margin, yPos);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...grayText);
        doc.text(`${transactions.length} transactions`, margin, yPos + 8);
        yPos += 15;

        // Table header
        doc.setFillColor(...goldColor);
        doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('Date', margin + 3, yPos + 5.5);
        doc.text('Wallet', margin + 28, yPos + 5.5);
        doc.text('Dir', margin + 58, yPos + 5.5);
        doc.text('Token', margin + 72, yPos + 5.5);
        doc.text('Amount', margin + 90, yPos + 5.5);
        doc.text('USD Value', margin + 130, yPos + 5.5);
        doc.text('Tx Hash', margin + 160, yPos + 5.5);
        yPos += 8;

        // Transaction rows
        doc.setFont('helvetica', 'normal');
        transactions.forEach((tx, idx) => {
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
            
            // Repeat header on new page
            doc.setFillColor(...goldColor);
            doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text('Date', margin + 3, yPos + 5.5);
            doc.text('Wallet', margin + 28, yPos + 5.5);
            doc.text('Dir', margin + 58, yPos + 5.5);
            doc.text('Token', margin + 72, yPos + 5.5);
            doc.text('Amount', margin + 90, yPos + 5.5);
            doc.text('USD Value', margin + 130, yPos + 5.5);
            doc.text('Tx Hash', margin + 160, yPos + 5.5);
            yPos += 8;
            doc.setFont('helvetica', 'normal');
          }

          const rowColor: [number, number, number] = idx % 2 === 0 ? [255, 255, 255] : [250, 250, 250];
          doc.setFillColor(...rowColor);
          doc.rect(margin, yPos, pageWidth - margin * 2, 6, 'F');
          
          doc.setFontSize(7);
          doc.setTextColor(...darkText);
          doc.text(format(new Date(tx.timestamp), 'dd/MM HH:mm'), margin + 3, yPos + 4);
          
          const walletName = walletMap.get(tx.wallet_id) || 'Unknown';
          doc.text(walletName.length > 12 ? walletName.slice(0, 12) + '..' : walletName, margin + 28, yPos + 4);
          
          // Direction with color
          doc.setTextColor(tx.direction === 'IN' ? greenColor[0] : redColor[0], 
                            tx.direction === 'IN' ? greenColor[1] : redColor[1], 
                            tx.direction === 'IN' ? greenColor[2] : redColor[2]);
          doc.text(tx.direction === 'IN' ? '↓ IN' : '↑ OUT', margin + 58, yPos + 4);
          
          doc.setTextColor(...darkText);
          doc.text(tx.token_symbol, margin + 72, yPos + 4);
          
          const amount = Number(tx.amount);
          doc.text(formatTokenAmount(amount, tx.token_symbol), margin + 90, yPos + 4);
          
          doc.setTextColor(...goldColor);
          doc.text(formatUSD(Number(tx.usd_value)), margin + 130, yPos + 4);
          
          doc.setTextColor(...grayText);
          doc.text(tx.tx_hash.slice(0, 12) + '...', margin + 160, yPos + 4);
          
          yPos += 6;
        });
      }

      // ========== FOOTER ==========
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(...grayText);
        doc.text(
          `Page ${i} of ${pageCount} | FUN Treasury Monthly Report`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Save PDF
      const monthStr = month.toString().padStart(2, '0');
      const fileName = `FUN-Treasury-Monthly-${monthStr}-${year}.pdf`;
      doc.save(fileName);

      return { success: true, fileName };
    } catch (error) {
      console.error('Error generating monthly report:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateMonthlyReport, isGenerating };
}
