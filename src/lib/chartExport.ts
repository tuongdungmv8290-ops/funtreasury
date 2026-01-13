import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

/**
 * Export a single chart element as PNG
 */
export async function exportChartAsPNG(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    toast.error('Chart element not found');
    return;
  }

  try {
    toast.loading('Generating PNG...', { id: 'export-png' });
    
    const canvas = await html2canvas(element, {
      backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--background').includes('0')
        ? '#0a0a0a' // Dark mode
        : '#ffffff', // Light mode
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
    });

    const link = document.createElement('a');
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    toast.success('PNG exported successfully!', { id: 'export-png' });
  } catch (error) {
    console.error('PNG export failed:', error);
    toast.error('Failed to export PNG', { id: 'export-png' });
  }
}

/**
 * Export a single chart element as PDF
 */
export async function exportChartAsPDF(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    toast.error('Chart element not found');
    return;
  }

  try {
    toast.loading('Generating PDF...', { id: 'export-pdf' });

    const canvas = await html2canvas(element, {
      backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--background').includes('0')
        ? '#0a0a0a'
        : '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);

    toast.success('PDF exported successfully!', { id: 'export-pdf' });
  } catch (error) {
    console.error('PDF export failed:', error);
    toast.error('Failed to export PDF', { id: 'export-pdf' });
  }
}

/**
 * Export all charts as a single PDF report
 */
export async function exportAllChartsAsPDF(chartIds: string[], filename: string): Promise<void> {
  if (chartIds.length === 0) {
    toast.error('No charts to export');
    return;
  }

  try {
    toast.loading('Generating full report...', { id: 'export-all' });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    let currentY = margin;

    // Add title
    pdf.setFontSize(20);
    pdf.setTextColor(201, 162, 39); // Gold color
    pdf.text('Treasury Analytics Report', pageWidth / 2, currentY + 10, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.setTextColor(128, 128, 128);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, currentY + 18, { align: 'center' });
    
    currentY += 25;

    for (let i = 0; i < chartIds.length; i++) {
      const element = document.getElementById(chartIds[i]);
      if (!element) continue;

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Check if we need a new page
      if (currentY + imgHeight > pageHeight - margin) {
        pdf.addPage();
        currentY = margin;
      }

      pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
      currentY += imgHeight + 10;
    }

    pdf.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Full report exported successfully!', { id: 'export-all' });
  } catch (error) {
    console.error('Full report export failed:', error);
    toast.error('Failed to export full report', { id: 'export-all' });
  }
}
