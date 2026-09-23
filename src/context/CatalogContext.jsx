import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { categoryApi, productApi, normalizeCategory, normalizeProduct } from '../services/api';

const CatalogContext = createContext();

export function CatalogProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all active categories from backend MySQL
  const fetchCategories = useCallback(async () => {
    try {
      const data = await categoryApi.getAll();
      const normalized = (Array.isArray(data) ? data : []).map(normalizeCategory);
      setCategories(normalized);
      return normalized;
    } catch (err) {
      console.warn('Backend categories fetch error:', err.message);
      throw err;
    }
  }, []);

  // Fetch all active products from backend MySQL
  const fetchProducts = useCallback(async () => {
    try {
      const data = await productApi.getAll();
      const normalized = (Array.isArray(data) ? data : []).map(normalizeProduct);
      setProducts(normalized);
      return normalized;
    } catch (err) {
      console.warn('Backend products fetch error:', err.message);
      throw err;
    }
  }, []);

  // Load both categories and products initially
  const loadInitialData = useCallback(async () => {
    try {
      setError(null);
      const [cats, prods] = await Promise.all([
        categoryApi.getAll(),
        productApi.getAll()
      ]);
      setCategories(Array.isArray(cats) ? cats : []);
      setProducts(Array.isArray(prods) ? prods : []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Unable to connect to Grocery Choice server.');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshCatalog = useCallback(async () => {
    setLoading(true);
    await loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        setError(null);
        const [cats, prods] = await Promise.all([
          categoryApi.getAll(),
          productApi.getAll()
        ]);
        if (!ignore) {
          setCategories(Array.isArray(cats) ? cats : []);
          setProducts(Array.isArray(prods) ? prods : []);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Unable to connect to Grocery Choice server.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);



  // Filter products by category ID
  const filterByCategory = useCallback(async (categoryId) => {
    try {
      if (!categoryId || categoryId === 'all') {
        const data = await productApi.getAll();
        return (Array.isArray(data) ? data : []).map(normalizeProduct);
      }
      const data = await productApi.getByCategory(categoryId);
      return (Array.isArray(data) ? data : []).map(normalizeProduct);
    } catch (err) {
      console.warn('Category filter error:', err.message);
      throw err;
    }
  }, []);

  // Search products by text query
  const searchProducts = useCallback(async (query) => {
    try {
      if (!query || !query.trim()) {
        const data = await productApi.getAll();
        return (Array.isArray(data) ? data : []).map(normalizeProduct);
      }
      const data = await productApi.search(query.trim());
      return (Array.isArray(data) ? data : []).map(normalizeProduct);
    } catch (err) {
      console.warn('Product search error:', err.message);
      throw err;
    }
  }, []);

  // Get product by ID
  const getProductById = useCallback(async (id) => {
    try {
      const data = await productApi.getById(id);
      return normalizeProduct(data);
    } catch (err) {
      console.warn(`Product getById(${id}) error:`, err.message);
      throw err;
    }
  }, []);

  const value = {
    categories,
    products,
    loading,
    error,
    loadInitialData,
    refreshCatalog,
    fetchCategories,
    fetchProducts,
    filterByCategory,
    searchProducts,
    getProductById
  };

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }
  return context;
}
