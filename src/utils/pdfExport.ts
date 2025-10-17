import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Business {
  name: string;
  logo_url?: string;
}

interface ReportData {
  title: string;
  subtitle?: string;
  business: Business;
  date: string;
  headers: string[];
  rows: any[][];
  summary?: {
    label: string;
    value: string;
  }[];
}

export const generatePDF = async (data: ReportData) => {
  // Crear documento PDF (A4, portrait)
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // HEADER - Logo y nombre de empresa
  if (data.business.logo_url) {
    try {
      // Cargar logo
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = data.business.logo_url;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      doc.addImage(img, 'PNG', 15, yPosition, 30, 30);
    } catch (error) {
      console.warn('No se pudo cargar el logo');
    }
  }

  // Nombre de la empresa
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(data.business.name, data.business.logo_url ? 50 : 15, yPosition + 10);

  // Título del reporte
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(data.title, data.business.logo_url ? 50 : 15, yPosition + 18);

  // Subtítulo (si existe)
  if (data.subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(data.subtitle, data.business.logo_url ? 50 : 15, yPosition + 24);
  }

  // Fecha
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generado: ${data.date}`, pageWidth - 15, yPosition + 10, { align: 'right' });

  yPosition += data.business.logo_url ? 40 : 35;

  // Línea separadora
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.line(15, yPosition, pageWidth - 15, yPosition);
  yPosition += 10;

  // TABLA DE DATOS
  autoTable(doc, {
    startY: yPosition,
    head: [data.headers],
    body: data.rows,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    },
    margin: { left: 15, right: 15 }
  });

  // RESUMEN (si existe)
  if (data.summary && data.summary.length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY || yPosition + 50;
    yPosition = finalY + 10;

    // Línea separadora
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(15, yPosition, pageWidth - 15, yPosition);
    yPosition += 8;

    // Título de resumen
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Resumen', 15, yPosition);
    yPosition += 8;

    // Items del resumen
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    data.summary.forEach((item) => {
      doc.setTextColor(100, 100, 100);
      doc.text(item.label + ':', 15, yPosition);
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(item.value, 80, yPosition);
      
      doc.setFont('helvetica', 'normal');
      yPosition += 6;
    });
  }

  // FOOTER
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Descargar PDF
  const fileName = `${data.title.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
  doc.save(fileName);
};

// Función helper para formatear fecha
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};