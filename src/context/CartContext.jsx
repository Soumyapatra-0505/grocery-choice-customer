import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

const CART_STORAGE_KEY = 'grocery_choice_cart';
const FREE_DELIVERY_THRESHOLD = 199;
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
    const stockQty = Number(product.stockQuantity !== undefined ? product.stockQuantity : product.stockCount !== undefined ? product.stockCount : 99);
    const isOutOfStock = product.stockStatus === 'out_of_stock' || stockQty <= 0 || product.active === false;

    if (isOutOfStock) {
      showToast(`${product.name} is currently out of stock!`, 'error');
      return;
    }

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => String(item.id) === String(product.id));
      if (existingIndex > -1) {
        const updated = [...prevItems];
        const currentQty = updated[existingIndex].quantity;
        const availableStock = stockQty;

        let newQty = currentQty + quantity;
        if (availableStock > 0 && newQty > availableStock) {
          newQty = availableStock;
          showToast(`Maximum available stock (${availableStock}) reached for "${product.name}"`, 'warning');
        } else {
          showToast(`Updated "${product.name}" quantity to ${newQty}`);
        }

        updated[existingIndex] = { ...updated[existingIndex], quantity: newQty };
        return updated;
      } else {
        const availableStock = stockQty;
        let finalQty = quantity;
        if (availableStock > 0 && finalQty > availableStock) {
          finalQty = availableStock;
        }
        showToast(`Added "${product.name}" to cart!`);
        return [...prevItems, { ...product, quantity: finalQty }];
      }
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (String(item.id) === String(productId)) {
          const maxStock = Number(item.stockQuantity !== undefined ? item.stockQuantity : item.stockCount !== undefined ? item.stockCount : 99);
          if (maxStock > 0 && quantity > maxStock) {
            showToast(`Maximum available stock is ${maxStock}`, 'warning');
            return { ...item, quantity: maxStock };
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) => {
      const item = prevItems.find((i) => String(i.id) === String(productId));
      if (item) {
        showToast(`Removed "${item.name}" from cart`, 'info');
      }
      return prevItems.filter((i) => String(i.id) !== String(productId));
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const isInCart = (productId) => {
    return cartItems.some((item) => String(item.id) === String(productId));
  };

  const getItemQuantity = (productId) => {
    const item = cartItems.find((i) => String(i.id) === String(productId));
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

  const amountNeededForFreeDelivery = Math.max(0, Math.round((FREE_DELIVERY_THRESHOLD - subtotal) * 100) / 100);

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
