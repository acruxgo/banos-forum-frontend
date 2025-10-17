import { useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { X, Printer, Send } from 'lucide-react';

interface TicketModalProps {
  ticket: {
    folio: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      total: number;
    }>;
    subtotal: number;
    discount?: number;
    total: number;
    payment_method: string;
    customer_name?: string;
    customer_phone?: string;
    notes?: string;
    created_at: string;
  };
  onClose: () => void;
  onPrint?: () => void;
  onWhatsApp?: () => void;
}

export default function TicketModal({ ticket, onClose, onPrint, onWhatsApp }: TicketModalProps) {
  const business = useAuthStore((state) => state.business);
  const user = useAuthStore((state) => state.user);
  const ticketRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleWhatsApp = () => {
    if (onWhatsApp) {
      onWhatsApp();
    } else if (ticket.customer_phone) {
      const message = `Hola! Aquí está tu ticket de compra:\n\nFolio: ${ticket.folio}\nTotal: $${ticket.total.toFixed(2)} MXN\n\nGracias por tu preferencia!\n${business?.name || 'Sistema POS'}`;
      const phone = ticket.customer_phone.replace(/\D/g, '');
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      card: '💳 Tarjeta',
      transfer: '🏦 Transferencia',
      cash: '💵 Efectivo'
    };
    return methods[method] || method;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white print:hidden">
          <h2 className="text-lg font-bold text-gray-800">Ticket de Compra</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Ticket Content */}
        <div ref={ticketRef} id="printable-ticket" className="p-6">
          {/* Logo y nombre del negocio */}
          <div className="text-center mb-6">
            {business?.logo_url ? (
              <img
                src={business.logo_url}
                alt={business.name}
                className="h-16 mx-auto mb-2 object-contain"
              />
            ) : (
              <div className="h-16 flex items-center justify-center mb-2">
                <span className="text-2xl font-bold" style={{ color: business?.primary_color || '#3B82F6' }}>
                  {business?.name || 'Sistema POS'}
                </span>
              </div>
            )}
            <p className="text-sm text-gray-600">Sistema Acrux POS</p>
          </div>

          {/* Información del ticket */}
          <div className="border-t border-b border-gray-300 py-3 mb-4 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-semibold">Folio:</span>
              <span className="font-mono">{ticket.folio}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-semibold">Fecha:</span>
              <span>{formatDate(ticket.created_at)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-semibold">Atendió:</span>
              <span>{user?.name}</span>
            </div>
            {ticket.customer_name && (
              <div className="flex justify-between text-sm">
                <span className="font-semibold">Cliente:</span>
                <span>{ticket.customer_name}</span>
              </div>
            )}
            {ticket.customer_phone && (
              <div className="flex justify-between text-sm">
                <span className="font-semibold">Teléfono:</span>
                <span>{ticket.customer_phone}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-2">Producto</th>
                  <th className="text-center py-2">Cant.</th>
                  <th className="text-right py-2">Precio</th>
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {ticket.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-2">{item.name}</td>
                    <td className="text-center py-2">{item.quantity}</td>
                    <td className="text-right py-2">${item.price.toFixed(2)}</td>
                    <td className="text-right py-2 font-semibold">${item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="border-t border-gray-300 pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>${ticket.subtotal.toFixed(2)}</span>
            </div>
            {ticket.discount && ticket.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Descuento:</span>
                <span>-${ticket.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
              <span>TOTAL:</span>
              <span>${ticket.total.toFixed(2)} MXN</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Método de pago:</span>
              <span>{getPaymentMethodLabel(ticket.payment_method)}</span>
            </div>
          </div>

          {/* Notas */}
          {ticket.notes && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 font-semibold mb-1">Notas:</p>
              <p className="text-sm text-gray-700">{ticket.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-gray-500 border-t border-gray-300 pt-3">
            <p className="font-semibold">¡Gracias por su preferencia!</p>
            <p className="mt-1">{business?.name || 'Sistema Acrux POS'}</p>
            <p className="mt-2 italic">Ticket generado por Sistema Acrux POS</p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="p-4 border-t bg-gray-50 flex gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            <Printer size={20} />
            Imprimir
          </button>
          {ticket.customer_phone && (
            <button
              onClick={handleWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
            >
              <Send size={20} />
              WhatsApp
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Estilos para impresión */}
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 5mm;
          }
          
          body * {
            visibility: hidden;
          }
          
          #printable-ticket,
          #printable-ticket * {
            visibility: visible;
          }
          
          #printable-ticket {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            padding: 0;
            margin: 0;
          }
          
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}