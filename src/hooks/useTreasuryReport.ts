import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { formatTokenAmount, formatUSD, formatNumber } from '@/lib/formatNumber';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface TokenBalance {
  symbol: string;
  balance: number;
  usdValue: number;
  percentage: number;
}

interface Transaction {
  id: string;
  tx_hash: string;
  timestamp: string;
  direction: string;
  token_symbol: string;
  amount: number;
  usd_value: number;
  from_address: string;
  to_address: string;
}

export function useTreasuryReport() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async (
    pieChartRef?: React.RefObject<HTMLDivElement>,
    flowChartRef?: React.RefObject<HTMLDivElement>
  ) => {
    setIsGenerating(true);

    try {
      // Fetch wallets
      const { data: wallets } = await supabase.from('wallets').select('*');
      
      // Fetch recent transactions (20 most recent)
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(20);

      // Fetch token balances from edge function
      const { data: tokenData } = await supabase.functions.invoke('get-token-balances');
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let yPos = 20;

      // Treasury Gold color
      const goldColor: [number, number, number] = [201, 162, 39];
      const darkText: [number, number, number] = [30, 30, 30];
      const grayText: [number, number, number] = [100, 100, 100];
      const greenColor: [number, number, number] = [34, 197, 94];
      const redColor: [number, number, number] = [239, 68, 68];

      // ========== HEADER ==========
      doc.setFillColor(...goldColor);
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('FUN Treasury Report', margin, 22);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Ngày xuất: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: vi })}`,
        pageWidth - margin,
        22,
        { align: 'right' }
      );

      yPos = 50;

      // ========== PORTFOLIO SUMMARY ==========
      doc.setTextColor(...darkText);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Portfolio Summary', margin, yPos);
      yPos += 10;

      // Calculate totals
      const allTokens = tokenData?.wallets?.flatMap((w: any) => w.tokens || []) || [];
      const tokenMap = new Map<string, { balance: number; usdValue: number }>();
      
      allTokens.forEach((token: any) => {
        const existing = tokenMap.get(token.symbol);
        if (existing) {
          existing.balance += token.balance;
          existing.usdValue += token.usdValue || 0;
        } else {
          tokenMap.set(token.symbol, {
            balance: token.balance,
            usdValue: token.usdValue || 0,
          });
        }
      });

      const totalUsd = Array.from(tokenMap.values()).reduce((sum, t) => sum + t.usdValue, 0);
      const tokenList: TokenBalance[] = Array.from(tokenMap.entries())
        .map(([symbol, data]) => ({
          symbol,
          balance: data.balance,
          usdValue: data.usdValue,
          percentage: totalUsd > 0 ? (data.usdValue / totalUsd) * 100 : 0,
        }))
        .sort((a, b) => b.usdValue - a.usdValue);

      // Summary box
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(margin, yPos, pageWidth - margin * 2, 25, 3, 3, 'F');
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...grayText);
      doc.text('Total Portfolio Value:', margin + 5, yPos + 10);
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...goldColor);
      doc.text(formatUSD(totalUsd), margin + 5, yPos + 20);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...grayText);
      doc.text(`${wallets?.length || 0} Wallets`, pageWidth - margin - 30, yPos + 15);
      
      yPos += 35;

      // ========== TOKEN HOLDINGS TABLE ==========
      doc.setTextColor(...darkText);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Token Holdings', margin, yPos);
      yPos += 8;

      // Table header
      doc.setFillColor(...goldColor);
      doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('Token', margin + 3, yPos + 5.5);
      doc.text('Balance', margin + 45, yPos + 5.5);
      doc.text('USD Value', margin + 100, yPos + 5.5);
      doc.text('% Portfolio', margin + 145, yPos + 5.5);
      yPos += 8;

      // Table rows
      doc.setFont('helvetica', 'normal');
      tokenList.slice(0, 10).forEach((token, idx) => {
        const rowColor: [number, number, number] = idx % 2 === 0 ? [255, 255, 255] : [250, 250, 250];
        doc.setFillColor(...rowColor);
        doc.rect(margin, yPos, pageWidth - margin * 2, 7, 'F');
        
        doc.setTextColor(...darkText);
        doc.setFontSize(9);
        doc.text(token.symbol, margin + 3, yPos + 5);
        doc.text(formatTokenAmount(token.balance, token.symbol), margin + 45, yPos + 5);
        doc.setTextColor(...goldColor);
        doc.text(formatUSD(token.usdValue), margin + 100, yPos + 5);
        doc.setTextColor(...grayText);
        doc.text(`${formatNumber(token.percentage, { maxDecimals: 1 })}%`, margin + 145, yPos + 5);
        yPos += 7;
      });

      yPos += 10;

      // ========== TRANSACTION HISTORY ==========
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }

      doc.setTextColor(...darkText);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Recent Transactions (20 Latest)', margin, yPos);
      yPos += 8;

      // Table header
      doc.setFillColor(...goldColor);
      doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('Date', margin + 3, yPos + 5.5);
      doc.text('Type', margin + 35, yPos + 5.5);
      doc.text('Token', margin + 50, yPos + 5.5);
      doc.text('Amount', margin + 75, yPos + 5.5);
      doc.text('USD Value', margin + 115, yPos + 5.5);
      doc.text('Tx Hash', margin + 150, yPos + 5.5);
      yPos += 8;

      // Transaction rows
      doc.setFont('helvetica', 'normal');
      (transactions || []).forEach((tx: Transaction, idx: number) => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }

        const rowColor: [number, number, number] = idx % 2 === 0 ? [255, 255, 255] : [250, 250, 250];
        doc.setFillColor(...rowColor);
        doc.rect(margin, yPos, pageWidth - margin * 2, 6, 'F');
        
        doc.setFontSize(7);
        doc.setTextColor(...darkText);
        doc.text(format(new Date(tx.timestamp), 'dd/MM/yy HH:mm'), margin + 3, yPos + 4);
        
        // Direction with color
        doc.setTextColor(tx.direction === 'IN' ? greenColor[0] : redColor[0], 
                          tx.direction === 'IN' ? greenColor[1] : redColor[1], 
                          tx.direction === 'IN' ? greenColor[2] : redColor[2]);
        doc.text(tx.direction === 'IN' ? '↓ IN' : '↑ OUT', margin + 35, yPos + 4);
        
        doc.setTextColor(...darkText);
        doc.text(tx.token_symbol, margin + 50, yPos + 4);
        doc.text(formatTokenAmount(tx.amount, tx.token_symbol), margin + 75, yPos + 4);
        doc.setTextColor(...goldColor);
        doc.text(formatUSD(tx.usd_value), margin + 115, yPos + 4);
        doc.setTextColor(...grayText);
        doc.text(tx.tx_hash.slice(0, 10) + '...', margin + 150, yPos + 4);
        yPos += 6;
      });

      // ========== CAPTURE CHARTS ==========
      if (pieChartRef?.current) {
        try {
          doc.addPage();
          yPos = 20;
          
          doc.setTextColor(...darkText);
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('Portfolio Allocation', margin, yPos);
          yPos += 10;

          const canvas = await html2canvas(pieChartRef.current, { scale: 2 });
          const imgData = canvas.toDataURL('image/png');
          doc.addImage(imgData, 'PNG', margin, yPos, pageWidth - margin * 2, 80);
          yPos += 90;
        } catch (e) {
          console.error('Error capturing pie chart:', e);
        }
      }

      if (flowChartRef?.current) {
        try {
          if (yPos > 150) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.setTextColor(...darkText);
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('Transaction Flow (14 Days)', margin, yPos);
          yPos += 10;

          const canvas = await html2canvas(flowChartRef.current, { scale: 2 });
          const imgData = canvas.toDataURL('image/png');
          doc.addImage(imgData, 'PNG', margin, yPos, pageWidth - margin * 2, 60);
        } catch (e) {
          console.error('Error capturing flow chart:', e);
        }
      }

      // ========== FOOTER ==========
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(...grayText);
        doc.text(
          `Page ${i} of ${pageCount} | Generated by FUN Treasury`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Save PDF
      const fileName = `treasury-report-${format(new Date(), 'dd-MM-yyyy-HHmm')}.pdf`;
      doc.save(fileName);

      return { success: true, fileName };
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateReport, isGenerating };
}
