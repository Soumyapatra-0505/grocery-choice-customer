import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../../assets/Logo';
import { ShieldCheck, Truck, RotateCcw, Award, Phone, Mail } from 'lucide-react';

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
              <div className="feature-title">⚡ Superfast Delivery</div>
              <div className="feature-desc">Fresh groceries delivered in 15–30 minutes right to your doorstep.</div>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon-wrap">
              <Award size={22} />
            </div>
            <div>
              <div className="feature-title">🎉 Free Delivery on ₹199+</div>
              <div className="feature-desc">Enjoy free doorstep delivery on all eligible orders over ₹199.</div>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon-wrap">
              <RotateCcw size={22} />
            </div>
            <div>
              <div className="feature-title">✨ 100% Quality Guaranteed</div>
              <div className="feature-desc">Freshly harvested fruits, dairy, and farm produce inspected for purity.</div>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon-wrap">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="feature-title">🔒 Verified &amp; Safe Checkout</div>
              <div className="feature-desc">Secure UPI, Cards, Net Banking, and Cash on Delivery payments.</div>
            </div>
          </div>
        </div>

        {/* 4 Professional Footer Columns */}
        <div className="footer-columns">
          {/* Column 1: Grocery Choice */}
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <Logo size="medium" />
            </div>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#94a3b8', marginBottom: '1.25rem' }}>
              Grocery Choice is your trusted online neighborhood grocery supermarket. Fresh essentials, farm-picked produce, dairy, and household goods at honest prices.
            </p>
            <ul className="footer-links">
              <li><Link to="/products">About Us</Link></li>
              <li><a href="mailto:care@grocerychoice.com">Contact Us</a></li>
              <li><span style={{ cursor: 'pointer', color: '#94a3b8' }}>Careers</span></li>
            </ul>
          </div>

          {/* Column 2: Customer Support */}
          <div>
            <h3 className="footer-heading">Customer Support</h3>
            <ul className="footer-links">
              <li><span style={{ cursor: 'pointer', color: '#cbd5e1' }}>Help Center</span></li>
              <li><span style={{ cursor: 'pointer', color: '#cbd5e1' }}>Delivery Information</span></li>
              <li><span style={{ cursor: 'pointer', color: '#cbd5e1' }}>Returns &amp; Refunds</span></li>
              <li><span style={{ cursor: 'pointer', color: '#cbd5e1' }}>Payment Information</span></li>
            </ul>
            <div style={{ marginTop: '1.25rem', fontSize: '0.82rem', color: '#94a3b8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                <Phone size={14} color="#34d399" />
                <span>1800-123-CHOICE (Toll-Free)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Mail size={14} color="#34d399" />
                <span>care@grocerychoice.com</span>
              </div>
            </div>
          </div>

          {/* Column 3: Quick Links */}
          <div>
            <h3 className="footer-heading">Quick Links</h3>
            <ul className="footer-links">
              <li><Link to="/categories">Categories</Link></li>
              <li><Link to="/orders">My Orders</Link></li>
              <li><Link to="/profile">My Account</Link></li>
              <li><Link to="/cart">Cart</Link></li>
              <li><Link to="/products">All Groceries</Link></li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h3 className="footer-heading">Legal</h3>
            <ul className="footer-links">
              <li><span style={{ cursor: 'pointer', color: '#cbd5e1' }}>Privacy Policy</span></li>
              <li><span style={{ cursor: 'pointer', color: '#cbd5e1' }}>Terms &amp; Conditions</span></li>
              <li><span style={{ cursor: 'pointer', color: '#cbd5e1' }}>Cancellation &amp; Refund Policy</span></li>
            </ul>
            <div style={{ marginTop: '1.25rem', backgroundColor: '#1e293b', padding: '0.85rem', borderRadius: '10px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 700 }}>FSSAI Certified</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                Lic. No. 10821001000452 • 100% Quality &amp; Hygiene Assured
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom: © Grocery Choice & Tagline */}
        <div className="footer-bottom">
          <div style={{ fontWeight: 600 }}>
            &copy; {new Date().getFullYear()} Grocery Choice. All rights reserved.
          </div>
          <div style={{ color: '#34d399', fontWeight: 700, fontSize: '0.9rem' }}>
            &ldquo;Quality groceries. Better choice.&rdquo;
          </div>
        </div>
      </div>
    </footer>
  );
}
