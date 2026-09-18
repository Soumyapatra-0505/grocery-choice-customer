import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Button from '../components/common/Button';
import Logo from '../assets/Logo';
import { UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const { register } = useAuth();
  const { showToast } = useCart();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = 'Please enter your full name';
    if (!formData.email.trim() || !formData.email.includes('@')) errs.email = 'Please enter a valid email';
    if (!formData.phone.trim()) errs.phone = 'Please enter your phone number';
    if (!formData.password || formData.password.length < 6) errs.password = 'Password must be at least 6 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    register(formData.fullName, formData.email, formData.phone, formData.password);
    showToast(`Account created! Welcome to Grocery Choice, ${formData.fullName.split(' ')[0]}.`);
    navigate('/');
  };

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '4rem', maxWidth: '480px' }}>
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
            Create Your Account
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
            Get exclusive member offers &amp; free 15-minute grocery deliveries
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="regName" className="form-label">Full Name *</label>
            <input
              id="regName"
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g. Priya Patel"
            />
            {errors.fullName && <span className="form-error">{errors.fullName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="regEmail" className="form-label">Email Address *</label>
            <input
              id="regEmail"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              placeholder="priya@example.com"
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="regPhone" className="form-label">Phone Number *</label>
            <input
              id="regPhone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="form-input"
              placeholder="+91 98765 00000"
            />
            {errors.phone && <span className="form-error">{errors.phone}</span>}
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="regPassword" className="form-label">Create Password *</label>
            <input
              id="regPassword"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              placeholder="Minimum 6 characters"
            />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            icon={<UserPlus size={18} />}
          >
            Create Account &amp; Start Shopping
          </Button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.88rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#059669', fontWeight: 700 }}>
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
