import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialOrders } from '../data/mockOrders';
import { authApi } from '../services/api';

const AuthContext = createContext();

const USER_STORAGE_KEY = 'grocery_choice_user';
const TOKEN_STORAGE_KEY = 'grocery_choice_token';
const ORDERS_STORAGE_KEY = 'grocery_choice_orders';

export function AuthProvider({ children }) {
  // Restore saved authenticated user session ONLY when both token and user profile exist
  const [user, setUser] = useState(() => {
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(USER_STORAGE_KEY) : null;
      if (token && saved) {
        const parsed = JSON.parse(saved);
        return parsed && typeof parsed === 'object' ? parsed : null;
      }
      return null;
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

  // Verify and sync user profile with backend on startup if token exists
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      authApi.getProfile()
        .then((profile) => {
          if (profile && profile.id) {
            setUser((prev) => ({
              ...prev,
              id: profile.id,
              fullName: profile.fullName || prev?.fullName,
              email: profile.email || prev?.email,
              phone: profile.phone || prev?.phone,
              gender: profile.gender !== undefined ? profile.gender : prev?.gender,
              dateOfBirth: profile.dateOfBirth !== undefined ? profile.dateOfBirth : prev?.dateOfBirth,
              role: profile.role || 'ROLE_CUSTOMER',
              isLoggedIn: true
            }));
          }
        })
        .catch((err) => {
          console.debug('Session check note:', err.message);
        });
    }
  }, []);

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

  const login = (userDataOrIdentifier, tokenOrOptions = '', name = '') => {
    let token = null;
    let targetUser = null;

    if (typeof userDataOrIdentifier === 'object' && userDataOrIdentifier !== null) {
      if (typeof tokenOrOptions === 'string' && tokenOrOptions.length > 20) {
        token = tokenOrOptions;
      } else if (userDataOrIdentifier.token) {
        token = userDataOrIdentifier.token;
      }

      const u = userDataOrIdentifier.user || userDataOrIdentifier;
      const id = u.id || user?.id || 1;
      const fullName = u.fullName || u.name || name || 'Valued Customer';
      const email = u.email || '';
      const phone = u.phone || '';
      const role = u.role || 'ROLE_CUSTOMER';

      const savedAvatar =
        (u && u.profilePicture) ||
        (phone && localStorage.getItem(`grocery_choice_avatar_${phone}`)) ||
        (email && localStorage.getItem(`grocery_choice_avatar_${email}`)) ||
        (id && localStorage.getItem(`grocery_choice_avatar_${id}`)) ||
        localStorage.getItem('grocery_choice_avatar_default') ||
        null;

      const gender = u.gender !== undefined ? u.gender : (user?.gender || null);
      const dateOfBirth = u.dateOfBirth !== undefined ? u.dateOfBirth : (user?.dateOfBirth || null);

      targetUser = {
        id,
        fullName,
        email,
        phone,
        gender,
        dateOfBirth,
        role,
        isLoggedIn: true,
        authMethod: phone ? 'mobile_otp' : 'email_otp',
        profilePicture: savedAvatar,
        address: u.address || user?.address || {
          street: 'Flat 402, Green Meadows Residency, Sector 14',
          city: 'Gurugram',
          state: 'Haryana',
          pincode: '122001'
        }
      };
    } else {
      const trimmed = String(userDataOrIdentifier || '').trim();
      const isPhone = !trimmed.includes('@') && /^\+?[\d\s-]{8,}$/.test(trimmed);
      const digitsOnly = trimmed.replace(/\D/g, '');
      const cleanPhone = isPhone
        ? (digitsOnly.length === 10 ? `+91 ${digitsOnly}` : `+${digitsOnly}`)
        : (user?.phone || '+91 98765 43210');
      const cleanEmail = isPhone
        ? (user?.email || `customer.${digitsOnly.slice(-4)}@grocerychoice.com`)
        : trimmed;
      const displayName = name || (isPhone ? `Customer ${digitsOnly.slice(-4)}` : trimmed.split('@')[0]);

      const savedAvatar =
        localStorage.getItem(`grocery_choice_avatar_${cleanPhone}`) ||
        localStorage.getItem(`grocery_choice_avatar_${cleanEmail}`) ||
        localStorage.getItem('grocery_choice_avatar_default') ||
        null;

      targetUser = {
        id: user?.id || 1,
        isLoggedIn: true,
        fullName: displayName.charAt(0).toUpperCase() + displayName.slice(1),
        email: cleanEmail,
        phone: cleanPhone,
        gender: user?.gender || null,
        dateOfBirth: user?.dateOfBirth || null,
        role: 'ROLE_CUSTOMER',
        authMethod: isPhone ? 'mobile_otp' : 'email_otp',
        profilePicture: savedAvatar,
        address: user?.address || {
          street: 'Flat 402, Green Meadows Residency, Sector 14',
          city: 'Gurugram',
          state: 'Haryana',
          pincode: '122001'
        }
      };
    }

    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
    setUser(targetUser);
    return targetUser;
  };

  const loginWithOtp = (identifier, meta = {}) => {
    return login(identifier, meta.token || '', meta.name || '');
  };

  const register = (fullName, email, phone, _password) => {
    const newUser = {
      isLoggedIn: true,
      id: user?.id || 1,
      fullName,
      email,
      phone: phone || '+91 98765 43210',
      role: 'ROLE_CUSTOMER',
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
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
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

  const updateUserProfile = (updatedFields) => {
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
      if (token) {
        const payload = {};
        if (updatedFields.fullName !== undefined) payload.fullName = updatedFields.fullName;
        if (updatedFields.email !== undefined) payload.email = updatedFields.email;
        if (updatedFields.phone !== undefined) payload.phone = updatedFields.phone;
        if (updatedFields.gender !== undefined) payload.gender = updatedFields.gender;
        if (updatedFields.dateOfBirth !== undefined) payload.dateOfBirth = updatedFields.dateOfBirth;

        if (Object.keys(payload).length > 0) {
          authApi.updateProfile(payload).catch((err) => {
            console.debug('Backend profile sync note:', err.message);
          });
        }
      }
    } catch (e) {
      console.debug('Profile sync note:', e);
    }

    setUser((prev) => {
      if (!prev) return null;
      const updated = {
        ...prev,
        ...updatedFields
      };

      if (updatedFields.profilePicture !== undefined) {
        const avatarKeys = [
          prev.phone && `grocery_choice_avatar_${prev.phone}`,
          prev.email && `grocery_choice_avatar_${prev.email}`,
          prev.id && `grocery_choice_avatar_${prev.id}`,
          'grocery_choice_avatar_default'
        ].filter(Boolean);

        if (updatedFields.profilePicture) {
          avatarKeys.forEach((key) => {
            try {
              localStorage.setItem(key, updatedFields.profilePicture);
            } catch (e) {
              console.error('Failed to store avatar in localStorage', e);
            }
          });
        } else {
          avatarKeys.forEach((key) => {
            try {
              localStorage.removeItem(key);
            } catch (e) {
              console.error('Failed to remove avatar from localStorage', e);
            }
          });
        }
      }

      try {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to sync updated user to localStorage', e);
      }
      return updated;
    });
  };

  const hasToken = typeof localStorage !== 'undefined' ? Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)) : false;
  const isLoggedIn = Boolean(user && user.isLoggedIn && hasToken);

  const value = {
    user,
    isLoggedIn,
    login,
    loginWithOtp,
    register,
    logout,
    updateUserProfile,
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
