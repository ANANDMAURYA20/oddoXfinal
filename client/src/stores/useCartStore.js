import { create } from 'zustand';

const useCartStore = create((set, get) => ({
  items: [],
  discount: 0,
  discountCode: '',
  taxRate: 0,

  // Order type & table management
  orderType: 'takeaway', // 'dine-in' | 'takeaway'
  activeTable: null, // table number currently being served
  heldTables: {}, // { [tableNumber]: { items, discount, discountCode, kotSent (bool), kotItems (items already sent to kitchen) } }

  setOrderType: (type) => {
    const current = get().orderType;
    if (current === type) return;

    // If switching from dine-in to takeaway, save current table if any
    const activeTable = get().activeTable;
    if (current === 'dine-in' && activeTable && get().items.length > 0) {
      get().holdTable(activeTable);
    }

    set({ orderType: type, activeTable: type === 'takeaway' ? null : get().activeTable });
  },

  selectTable: (tableNumber) => {
    const currentTable = get().activeTable;
    const currentItems = get().items;

    // Save current table's cart if switching tables
    if (currentTable && currentTable !== tableNumber && currentItems.length > 0) {
      get().holdTable(currentTable);
    }

    // Resume held table or start fresh
    const held = get().heldTables[tableNumber];
    if (held) {
      set({
        activeTable: tableNumber,
        items: held.items,
        discount: held.discount || 0,
        discountCode: held.discountCode || '',
      });
    } else {
      set({
        activeTable: tableNumber,
        items: currentTable === tableNumber ? currentItems : [],
        discount: currentTable === tableNumber ? get().discount : 0,
        discountCode: currentTable === tableNumber ? get().discountCode : '',
      });
    }
  },

  holdTable: (tableNumber) => {
    const tbl = tableNumber || get().activeTable;
    if (!tbl) return;

    const existing = get().heldTables[tbl];
    set({
      heldTables: {
        ...get().heldTables,
        [tbl]: {
          items: get().items,
          discount: get().discount,
          discountCode: get().discountCode,
          kotSent: existing?.kotSent || false,
          kotItems: existing?.kotItems || [],
        },
      },
      items: [],
      discount: 0,
      discountCode: '',
      activeTable: null,
    });
  },

  // Mark current items as sent to kitchen (KOT)
  sendKot: () => {
    const tbl = get().activeTable;
    if (!tbl) return;

    const existing = get().heldTables[tbl];
    const allKotItems = [...(existing?.kotItems || [])];

    // Add current items to KOT list (merge quantities if same product)
    for (const item of get().items) {
      const existingKot = allKotItems.find((k) => k.productId === item.productId);
      if (existingKot) {
        existingKot.quantity = item.quantity;
      } else {
        allKotItems.push({ ...item });
      }
    }

    set({
      heldTables: {
        ...get().heldTables,
        [tbl]: {
          items: get().items,
          discount: get().discount,
          discountCode: get().discountCode,
          kotSent: true,
          kotItems: allKotItems,
        },
      },
    });

    return allKotItems;
  },

  // Release table after checkout
  releaseTable: (tableNumber) => {
    const tbl = tableNumber || get().activeTable;
    if (!tbl) return;
    const newHeld = { ...get().heldTables };
    delete newHeld[tbl];
    set({
      heldTables: newHeld,
      activeTable: get().activeTable === tbl ? null : get().activeTable,
    });
  },

  getTableStatus: (tableNumber) => {
    if (get().activeTable === tableNumber) return 'active';
    if (get().heldTables[tableNumber]) {
      return get().heldTables[tableNumber].kotSent ? 'kot-sent' : 'occupied';
    }
    return 'free';
  },

  addItem: (product) => {
    const items = get().items;
    const existing = items.find((i) => i.productId === product.id);

    if (existing) {
      set({
        items: items.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        ),
      });
    } else {
      set({
        items: [
          ...items,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            stock: product.stock,
            categoryId: product.categoryId || product.category?.id || null,
          },
        ],
      });
    }
  },

  removeItem: (productId) => {
    set({ items: get().items.filter((i) => i.productId !== productId) });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set({
      items: get().items.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      ),
    });
  },

  setDiscount: (discount, code = '') => {
    set({ discount, discountCode: code });
  },

  setTaxRate: (taxRate) => set({ taxRate }),

  clearCart: () => {
    const tbl = get().activeTable;
    if (tbl) {
      get().releaseTable(tbl);
    }
    set({ items: [], discount: 0, discountCode: '', activeTable: null });
  },

  // Computed
  get subtotal() {
    return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  },

  getSubtotal: () => {
    return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  },

  getTax: () => {
    const subtotal = get().getSubtotal();
    const discount = get().discount;
    return (subtotal - discount) * (get().taxRate / 100);
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().discount;
    const tax = get().getTax();
    return subtotal - discount + tax;
  },
}));

export default useCartStore;
