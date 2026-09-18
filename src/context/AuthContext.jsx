import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialOrders } from '../data/mockOrders';

const AuthContext = createContext();

const USER_STORAGE_KEY = 'grocery_choice_user';
const ORDERS_STORAGE_KEY = 'grocery_choice_orders';

export function AuthProvider({ children }) {
  // Demo default user for quick previewing
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      return saved
        ? JSON.parse(saved)
        : {
            isLoggedIn: true,
            fullName: 'Rahul Sharma',
            email: 'rahul.sharma@example.com',
            phone: '+91 98765 43210',
            address: {
              street: 'Flat 402, Green Meadows Residency, Sector 14',
              city: 'Gurugram',
              state: 'Haryana',
              pincode: '122001'
            }
          };
    } catch {
      return null;
    }
  });

  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialOrders;
    } catch {
      return initialOrders;
    }
  });

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to sync user state', e);
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {
      console.error('Failed to sync orders state', e);
    }
  }, [orders]);

  const login = (identifier, _passwordOrOptions = '', name = '') => {
    let targetIdentifier = identifier;
    let customName = name;
    if (typeof identifier === 'object' && identifier !== null) {
      targetIdentifier = identifier.identifier || identifier.email || identifier.phone;
      customName = identifier.name || name;
    }

    const trimmed = String(targetIdentifier || '').trim();
    const isPhone = !trimmed.includes('@') && /^\+?[\d\s-]{8,}$/.test(trimmed);
    const digitsOnly = trimmed.replace(/\D/g, '');
    const cleanPhone = isPhone
      ? (digitsOnly.length === 10 ? `+91 ${digitsOnly}` : `+${digitsOnly}`)
      : (user?.phone || '+91 98765 43210');
    const cleanEmail = isPhone
      ? (user?.email || `customer.${digitsOnly.slice(-4)}@grocerychoice.com`)
      : trimmed;
    const displayName = customName || (isPhone ? `Customer ${digitsOnly.slice(-4)}` : trimmed.split('@')[0]);

    const newUser = {
      isLoggedIn: true,
      fullName: displayName.charAt(0).toUpperCase() + displayName.slice(1),
      email: cleanEmail,
      phone: cleanPhone,
      authMethod: isPhone ? 'mobile_otp' : 'email_otp',
      address: user?.address || {
        street: 'Flat 402, Green Meadows Residency, Sector 14',
        city: 'Gurugram',
        state: 'Haryana',
        pincode: '122001'
      }
    };
    setUser(newUser);
    return newUser;
  };

  const loginWithOtp = (identifier, meta = {}) => {
    return login(identifier, '', meta.name || '');
  };

  const register = (fullName, email, phone, _password) => {
    const newUser = {
      isLoggedIn: true,
      fullName,
      email,
      phone: phone || '+91 98765 43210',
      address: {
        street: '12-B, Sunshine Avenues',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560034'
      }
    };
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    setUser(null);
  };

  const placeOrder = (orderData) => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newOrder = {
      id: `GC-2026-${randomSuffix}`,
      date: new Date().toISOString(),
      formattedDate: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      status: 'Order Placed',
      statusStep: 1, // 1: Placed, 2: Packed, 3: Out for Delivery, 4: Delivered
      ...orderData
    };

    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  };

  const value = {
    user,
    isLoggedIn: !!user?.isLoggedIn,
    login,
    loginWithOtp,
    register,
    logout,
    orders,
    placeOrder
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
