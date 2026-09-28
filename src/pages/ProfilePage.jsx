import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDeliveryLocation } from '../context/LocationContext';
import { useCart } from '../context/CartContext';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Package,
  ShieldCheck,
  LogOut,
  Edit2,
  Plus,
  Trash2,
  CheckCircle2,
  Star,
  X,
  Save,
  ArrowRight,
  LogIn,
  Camera,
  CreditCard,
  AlertCircle,
  Lock,
  Calendar
} from 'lucide-react';

/**
 * Formats a date string into professional display format: "15 Aug 2001".
 * Returns "Not provided" if date is null, empty, or unparseable.
 */
function formatDisplayDate(dateStr) {
  if (!dateStr) return 'Not provided';
  try {
    const clean = String(dateStr).split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      if (!isNaN(day) && monthIndex >= 0 && monthIndex < 12 && !isNaN(year)) {
        return `${day} ${months[monthIndex]} ${year}`;
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return dateStr;
  } catch {
    return dateStr || 'Not provided';
  }
}

export default function ProfilePage() {
  const { user, isLoggedIn, logout, updateUserProfile } = useAuth();
  const {
    savedLocations,
    selectedLocation,
    selectLocation,
    setDefaultAddress,
    removeLocation,
    openLocationModal
  } = useDeliveryLocation();
  const { showToast } = useCart();
  const navigate = useNavigate();

  // Tab state: 'personal' | 'addresses' | 'payments' | 'security'
  const [activeTab, setActiveTab] = useState('personal');

  // Edit Personal Information state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    gender: user?.gender || '',
    dateOfBirth: user?.dateOfBirth ? String(user.dateOfBirth).split('T')[0] : ''
  });
  const [profileErrors, setProfileErrors] = useState({});

  // Maximum allowed date for date of birth (cannot be in future)
  const maxDateOfBirth = new Date().toISOString().split('T')[0];

  // -------------------------------------------------------------
  // FEATURE 1: Profile Picture States & Handlers
  // -------------------------------------------------------------
  const fileInputRef = useRef(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Handle selecting an image file from the device
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError(null);

    // Validate file type
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimeTypes.includes(file.type)) {
      setImageError('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate file size: maximum 2MB
    const maxSizeBytes = 2 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setImageError(`File size (${sizeMb}MB) exceeds the 2MB limit. Please select a smaller photo.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Generate immediate client-side preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImagePreview(event.target.result);
    };
    reader.onerror = () => {
      setImageError('Failed to read image file. Please try another image.');
    };
    reader.readAsDataURL(file);
  };

  // Compress to lightweight square thumbnail avatar (max 160x160, ~15KB) and save
  const handleSaveProfilePicture = async () => {
    if (!selectedImagePreview) return;

    try {
      setIsProcessingImage(true);
      setImageError(null);

      const img = new Image();
      img.src = selectedImagePreview;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Canvas center-crop and resize
      const canvas = document.createElement('canvas');
      const size = Math.min(img.width, img.height);
      const startX = (img.width - size) / 2;
      const startY = (img.height - size) / 2;

      canvas.width = 160;
      canvas.height = 160;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, startX, startY, size, size, 0, 0, 160, 160);

      // Lightweight compressed avatar data URL
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

      updateUserProfile({ profilePicture: compressedDataUrl });
      setSelectedImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      showToast('Profile picture updated successfully.', 'success');
    } catch (err) {
      console.error('Failed to compress and save avatar:', err);
      setImageError('Unable to process photo. Please try a different image.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleCancelImagePreview = () => {
    setSelectedImagePreview(null);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveProfilePicture = () => {
    const confirmRemove = window.confirm('Are you sure you want to remove your profile picture and return to the default avatar?');
    if (!confirmRemove) return;

    updateUserProfile({ profilePicture: null });
    setSelectedImagePreview(null);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('Profile picture removed. Default avatar restored.', 'info');
  };

  // -------------------------------------------------------------
  // FEATURE 2: Saved Payment Methods States & Handlers
  // -------------------------------------------------------------
  const [savedPaymentMethods, setSavedPaymentMethods] = useState(() => {
    try {
      const stored = localStorage.getItem('grocery_choice_saved_payment_methods');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (m) => m && m.id && m.last4 && !m.cardNumber && !m.cvv && !m.pin
          );
        }
      }
    } catch {
      // Ignore parse errors
    }
    return [];
  });
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);

  const handleRemovePaymentMethod = (methodId) => {
    const confirmRemove = window.confirm('Are you sure you want to remove this saved payment method?');
    if (!confirmRemove) return;

    setSavedPaymentMethods((prev) => {
      const updated = prev.filter((m) => m.id !== methodId);
      try {
        localStorage.setItem('grocery_choice_saved_payment_methods', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
    showToast('Payment method removed successfully.', 'success');
  };

  // -------------------------------------------------------------
  // Personal Info Form Handlers
  // -------------------------------------------------------------
  const handleStartEdit = () => {
    setProfileForm({
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      gender: user?.gender || '',
      dateOfBirth: user?.dateOfBirth ? String(user.dateOfBirth).split('T')[0] : ''
    });
    setProfileErrors({});
    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setProfileErrors({});
  };

  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
    if (profileErrors[name]) {
      setProfileErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateProfileForm = () => {
    const errs = {};
    const trimmedName = profileForm.fullName.trim();
    if (!trimmedName) {
      errs.fullName = 'Full Name is required.';
    } else if (trimmedName.length < 2) {
      errs.fullName = 'Full Name must be at least 2 characters.';
    }

    if (profileForm.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profileForm.email.trim())) {
        errs.email = 'Please enter a valid email address.';
      }
    }

    if (profileForm.phone) {
      const cleanPhone = profileForm.phone.replace(/[\s+-]/g, '');
      if (cleanPhone.length < 10) {
        errs.phone = 'Please enter a valid phone number (at least 10 digits).';
      }
    }

    if (profileForm.dateOfBirth) {
      const selectedDate = new Date(profileForm.dateOfBirth);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) {
        errs.dateOfBirth = 'Date of birth cannot be in the future.';
      }
    }

    setProfileErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!validateProfileForm()) return;

    updateUserProfile({
      fullName: profileForm.fullName.trim(),
      email: profileForm.email.trim(),
      phone: profileForm.phone.trim(),
      gender: profileForm.gender || '',
      dateOfBirth: profileForm.dateOfBirth || ''
    });

    setIsEditingProfile(false);
    showToast('Profile information updated successfully.', 'success');
  };

  const handleLogout = () => {
    logout();
    showToast('You have signed out successfully.', 'info');
    navigate('/');
  };

  const handleDeleteAddress = async (locId) => {
    const confirmDel = window.confirm('Are you sure you want to remove this saved address?');
    if (!confirmDel) return;

    try {
      await removeLocation(locId);
      showToast('Address removed successfully.', 'success');
    } catch (err) {
      console.error('Failed to remove address:', err);
      showToast('Failed to remove address.', 'error');
    }
  };

  const handleSetDefaultAddress = async (locId) => {
    try {
      await setDefaultAddress(locId);
      showToast('Default address updated.', 'success');
    } catch (err) {
      console.error('Failed to set default address:', err);
      showToast('Failed to update default address.', 'error');
    }
  };

  const handleSelectDelivery = (loc) => {
    selectLocation(loc);
    showToast(`Active delivery address set to ${loc.city || 'selected location'}.`, 'success');
  };

  // If user is not logged in, render friendly sign-in prompt
  if (!isLoggedIn || !user) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            padding: '3rem 2rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto'
            }}
          >
            <User size={32} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
            Customer Profile
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '2rem' }}>
            Please sign in to view and manage your Grocery Choice profile, saved delivery addresses, and past orders.
          </p>
          <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem' }}>
            <LogIn size={18} />
            <span>Sign In to Continue</span>
          </Link>
        </div>
      </div>
    );
  }

  const currentDisplayAvatar = selectedImagePreview || user.profilePicture || null;

  return (
    <div className="profile-page-container container profile-page">
      <div className="profile-layout-grid profile-grid">
        {/* ========================================================= */}
        {/* LEFT COLUMN: Profile Navigation Sidebar                  */}
        {/* ========================================================= */}
        <aside className="profile-sidebar">
          <nav className="profile-sidebar-nav" aria-label="Profile Sections">
            <button
              type="button"
              onClick={() => setActiveTab('personal')}
              className={`profile-nav-item ${activeTab === 'personal' ? 'active' : ''}`}
            >
              <span className="profile-nav-icon"><User size={20} /></span>
              <span className="profile-nav-label">Personal Information</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('addresses')}
              className={`profile-nav-item ${activeTab === 'addresses' ? 'active' : ''}`}
            >
              <span className="profile-nav-icon"><MapPin size={20} /></span>
              <span className="profile-nav-label">My Addresses</span>
              <span className="profile-nav-badge">
                {savedLocations.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className={`profile-nav-item ${activeTab === 'payments' ? 'active' : ''}`}
            >
              <span className="profile-nav-icon"><CreditCard size={20} /></span>
              <span className="profile-nav-label">Payment Methods</span>
            </button>

            <Link
              to="/orders"
              className="profile-nav-item"
            >
              <span className="profile-nav-icon"><Package size={20} /></span>
              <span className="profile-nav-label">My Orders</span>
              <span className="profile-nav-arrow"><ArrowRight size={18} /></span>
            </Link>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`profile-nav-item ${activeTab === 'security' ? 'active' : ''}`}
            >
              <span className="profile-nav-icon"><ShieldCheck size={20} /></span>
              <span className="profile-nav-label">Account &amp; Security</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="profile-nav-item profile-nav-item-danger"
            >
              <span className="profile-nav-icon"><LogOut size={20} /></span>
              <span className="profile-nav-label">Sign Out</span>
            </button>
          </nav>
        </aside>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Main Profile Content                       */}
        {/* ========================================================= */}
        <main className="profile-main-content">
          {/* Compact Profile Header Card */}
          <div className="profile-header-card">
            <div className="profile-header-user">
              <div
                className="profile-header-avatar top-banner-avatar"
                title={user.fullName || 'User'}
              >
                {currentDisplayAvatar ? (
                  <img
                    src={currentDisplayAvatar}
                    alt={user.fullName || 'User'}
                  />
                ) : (
                  user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'
                )}
              </div>
              <div className="profile-header-info">
                <h1>{user.fullName || 'Valued Customer'}</h1>
                <div className="profile-header-meta">
                  {user.email && <span>{user.email}</span>}
                  {user.email && user.phone && <span className="profile-header-meta-sep">•</span>}
                  {user.phone && <span>{user.phone}</span>}
                </div>
              </div>
            </div>

            <div className="profile-header-actions">
              {activeTab === 'personal' && !isEditingProfile && (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}
                >
                  <Edit2 size={15} />
                  <span>Edit Profile</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-outline"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', color: '#ef4444', borderColor: '#fecaca' }}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* TAB 1: Personal Information & Profile Picture */}
          {activeTab === 'personal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Profile Picture Card */}
              <div className="profile-card profile-picture-section">
                <div style={{ marginBottom: '1.25rem' }}>
                  <h2 className="profile-card-title">Profile Picture</h2>
                  <p className="profile-card-subtitle">
                    Upload or update your profile picture. Accepted formats: JPEG, PNG, or WebP up to 2MB.
                  </p>
                </div>

                {/* Image Error Alert */}
                {imageError && (
                  <div
                    role="alert"
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#b91c1c',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '1.25rem'
                    }}
                  >
                    <AlertCircle size={16} />
                    <span>{imageError}</span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', flexWrap: 'wrap' }}>
                  {/* Avatar Preview Box */}
                  <div style={{ position: 'relative' }}>
                    <div
                      className="avatar-preview-box"
                      style={{
                        width: '96px',
                        height: '96px',
                        borderRadius: '50%',
                        backgroundColor: '#f8fafc',
                        border: selectedImagePreview ? '3px solid #059669' : '2px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                      }}
                    >
                      {currentDisplayAvatar ? (
                        <img
                          src={currentDisplayAvatar}
                          alt="Profile avatar preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          className="default-avatar-badge"
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#ecfdf5',
                            color: '#059669'
                          }}
                        >
                          <User size={40} strokeWidth={1.75} />
                        </div>
                      )}
                    </div>

                    {selectedImagePreview && (
                      <span
                        className="preview-badge"
                        style={{
                          position: 'absolute',
                          bottom: '-6px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          backgroundColor: '#059669',
                          color: '#ffffff',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '999px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Preview
                      </span>
                    )}
                  </div>

                  {/* Actions & File Input */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                      aria-label="Upload profile image"
                    />

                    {!selectedImagePreview ? (
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="btn btn-primary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}
                        >
                          <Camera size={16} />
                          <span>{user.profilePicture ? 'Change Picture' : 'Upload Picture'}</span>
                        </button>

                        {user.profilePicture && (
                          <button
                            type="button"
                            onClick={handleRemoveProfilePicture}
                            className="btn btn-outline"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: '#ef4444', borderColor: '#fca5a5' }}
                          >
                            <Trash2 size={15} />
                            <span>Remove Picture</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={handleSaveProfilePicture}
                          disabled={isProcessingImage}
                          className="btn btn-primary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}
                        >
                          <Save size={16} />
                          <span>{isProcessingImage ? 'Saving...' : 'Save Picture'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleCancelImagePreview}
                          disabled={isProcessingImage}
                          className="btn btn-outline"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}
                        >
                          <X size={15} />
                          <span>Cancel</span>
                        </button>
                      </div>
                    )}

                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                      Recommended: Square image, at least 300x300 pixels. Maximum file size: 2MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Personal Information Card */}
              <div className="profile-card">
                <div className="profile-card-header">
                  <div>
                    <h2 className="profile-card-title">Personal Information</h2>
                    <p className="profile-card-subtitle">
                      Manage your personal details and account information.
                    </p>
                  </div>

                  {!isEditingProfile && (
                    <button
                      type="button"
                      onClick={handleStartEdit}
                      className="btn btn-secondary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}
                    >
                      <Edit2 size={15} />
                      <span>Edit Profile</span>
                    </button>
                  )}
                </div>

                {!isEditingProfile ? (
                  /* Clean Two-Column Left-Aligned Grid */
                  <div className="personal-info-grid">
                    <div className="personal-info-field">
                      <span className="personal-info-label">
                        <User size={13} color="#059669" />
                        <span>FULL NAME</span>
                      </span>
                      <span className="personal-info-value">
                        {user.fullName || 'Not provided'}
                      </span>
                    </div>

                    <div className="personal-info-field">
                      <span className="personal-info-label">
                        <Mail size={13} color="#059669" />
                        <span>EMAIL ADDRESS</span>
                      </span>
                      <span className="personal-info-value">
                        {user.email || 'Not provided'}
                      </span>
                    </div>

                    <div className="personal-info-field">
                      <span className="personal-info-label">
                        <Phone size={13} color="#059669" />
                        <span>PHONE NUMBER</span>
                      </span>
                      <span className="personal-info-value">
                        {user.phone || 'Not provided'}
                      </span>
                    </div>

                    <div className="personal-info-field">
                      <span className="personal-info-label">
                        <User size={13} color="#059669" />
                        <span>GENDER</span>
                      </span>
                      <span className={`personal-info-value ${!user.gender ? 'empty' : ''}`}>
                        {user.gender || 'Not provided'}
                      </span>
                    </div>

                    <div className="personal-info-field">
                      <span className="personal-info-label">
                        <Calendar size={13} color="#059669" />
                        <span>DATE OF BIRTH</span>
                      </span>
                      <span className={`personal-info-value ${!user.dateOfBirth ? 'empty' : ''}`}>
                        {formatDisplayDate(user.dateOfBirth)}
                      </span>
                    </div>

                    <div className="personal-info-field">
                      <span className="personal-info-label">
                        <ShieldCheck size={13} color="#059669" />
                        <span>ACCOUNT TYPE</span>
                      </span>
                      <span className="personal-info-value">
                        {user.role === 'ROLE_CUSTOMER' || !user.role ? 'Customer' : user.role.replace('ROLE_', '')}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Two-Column Left-Aligned Edit Form */
                  <form onSubmit={handleSaveProfile} className="profile-edit-form">
                    <div className="profile-form-grid">
                      <div className="profile-form-group">
                        <label className="profile-form-label">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          value={profileForm.fullName}
                          onChange={handleProfileFormChange}
                          className={`profile-form-input ${profileErrors.fullName ? 'has-error' : ''}`}
                          placeholder="e.g. Soumya Ranjan Patra"
                        />
                        {profileErrors.fullName && (
                          <span className="profile-form-error">{profileErrors.fullName}</span>
                        )}
                      </div>

                      <div className="profile-form-group">
                        <label className="profile-form-label">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={profileForm.email}
                          onChange={handleProfileFormChange}
                          className={`profile-form-input ${profileErrors.email ? 'has-error' : ''}`}
                          placeholder="e.g. soumya@example.com"
                        />
                        {profileErrors.email && (
                          <span className="profile-form-error">{profileErrors.email}</span>
                        )}
                      </div>

                      <div className="profile-form-group">
                        <label className="profile-form-label">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={profileForm.phone}
                          onChange={handleProfileFormChange}
                          className={`profile-form-input ${profileErrors.phone ? 'has-error' : ''}`}
                          placeholder="e.g. +91 98765 43210"
                        />
                        {profileErrors.phone && (
                          <span className="profile-form-error">{profileErrors.phone}</span>
                        )}
                      </div>

                      <div className="profile-form-group">
                        <label className="profile-form-label">
                          Gender
                        </label>
                        <select
                          name="gender"
                          value={profileForm.gender}
                          onChange={handleProfileFormChange}
                          className="profile-form-select"
                          aria-label="Select Gender"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>

                      <div className="profile-form-group">
                        <label className="profile-form-label">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          name="dateOfBirth"
                          max={maxDateOfBirth}
                          value={profileForm.dateOfBirth}
                          onChange={handleProfileFormChange}
                          className={`profile-form-input ${profileErrors.dateOfBirth ? 'has-error' : ''}`}
                          aria-label="Date of Birth"
                        />
                        {profileErrors.dateOfBirth && (
                          <span className="profile-form-error">{profileErrors.dateOfBirth}</span>
                        )}
                      </div>
                    </div>

                    <div className="profile-form-actions">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="btn btn-outline"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <X size={16} />
                        <span>Cancel</span>
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <Save size={16} />
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: My Addresses */}
          {activeTab === 'addresses' && (
            <div className="profile-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 className="profile-card-title">My Delivery Addresses</h2>
                  <p className="profile-card-subtitle">
                    Manage saved addresses for quick checkout and fresh delivery dispatch.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openLocationModal('manual')}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}
                >
                  <Plus size={16} />
                  <span>Add New Address</span>
                </button>
              </div>

              {savedLocations.length === 0 ? (
                <div
                  style={{
                    padding: '3rem 1.5rem',
                    textAlign: 'center',
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px dashed #cbd5e1'
                  }}
                >
                  <MapPin size={36} color="#94a3b8" style={{ margin: '0 auto 0.75rem auto' }} />
                  <div style={{ fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>No Saved Addresses Yet</div>
                  <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                    Add your home, office, or secondary address for seamless one-click ordering.
                  </p>
                  <button
                    type="button"
                    onClick={() => openLocationModal('manual')}
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Plus size={16} />
                    <span>Add Delivery Address</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {savedLocations.map((loc) => {
                    const isDefault = Boolean(loc.isDefault);
                    const isActive = selectedLocation?.id === loc.id;

                    return (
                      <div
                        key={loc.id}
                        style={{
                          padding: '1.25rem',
                          borderRadius: '12px',
                          border: isActive ? '2px solid #059669' : '1px solid #e2e8f0',
                          backgroundColor: isActive ? '#f0fdf4' : '#ffffff',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          flexWrap: 'wrap',
                          gap: '1rem',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ flex: '1 1 300px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.98rem' }}>
                              {loc.label || (loc.type === 'geolocation' ? 'Current GPS Location' : 'Address')}
                            </span>

                            {isDefault && (
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  padding: '0.2rem 0.55rem',
                                  borderRadius: '999px',
                                  backgroundColor: '#dbeafe',
                                  color: '#1e40af',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                              >
                                <Star size={11} fill="#1e40af" />
                                <span>Default</span>
                              </span>
                            )}

                            {isActive && (
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  padding: '0.2rem 0.55rem',
                                  borderRadius: '999px',
                                  backgroundColor: '#dcfce7',
                                  color: '#166534',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                              >
                                <CheckCircle2 size={11} />
                                <span>Active Delivery</span>
                              </span>
                            )}
                          </div>

                          <p style={{ margin: '0 0 0.35rem 0', fontSize: '0.88rem', color: '#475569', lineHeight: 1.45 }}>
                            {loc.formattedAddress || `${loc.house ? loc.house + ', ' : ''}${loc.street || ''} ${loc.city || ''} ${loc.pincode || ''}`}
                          </p>

                          {loc.landmark && (
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                              <strong>Landmark:</strong> {loc.landmark}
                            </p>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => handleSelectDelivery(loc)}
                              className="btn btn-outline"
                              style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                            >
                              Deliver Here
                            </button>
                          )}

                          {!isDefault && (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultAddress(loc.id)}
                              className="btn btn-secondary"
                              style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                            >
                              Set as Default
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => openLocationModal('edit', loc)}
                            title="Edit Address"
                            className="btn btn-outline"
                            style={{ padding: '0.4rem 0.6rem', color: '#475569' }}
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(loc.id)}
                            title="Delete Address"
                            className="btn btn-outline"
                            style={{ padding: '0.4rem 0.6rem', color: '#ef4444', borderColor: '#fca5a5' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Saved Payment Methods */}
          {activeTab === 'payments' && (
            <div className="profile-card payment-methods-section">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 className="profile-card-title">Payment Methods</h2>
                  <p className="profile-card-subtitle">
                    Manage saved cards and tokenized payment methods for swift, secure checkout.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddPaymentModalOpen(true)}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}
                >
                  <Plus size={16} />
                  <span>Add Payment Method</span>
                </button>
              </div>

              {/* RBI Tokenization & Security Reassurance Banner */}
              <div
                style={{
                  backgroundColor: '#f0fdf4',
                  borderRadius: '12px',
                  border: '1px solid #bbf7d0',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  marginBottom: '1.5rem'
                }}
              >
                <ShieldCheck size={20} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.92rem' }}>
                    100% RBI &amp; PCI-DSS Compliant Tokenization
                  </div>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.84rem', color: '#15803d', lineHeight: 1.45 }}>
                    In compliance with Reserve Bank of India (RBI) Card-on-File Tokenization (CoFT) guidelines,
                    Grocery Choice <strong>never</strong> stores your raw 16-digit card number, CVV, or payment PIN.
                    Payment methods are tokenized directly with end-to-end encryption via Razorpay.
                  </p>
                </div>
              </div>

              {/* Saved Methods List / Empty State */}
              {savedPaymentMethods.length === 0 ? (
                <div
                  className="payment-empty-state"
                  style={{
                    padding: '3.5rem 1.5rem',
                    textAlign: 'center',
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px dashed #cbd5e1'
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      backgroundColor: '#ecfdf5',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1rem auto'
                    }}
                  >
                    <CreditCard size={32} />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.35rem' }}>
                    No Saved Payment Methods
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto 1.5rem auto', lineHeight: 1.45 }}>
                    You don't have any payment methods saved yet. You can securely tokenize and save cards during checkout with two-factor bank OTP verification.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddPaymentModalOpen(true)}
                    className="btn btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}
                  >
                    <Plus size={15} />
                    <span>How to Save a Card</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {savedPaymentMethods.map((method) => (
                    <div
                      key={method.id}
                      style={{
                        padding: '1.25rem',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div
                          style={{
                            width: '48px',
                            height: '34px',
                            borderRadius: '6px',
                            backgroundColor: '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#0f172a',
                            fontWeight: 800,
                            fontSize: '0.8rem'
                          }}
                        >
                          {method.network || 'CARD'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#0f172a' }}>
                            {method.network || 'Card'} •••• {method.last4}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            Expires {method.expiry || 'MM/YY'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {method.isDefault && (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '0.2rem 0.55rem',
                              borderRadius: '999px',
                              backgroundColor: '#dbeafe',
                              color: '#1e40af'
                            }}
                          >
                            Default
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemovePaymentMethod(method.id)}
                          className="btn btn-outline"
                          style={{ padding: '0.4rem 0.6rem', color: '#ef4444', borderColor: '#fca5a5' }}
                          title="Remove payment method"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Account & Security */}
          {activeTab === 'security' && (
            <div className="profile-card">
              <h2 className="profile-card-title">Account &amp; Security</h2>
              <p className="profile-card-subtitle" style={{ marginBottom: '1.5rem' }}>
                Grocery Choice uses passwordless OTP authentication for high security and seamless customer access.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                    <ShieldCheck size={18} color="#059669" />
                    <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>Authentication Method</span>
                  </div>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.88rem', color: '#475569' }}>
                    Your account is secured via one-time passcodes (OTP) dispatched to your registered mobile phone or email. No vulnerable passwords to remember or lose.
                  </p>
                  <div style={{ fontSize: '0.82rem', color: '#059669', fontWeight: 600 }}>
                    ✓ Active Multi-Channel Authentication Active
                  </div>
                </div>

                <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                    <User size={18} color="#059669" />
                    <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>Customer ID &amp; Role</span>
                  </div>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.88rem', color: '#475569' }}>
                    Account ID: <strong>#{user.id || 1}</strong> • Role: <strong>{user.role || 'ROLE_CUSTOMER'}</strong>
                  </p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                    Status: Active Verified Customer
                  </p>
                </div>

                <div style={{ padding: '1.25rem', backgroundColor: '#fff1f2', borderRadius: '12px', border: '1px solid #fecdd3', marginTop: '0.5rem' }}>
                  <div style={{ fontWeight: 700, color: '#9f1239', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                    Session Management
                  </div>
                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.88rem', color: '#be123c' }}>
                    Sign out of your active Grocery Choice session on this device.
                  </p>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="btn"
                    style={{
                      backgroundColor: '#e11d48',
                      color: '#ffffff',
                      border: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <LogOut size={16} />
                    <span>Sign Out of Grocery Choice</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add Payment Method Informative Modal */}
      {isAddPaymentModalOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddPaymentModalOpen(false);
          }}
        >
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CreditCard size={18} />
                </div>
                <div>
                  <h2 id="payment-modal-title" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Save Payment Method
                  </h2>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
                    RBI Card Tokenization Guidelines
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddPaymentModalOpen(false)}
                aria-label="Close modal"
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.4rem', borderRadius: '8px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '1rem',
                  marginBottom: '1.25rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#0f172a', fontSize: '0.92rem', marginBottom: '0.4rem' }}>
                  <Lock size={15} color="#059669" />
                  <span>Why can't I enter card numbers here?</span>
                </div>
                <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.45, margin: 0 }}>
                  Per Reserve Bank of India (RBI) cybersecurity guidelines, cards cannot be saved by typing plain numbers into an unverified form. Cards must be tokenized directly through an authenticated bank gateway with two-factor OTP verification.
                </p>
              </div>

              <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                How to save your card:
              </h4>
              <ol style={{ paddingLeft: '1.25rem', margin: '0 0 1.5rem 0', fontSize: '0.85rem', color: '#475569', lineHeight: 1.6 }}>
                <li>Proceed to checkout with items in your cart.</li>
                <li>Select <strong>Online Payment (Razorpay)</strong>.</li>
                <li>Check the box <strong>"Save card securely as per RBI guidelines"</strong> during checkout.</li>
                <li>Enter the bank OTP sent to your registered mobile phone. Your card will be tokenized automatically.</li>
              </ol>

              <button
                type="button"
                onClick={() => setIsAddPaymentModalOpen(false)}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Understood, Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
