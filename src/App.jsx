import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { CatalogProvider } from './context/CatalogContext';

// Components
import Header from './components/common/Header';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Toast from './components/common/Toast';
import LocationModal from './components/location/LocationModal';

// Pages
import HomePage from './pages/HomePage';
import CategoriesPage from './pages/CategoriesPage';
import ProductListingPage from './pages/ProductListingPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import MyOrdersPage from './pages/MyOrdersPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Scroll to top helper on route change
function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, search]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <CatalogProvider>
          <CartProvider>
            <Router>
              <ScrollToTop />
              <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Header />
                <Navbar />

              <main className="main-wrapper" id="main-content">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/categories" element={<CategoriesPage />} />
                  <Route path="/products" element={<ProductListingPage />} />
                  <Route path="/product/:id" element={<ProductDetailsPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/orders" element={<MyOrdersPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  {/* Fallback route */}
                  <Route path="*" element={<HomePage />} />
                </Routes>
              </main>

              <Footer />
              <Toast />
              <LocationModal />
            </div>
          </Router>
          </CartProvider>
        </CatalogProvider>
      </LocationProvider>
    </AuthProvider>
  );
}
