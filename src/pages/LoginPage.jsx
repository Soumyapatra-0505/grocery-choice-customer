import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Button from '../components/common/Button';
import Logo from '../assets/Logo';
import { LogIn, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('rahul.sharma@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { showToast } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from || '/';

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    login(email, password);
    showToast('Signed in successfully! Welcome to Grocery Choice.');
    navigate(redirectPath);
  };

  const handleDemoLogin = () => {
    login('rahul.sharma@example.com', 'demo', 'Rahul Sharma');
    showToast('Welcome, Rahul! Signed in with Demo Account.');
    navigate(redirectPath);
  };

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '4rem', maxWidth: '460px' }}>
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: '2.5rem',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', marginBottom: '1rem' }}>
            <Logo size="large" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
            Welcome Back
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
            Sign in to access your saved addresses &amp; order history
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.25rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="loginEmail" className="form-label">Email Address</label>
            <input
              id="loginEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="e.g. rahul@example.com"
              autoComplete="email"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="loginPassword" className="form-label">Password</label>
            <input
              id="loginPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            icon={<LogIn size={18} />}
          >
            Sign In
          </Button>

          {/* Quick Demo Login Option */}
          <div style={{ marginTop: '1rem' }}>
            <button
              type="button"
              onClick={handleDemoLogin}
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center', fontWeight: 700 }}
            >
              <Sparkles size={16} />
              <span>Instant One-Click Demo Login</span>
            </button>
          </div>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.88rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
          Don't have an account yet?{' '}
          <Link to="/register" style={{ color: '#059669', fontWeight: 700 }}>
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
