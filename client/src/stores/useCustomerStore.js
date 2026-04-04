import { create } from 'zustand';

const useCustomerStore = create((set, get) => ({
  // Session & restaurant info
  tenantId: null,
  tableNumber: null,
  sessionToken: null,
  restaurantName: '',
  currency: 'INR',
  taxRate: 0,
  taxLabel: 'GST',
  geofence: null,
  locationVerified: false,

  // Cart
  items: [],

  // Order tracking
  currentOrderId: null,
  currentOrderNumber: null,
  orderHistory: [],

  // Initialize session data
  setSession: (data) =>
    set({
      tenantId: data.tenantId,
      tableNumber: data.tableNumber,
      sessionToken: data.sessionToken,
      restaurantName: data.restaurantName,
      currency: data.currency || 'INR',
      taxRate: data.taxRate || 0,
      taxLabel: data.taxLabel || 'GST',
      geofence: data.geofence || null,
    }),

  setLocationVerified: (v) => set({ locationVerified: v }),

  // Cart operations
  addItem: (product, quantity = 1, selectedAddons = [], note = '') => {
    const items = get().items;
    // Generate a unique key based on product + addons combo
    const addonKey = selectedAddons.map((a) => a.id).sort().join(',');
    const key = `${product.id}_${addonKey}`;

    const existing = items.find((i) => i.key === key);

    if (existing) {
      set({
        items: items.map((i) =>
          i.key === key ? { ...i, quantity: i.quantity + quantity } : i
        ),
      });
    } else {
      const addonTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
      set({
        items: [
          ...items,
          {
            key,
            productId: product.id,
            name: product.name,
            image: product.image,
            basePrice: product.price,
            price: product.price + addonTotal,
            quantity,
            addons: selectedAddons,
            note,
            vegType: product.vegType,
          },
        ],
      });
    }
  },

  removeItem: (key) => {
    set({ items: get().items.filter((i) => i.key !== key) });
  },

  updateQuantity: (key, quantity) => {
    if (quantity <= 0) {
      get().removeItem(key);
      return;
    }
    set({
      items: get().items.map((i) => (i.key === key ? { ...i, quantity } : i)),
    });
  },

  clearCart: () => set({ items: [] }),

  getSubtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

  getTax: () => {
    const subtotal = get().getSubtotal();
    return subtotal * (get().taxRate / 100);
  },

  getTotal: () => {
    return get().getSubtotal() + get().getTax();
  },

  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  // Order tracking
  setCurrentOrder: (orderId, orderNumber) =>
    set({ currentOrderId: orderId, currentOrderNumber: orderNumber }),

  addToHistory: (order) =>
    set({ orderHistory: [order, ...get().orderHistory] }),

  // Reset everything
  resetSession: () =>
    set({
      tenantId: null,
      tableNumber: null,
      sessionToken: null,
      restaurantName: '',
      currency: 'INR',
      taxRate: 0,
      taxLabel: 'GST',
      geofence: null,
      locationVerified: false,
      items: [],
      currentOrderId: null,
      currentOrderNumber: null,
      orderHistory: [],
    }),
}));

export default useCustomerStore;
