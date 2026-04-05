import { forwardRef } from 'react';
import { getImageUrl } from '../utils/imageUrl';

const BillReceipt = forwardRef(({ order, settings }, ref) => {
  const currency = settings?.currency === 'INR' ? '₹' : settings?.currency || '₹';
  const now = order?.createdAt ? new Date(order.createdAt) : new Date();

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const formatTime = (d) =>
    new Date(d).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

  return (
    <div
      ref={ref}
      className="bg-white text-gray-900 w-[320px] mx-auto font-mono text-xs"
      style={{ fontFamily: "'Courier New', Courier, monospace" }}
    >
      <div className="px-4 py-5">
        {/* Header - Logo & Store Name */}
        <div className="text-center mb-3">
          {settings?.storeLogo && (
            <div className="flex justify-center mb-2">
              <img
                src={getImageUrl(settings.storeLogo)}
                alt="Logo"
                className="h-12 w-auto object-contain"
                crossOrigin="anonymous"
              />
            </div>
          )}
          <h1 className="text-base font-bold tracking-wide uppercase">
            {settings?.storeName || 'Restaurant'}
          </h1>
          {settings?.storeAddress && (
            <p className="text-[10px] text-gray-600 mt-0.5 leading-tight whitespace-pre-line">
              {settings.storeAddress}
            </p>
          )}
          {settings?.storePhone && (
            <p className="text-[10px] text-gray-500 mt-0.5">
              Tel: {settings.storePhone}
            </p>
          )}
        </div>

        {/* GST & FSSAI */}
        {(settings?.gstNumber || settings?.fssaiNumber) && (
          <div className="text-center text-[10px] text-gray-500 mb-2">
            {settings.gstNumber && <p>GSTIN: {settings.gstNumber}</p>}
            {settings.fssaiNumber && <p>FSSAI: {settings.fssaiNumber}</p>}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-dashed border-gray-400 my-2" />

        {/* Order info */}
        <div className="flex justify-between text-[10px] text-gray-600 mb-1">
          <span>Order: <span className="font-bold text-gray-900">{order?.orderNumber}</span></span>
          <span>{formatDate(now)}</span>
        </div>
        <div className="flex justify-between text-[10px] text-gray-600 mb-1">
          <span>
            {order?.orderSource === 'QR' ? `Table: ${order.tableNumber}` : order?.cashier?.name ? `Cashier: ${order.cashier.name}` : ''}
          </span>
          <span>{formatTime(now)}</span>
        </div>

        {/* Customer info from note */}
        {order?.note && order.orderSource === 'QR' && (
          <div className="text-[10px] text-gray-600 mb-1">
            {order.note}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-dashed border-gray-400 my-2" />

        {/* Column headers */}
        <div className="flex text-[10px] font-bold text-gray-700 mb-1">
          <span className="flex-1">ITEM</span>
          <span className="w-8 text-center">QTY</span>
          <span className="w-14 text-right">RATE</span>
          <span className="w-16 text-right">AMOUNT</span>
        </div>
        <div className="border-t border-gray-300 mb-1" />

        {/* Items */}
        <div className="space-y-1">
          {order?.items?.map((item, i) => {
            const name = item.product?.name || item.name || 'Item';
            const qty = item.quantity;
            const rate = item.price;
            const amount = rate * qty;

            return (
              <div key={i}>
                <div className="flex items-start">
                  <span className="flex-1 leading-tight">{name}</span>
                  <span className="w-8 text-center">{qty}</span>
                  <span className="w-14 text-right">{rate.toFixed(2)}</span>
                  <span className="w-16 text-right font-medium">{amount.toFixed(2)}</span>
                </div>
                {/* Addons */}
                {item.addons && (() => {
                  try {
                    const addons = typeof item.addons === 'string' ? JSON.parse(item.addons) : item.addons;
                    if (Array.isArray(addons) && addons.length > 0) {
                      return (
                        <p className="text-[9px] text-gray-500 ml-2">
                          + {addons.map(a => a.name).join(', ')}
                        </p>
                      );
                    }
                  } catch { return null; }
                  return null;
                })()}
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-gray-400 my-2" />

        {/* Totals */}
        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{currency}{order?.subtotal?.toFixed(2)}</span>
          </div>

          {order?.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-{currency}{order.discount.toFixed(2)}</span>
            </div>
          )}

          {order?.tax > 0 && (
            <div className="flex justify-between">
              <span>{settings?.taxLabel || 'Tax'} ({settings?.taxRate || 0}%)</span>
              <span>{currency}{order.tax.toFixed(2)}</span>
            </div>
          )}

          <div className="border-t border-gray-300 pt-1" />

          <div className="flex justify-between font-bold text-sm">
            <span>TOTAL</span>
            <span>{currency}{order?.totalAmount?.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-[10px] text-gray-600 mt-1">
            <span>Payment</span>
            <span>{order?.paymentMethod || 'CASH'}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-gray-400 my-3" />

        {/* Items count */}
        <div className="text-center text-[10px] text-gray-500 mb-2">
          Total Items: {order?.items?.reduce((sum, i) => sum + i.quantity, 0) || 0}
        </div>

        {/* Footer */}
        <div className="text-center">
          {settings?.receiptNote && (
            <p className="text-[10px] text-gray-500 italic mb-1">
              {settings.receiptNote}
            </p>
          )}
          <p className="text-[9px] text-gray-400 mt-2">
            *** Thank You, Visit Again ***
          </p>
        </div>
      </div>
    </div>
  );
});

BillReceipt.displayName = 'BillReceipt';

export default BillReceipt;
