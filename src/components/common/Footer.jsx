import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../../assets/Logo';
import { ShieldCheck, Truck, RotateCcw, Award, Mail, Phone, MapPin } from 'lucide-react';
import { categories } from '../../data/categories';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="container">
        {/* Value Propositions / Trust Bar */}
        <div className="footer-top-features">
          <div className="feature-item">
            <div className="feature-icon-wrap">
              <Truck size={22} />
            </div>
            <div>
              <div className="feature-title">Lightning Delivery</div>
              <div className="feature-desc">Freshly harvested orders delivered in 15-30 minutes right to your kitchen.</div>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon-wrap">
              <Award size={22} />
            </div>
            <div>
              <div className="feature-title">100% Quality Choice</div>
              <div className="feature-desc">Hand-sorted produce, certified organic staples, and rigorous freshness checks.</div>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon-wrap">
              <RotateCcw size={22} />
            </div>
            <div>
              <div className="feature-title">No-Questions Return</div>
              <div className="feature-desc">Instant refund or replacement right at your doorstep if you are not delighted.</div>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon-wrap">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="feature-title">Secure &amp; Hygienic</div>
              <div className="feature-desc">Sanitized eco-friendly packaging and temperature-controlled storage.</div>
            </div>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="footer-columns">
          {/* Brand Info */}
          <div>
            <div style={{ marginBottom: '1.2rem' }}>
              <Logo size="medium" />
            </div>
            <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: '#94a3b8', marginBottom: '1.5rem', maxWidth: '340px' }}>
              Grocery Choice is your everyday neighborhood digital supermarket. We connect local farmers and trusted brands to bring wholesome, affordable food to every family.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.84rem', color: '#94a3b8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={15} color="#34d399" />
                <span>+91 1800-123-CHOICE (Toll Free)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={15} color="#34d399" />
                <span>care@grocerychoice.com</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={15} color="#34d399" />
                <span>Sector 14 Hub, Gurugram, NCR 122001</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="footer-heading">Quick Links</h3>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/categories">All Categories</Link></li>
              <li><Link to="/products">Browse All Products</Link></li>
              <li><Link to="/products?deal=true">Hot Deals &amp; Discounts</Link></li>
              <li><Link to="/cart">My Shopping Cart</Link></li>
              <li><Link to="/orders">Track My Orders</Link></li>
            </ul>
          </div>

          {/* Top Departments */}
          <div>
            <h3 className="footer-heading">Top Categories</h3>
            <ul className="footer-links">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <Link to={`/products?category=${cat.id}`}>{cat.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Service Commitment & Hours */}
          <div>
            <h3 className="footer-heading">Service Hours</h3>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#94a3b8', marginBottom: '1rem' }}>
              Open every single day from <strong style={{ color: 'white' }}>6:00 AM to 11:30 PM</strong>. Orders placed late are scheduled for early morning delivery.
            </p>
            <div style={{ backgroundColor: '#1e293b', padding: '1rem', borderRadius: '10px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600 }}>Zero Waste Initiative 🌿</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                Hand your cloth delivery bags back to our rider for a ₹10 cashback credit!
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom Strip */}
        <div className="footer-bottom">
          <div>
            &copy; {new Date().getFullYear()} Grocery Choice Inc. All rights reserved. Built with pride for fresh living.
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>FSSAI Lic. #10821001000452</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
