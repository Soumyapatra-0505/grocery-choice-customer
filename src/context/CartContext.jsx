import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

const CART_STORAGE_KEY = 'grocery_choice_cart';
const FREE_DELIVERY_THRESHOLD = 499;
const STANDARD_DELIVERY_FEE = 40;

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse cart from localStorage', e);
      return [];
    }
  });

  const [toast, setToast] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cartItems]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast((prev) => (prev?.id === toast?.id ? null : prev));
    }, 2800);
  };

  const closeToast = () => {
    setToast(null);
  };

  const addToCart = (product, quantity = 1) => {
    if (product.stockStatus === 'out_of_stock') {
      showToast(`${product.name} is currently out of stock!`, 'error');
      return;
    }

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = { ...updated[existingIndex], quantity: newQty };
        showToast(`Updated "${product.name}" quantity to ${newQty}`);
        return updated;
      } else {
        showToast(`Added "${product.name}" to cart!`);
        return [...prevItems, { ...product, quantity }];
      }
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) => (item.id === productId ? { ...item, quantity } : item))
    );
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) => {
      const item = prevItems.find((i) => i.id === productId);
      if (item) {
        showToast(`Removed "${item.name}" from cart`, 'info');
      }
      return prevItems.filter((i) => i.id !== productId);
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const isInCart = (productId) => {
    return cartItems.some((item) => item.id === productId);
  };

  const getItemQuantity = (productId) => {
    const item = cartItems.find((i) => i.id === productId);
    return item ? item.quantity : 0;
  };

  // Calculations
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  
  const subtotal = cartItems.reduce(
    (acc, item) => acc + (item.discountPrice || item.price) * item.quantity,
    0
  );

  const totalOriginalPrice = cartItems.reduce(
    (acc, item) => acc + (item.originalPrice || item.discountPrice || item.price) * item.quantity,
    0
  );

  const discountSavings = Math.max(0, totalOriginalPrice - subtotal);

  const deliveryFee = totalItems > 0 && subtotal < FREE_DELIVERY_THRESHOLD ? STANDARD_DELIVERY_FEE : 0;

  const grandTotal = totalItems > 0 ? subtotal + deliveryFee : 0;

  const amountNeededForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isInCart,
    getItemQuantity,
    totalItems,
    subtotal,
    totalOriginalPrice,
    discountSavings,
    deliveryFee,
    grandTotal,
    freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
    amountNeededForFreeDelivery,
    toast,
    showToast,
    closeToast
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
