import { create } from 'zustand';

const useCartStore = create((set, get) => ({
  items: [],
  discount: 0,
  discountCode: '',
  taxRate: 0,

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

  clearCart: () => set({ items: [], discount: 0, discountCode: '' }),

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
