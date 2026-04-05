import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Download } from 'lucide-react';
import BillReceipt from './BillReceipt';
import api from '../config/api';

export default function BillModal({ order, onClose }) {
  const receiptRef = useRef(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      setSettings(data.data);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank', 'width=400,height=700');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill - ${order?.orderNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', Courier, monospace; font-size: 12px; color: #111; }
            .receipt { width: 80mm; margin: 0 auto; padding: 8mm 4mm; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            .divider { border-top: 1px dashed #999; margin: 6px 0; }
            .line { border-top: 1px solid #ccc; margin: 4px 0; }
            .flex { display: flex; justify-content: space-between; }
            .items-table { width: 100%; }
            .items-table td { padding: 1px 0; vertical-align: top; }
            .items-table .qty { text-align: center; width: 30px; }
            .items-table .rate { text-align: right; width: 50px; }
            .items-table .amount { text-align: right; width: 60px; font-weight: 500; }
            .logo { max-height: 40px; margin: 0 auto 4px; display: block; }
            .store-name { font-size: 16px; font-weight: bold; letter-spacing: 1px; }
            .small { font-size: 10px; color: #666; }
            .total-row { font-size: 14px; font-weight: bold; }
            .footer { font-size: 9px; color: #999; margin-top: 8px; }
            .addon { font-size: 9px; color: #888; padding-left: 8px; }
            .green { color: #16a34a; }
            @media print { body { width: 80mm; } .receipt { padding: 2mm; } }
          </style>
        </head>
        <body>
          <div class="receipt">
            ${generateReceiptHTML(order, settings)}
          </div>
          <script>window.onload = function() { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    const content = receiptRef.current;
    if (!content) return;

    // Use html2canvas-like approach via canvas
    const printWindow = window.open('', '_blank', 'width=400,height=700');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head><title>Bill - ${order?.orderNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', Courier, monospace; font-size: 12px; color: #111; background: white; }
          .receipt { width: 320px; margin: 0 auto; padding: 20px 16px; }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .uppercase { text-transform: uppercase; }
          .divider { border-top: 1px dashed #999; margin: 8px 0; }
          .line { border-top: 1px solid #ccc; margin: 4px 0; }
          .flex { display: flex; justify-content: space-between; }
          .items-table { width: 100%; }
          .items-table td { padding: 2px 0; vertical-align: top; }
          .items-table .qty { text-align: center; width: 30px; }
          .items-table .rate { text-align: right; width: 55px; }
          .items-table .amount { text-align: right; width: 65px; font-weight: 500; }
          .logo { max-height: 48px; margin: 0 auto 6px; display: block; }
          .store-name { font-size: 16px; font-weight: bold; letter-spacing: 1px; }
          .small { font-size: 10px; color: #666; }
          .total-row { font-size: 14px; font-weight: bold; }
          .footer { font-size: 9px; color: #999; margin-top: 10px; }
          .addon { font-size: 9px; color: #888; padding-left: 8px; }
          .green { color: #16a34a; }
        </style>
        </head>
        <body>
          <div class="receipt">
            ${generateReceiptHTML(order, settings)}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!order) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gray-100 rounded-2xl shadow-2xl max-w-sm w-full max-h-[90vh] flex flex-col"
        >
          {/* Modal header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 className="font-bold text-gray-800">Bill Receipt</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-700 transition"
              >
                <Printer size={14} /> Print
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-300 transition"
              >
                <Download size={14} /> Open
              </button>
              <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Receipt preview */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="shadow-lg rounded-lg overflow-hidden">
              <BillReceipt ref={receiptRef} order={order} settings={settings} />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/** Generate pure HTML receipt for print/download */
function generateReceiptHTML(order, settings) {
  const sym = settings?.currency === 'INR' ? '₹' : settings?.currency || '₹';
  const date = order?.createdAt ? new Date(order.createdAt) : new Date();

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  let itemsHTML = '';
  (order?.items || []).forEach((item) => {
    const name = item.product?.name || item.name || 'Item';
    const qty = item.quantity;
    const rate = item.price;
    const amount = rate * qty;
    itemsHTML += `
      <tr>
        <td>${name}</td>
        <td class="qty">${qty}</td>
        <td class="rate">${rate.toFixed(2)}</td>
        <td class="amount">${amount.toFixed(2)}</td>
      </tr>
    `;
    if (item.addons) {
      try {
        const addons = typeof item.addons === 'string' ? JSON.parse(item.addons) : item.addons;
        if (Array.isArray(addons) && addons.length > 0) {
          itemsHTML += `<tr><td colspan="4" class="addon">+ ${addons.map(a => a.name).join(', ')}</td></tr>`;
        }
      } catch {}
    }
  });

  const totalItems = (order?.items || []).reduce((s, i) => s + i.quantity, 0);

  return `
    <div class="text-center">
      ${settings?.storeLogo ? `<img src="${settings.storeLogo}" class="logo" alt="Logo" />` : ''}
      <div class="store-name uppercase">${settings?.storeName || 'Restaurant'}</div>
      ${settings?.storeAddress ? `<div class="small" style="margin-top:2px;white-space:pre-line">${settings.storeAddress}</div>` : ''}
      ${settings?.storePhone ? `<div class="small">Tel: ${settings.storePhone}</div>` : ''}
    </div>

    ${settings?.gstNumber || settings?.fssaiNumber ? `
      <div class="text-center small" style="margin-top:4px">
        ${settings.gstNumber ? `<div>GSTIN: ${settings.gstNumber}</div>` : ''}
        ${settings.fssaiNumber ? `<div>FSSAI: ${settings.fssaiNumber}</div>` : ''}
      </div>
    ` : ''}

    <div class="divider"></div>

    <div class="flex small">
      <span>Order: <strong>${order?.orderNumber || ''}</strong></span>
      <span>${formatDate(date)}</span>
    </div>
    <div class="flex small">
      <span>${order?.orderSource === 'QR' ? `Table: ${order.tableNumber}` : order?.cashier?.name ? `Cashier: ${order.cashier.name}` : ''}</span>
      <span>${formatTime(date)}</span>
    </div>

    ${order?.note && order.orderSource === 'QR' ? `<div class="small" style="margin-top:2px">${order.note}</div>` : ''}

    <div class="divider"></div>

    <div class="flex" style="font-weight:bold;margin-bottom:2px">
      <span style="flex:1">ITEM</span>
      <span style="width:30px;text-align:center">QTY</span>
      <span style="width:50px;text-align:right">RATE</span>
      <span style="width:60px;text-align:right">AMT</span>
    </div>
    <div class="line"></div>

    <table class="items-table">${itemsHTML}</table>

    <div class="divider"></div>

    <div class="flex"><span>Subtotal</span><span>${sym}${order?.subtotal?.toFixed(2)}</span></div>

    ${order?.discount > 0 ? `<div class="flex green"><span>Discount</span><span>-${sym}${order.discount.toFixed(2)}</span></div>` : ''}

    ${order?.tax > 0 ? `<div class="flex"><span>${settings?.taxLabel || 'Tax'} (${settings?.taxRate || 0}%)</span><span>${sym}${order.tax.toFixed(2)}</span></div>` : ''}

    <div class="line"></div>
    <div class="flex total-row"><span>TOTAL</span><span>${sym}${order?.totalAmount?.toFixed(2)}</span></div>
    <div class="flex small" style="margin-top:4px"><span>Payment</span><span>${order?.paymentMethod || 'CASH'}</span></div>

    <div class="divider"></div>

    <div class="text-center small">Total Items: ${totalItems}</div>

    <div class="text-center footer">
      ${settings?.receiptNote ? `<div style="font-style:italic;margin-bottom:4px">${settings.receiptNote}</div>` : ''}
      <div>*** Thank You, Visit Again ***</div>
    </div>
  `;
}
