import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MapPin,
  Navigation,
  Plus,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  Home,
  Briefcase,
  Building,
  CheckCircle2
} from 'lucide-react';
import { useDeliveryLocation } from '../../context/LocationContext';
import Button from '../common/Button';

// Subcomponent: Manual Address Form (Encapsulates form state cleanly without cascading renders)
function ManualAddressForm({ initialLocation, isEdit, onSave, onCancel }) {
  const firstInputRef = useRef(null);
  const [formData, setFormData] = useState(() => ({
    house: initialLocation?.house || '',
    street: initialLocation?.street || '',
    landmark: initialLocation?.landmark || '',
    city: initialLocation?.city || '',
    state: initialLocation?.state || '',
    pincode: initialLocation?.pincode || '',
    phone: initialLocation?.phone || '',
    label: initialLocation?.label || 'Home'
  }));

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateManualForm = () => {
    const errors = {};
    if (!formData.house.trim()) {
      errors.house = 'Please enter Flat / House / Building details';
    }
    if (!formData.street.trim()) {
      errors.street = 'Please enter Street, Road, or Area';
    }
    if (!formData.city.trim()) {
      errors.city = 'Please enter City';
    }
    if (!formData.state.trim()) {
      errors.state = 'Please enter State';
    }
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    if (!formData.pincode.trim()) {
      errors.pincode = 'Please enter 6-digit PIN code';
    } else if (!pincodeRegex.test(formData.pincode.trim())) {
      errors.pincode = 'Please enter a valid 6-digit PIN code (e.g. 500081, 122001)';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!validateManualForm()) return;
    onSave(formData, initialLocation?.id);
  };

  return (
    <form onSubmit={handleManualSubmit}>
      {/* Address Tag Selector */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label className="form-label" style={{ marginBottom: '0.4rem', display: 'block' }}>Save address as</label>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {[
            { id: 'Home', icon: <Home size={15} /> },
            { id: 'Work', icon: <Briefcase size={15} /> },
            { id: 'Other', icon: <Building size={15} /> }
          ].map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => setFormData((p) => ({ ...p, label: tag.id }))}
              style={{
                flex: 1,
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: formData.label === tag.id ? '2px solid #059669' : '1px solid #cbd5e1',
                backgroundColor: formData.label === tag.id ? '#ecfdf5' : '#ffffff',
                color: formData.label === tag.id ? '#059669' : '#475569',
                fontWeight: 700,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                minHeight: '44px',
                cursor: 'pointer'
              }}
            >
              {tag.icon}
              <span>{tag.id}</span>
            </button>
          ))}
        </div>
      </div>

      {/* House / Flat */}
      <div className="form-group">
        <label htmlFor="house" className="form-label">Flat / House No. / Floor / Building *</label>
        <input
          ref={firstInputRef}
          id="house"
          name="house"
          type="text"
          value={formData.house}
          onChange={handleInputChange}
          className="form-input"
          placeholder="e.g. Flat 203, Block B, Sunshine Residency"
        />
        {formErrors.house && <span className="form-error">{formErrors.house}</span>}
      </div>

      {/* Street / Area */}
      <div className="form-group">
        <label htmlFor="street" className="form-label">Street / Colony / Area *</label>
        <input
          id="street"
          name="street"
          type="text"
          value={formData.street}
          onChange={handleInputChange}
          className="form-input"
          placeholder="e.g. Madhapur Road, Near IT Park"
        />
        {formErrors.street && <span className="form-error">{formErrors.street}</span>}
      </div>

      {/* Landmark (Optional) */}
      <div className="form-group">
        <label htmlFor="landmark" className="form-label">Landmark (Optional)</label>
        <input
          id="landmark"
          name="landmark"
          type="text"
          value={formData.landmark}
          onChange={handleInputChange}
          className="form-input"
          placeholder="e.g. Opposite Water Tank or Metro Pillar 142"
        />
      </div>

      {/* City & State & Pincode Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.85rem' }}>
        <div className="form-group">
          <label htmlFor="city" className="form-label">City *</label>
          <input
            id="city"
            name="city"
            type="text"
            value={formData.city}
            onChange={handleInputChange}
            className="form-input"
            placeholder="e.g. Hyderabad"
          />
          {formErrors.city && <span className="form-error">{formErrors.city}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="state" className="form-label">State *</label>
          <input
            id="state"
            name="state"
            type="text"
            value={formData.state}
            onChange={handleInputChange}
            className="form-input"
            placeholder="e.g. Telangana"
          />
          {formErrors.state && <span className="form-error">{formErrors.state}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="pincode" className="form-label">6-Digit PIN Code *</label>
          <input
            id="pincode"
            name="pincode"
            type="text"
            maxLength={6}
            value={formData.pincode}
            onChange={handleInputChange}
            className="form-input"
            placeholder="e.g. 500081"
          />
          {formErrors.pincode && <span className="form-error">{formErrors.pincode}</span>}
        </div>
      </div>

      {/* Contact Phone (Optional) */}
      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
        <label htmlFor="phone" className="form-label">Delivery Contact Phone (Optional)</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleInputChange}
          className="form-input"
          placeholder="+91 98765 43210"
        />
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <Button
          variant="outline"
          type="button"
          onClick={onCancel}
        >
          Cancel
        </Button>

        <Button
          variant="primary"
          type="submit"
          icon={<Check size={16} />}
        >
          {isEdit ? 'Update Location' : 'Save & Select Location'}
        </Button>
      </div>
    </form>
  );
}

export default function LocationModal() {
  const {
    isModalOpen,
    closeLocationModal,
    modalView,
    setModalView,
    editingLocation,
    setEditingLocation,
    selectedLocation,
    savedLocations,
    detectCurrentLocation,
    isDetecting,
    geoError,
    confirmationMessage,
    saveManualLocation,
    selectLocation,
    removeLocation
  } = useDeliveryLocation();

  const initialFocusRef = useRef(null);

  // Keyboard accessibility: Close on Escape key & auto focus
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeLocationModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const timer = setTimeout(() => {
      if (initialFocusRef.current) {
        initialFocusRef.current.focus();
      }
    }, 100);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isModalOpen, closeLocationModal]);

  // Don't render modal when closed
  if (!isModalOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeLocationModal();
        }
      }}
    >
      <div className="modal-card">
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #f1f5f9'
          }}
        >
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
              <MapPin size={18} />
            </div>
            <div>
              <h2
                id="location-modal-title"
                style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}
              >
                {modalView === 'select'
                  ? 'Select Delivery Location'
                  : modalView === 'edit'
                  ? 'Edit Delivery Location'
                  : 'Enter Address Manually'}
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
                {modalView === 'select'
                  ? 'Choose how you want to share your location'
                  : 'Enter your complete address for door-step grocery delivery'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeLocationModal}
            aria-label="Close location selector"
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.color = '#0f172a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: 'calc(85vh - 85px)' }}>
          {/* Confirmation Notice */}
          {confirmationMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '10px',
                padding: '0.85rem 1rem',
                color: '#065f46',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '1.25rem'
              }}
            >
              <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>{confirmationMessage}</div>
            </div>
          )}

          {/* View: Select Options */}
          {modalView === 'select' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Geolocation Error Alert */}
              {geoError && (
                <div
                  role="alert"
                  style={{
                    backgroundColor: '#fff1f2',
                    border: '1px solid #fecdd3',
                    borderRadius: '10px',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                    <AlertCircle size={18} color="#e11d48" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '0.84rem', color: '#9f1239', fontWeight: 500, lineHeight: 1.4 }}>
                      {geoError}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalView('manual')}
                    style={{
                      alignSelf: 'flex-start',
                      color: '#059669',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      textDecoration: 'underline',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Enter location details manually instead &rarr;
                  </button>
                </div>
              )}

              {/* Action Buttons: 2 Core Options */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.85rem' }}>
                {/* OPTION 1: Use Current Location */}
                <button
                  ref={initialFocusRef}
                  type="button"
                  onClick={detectCurrentLocation}
                  disabled={isDetecting}
                  style={{
                    width: '100%',
                    padding: '1rem 1.25rem',
                    borderRadius: '14px',
                    backgroundColor: '#ecfdf5',
                    border: '2px solid #a7f3d0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    minHeight: '52px',
                    cursor: isDetecting ? 'wait' : 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (!isDetecting) {
                      e.currentTarget.style.backgroundColor = '#d1fae5';
                      e.currentTarget.style.borderColor = '#059669';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isDetecting) {
                      e.currentTarget.style.backgroundColor = '#ecfdf5';
                      e.currentTarget.style.borderColor = '#a7f3d0';
                    }
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#059669',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {isDetecting ? (
                      <Loader2 size={20} className="spin-animation" />
                    ) : (
                      <Navigation size={20} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#065f46' }}>
                      {isDetecting ? 'Detecting Your Location...' : 'Use My Current Location'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#047857' }}>
                      {isDetecting
                        ? 'Requesting GPS coordinates from browser...'
                        : 'Detect device GPS coordinates via browser Geolocation API'}
                    </div>
                  </div>
                </button>

                {/* OPTION 2: Enter Manually */}
                <button
                  type="button"
                  onClick={() => {
                    if (setEditingLocation) setEditingLocation(null);
                    setModalView('manual');
                  }}
                  style={{
                    width: '100%',
                    padding: '1rem 1.25rem',
                    borderRadius: '14px',
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    minHeight: '52px',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.borderColor = '#059669';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#f1f5f9',
                      color: '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Plus size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f172a' }}>
                      Enter Location Manually
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Add full flat/house number, street, city, and 6-digit PIN code
                    </div>
                  </div>
                </button>
              </div>

              {/* Saved Locations List */}
              {savedLocations.length > 0 && (
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.85rem' }}>
                    Saved Delivery Addresses ({savedLocations.length})
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {savedLocations.map((loc) => {
                      const isCurrentActive = selectedLocation?.id === loc.id;
                      return (
                        <div
                          key={loc.id}
                          style={{
                            padding: '0.85rem 1rem',
                            borderRadius: '12px',
                            border: isCurrentActive ? '2px solid #059669' : '1px solid #e2e8f0',
                            backgroundColor: isCurrentActive ? '#ecfdf5' : '#ffffff',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: '0.75rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div
                            style={{ flex: 1, cursor: 'pointer' }}
                            onClick={() => selectLocation(loc.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') selectLocation(loc.id);
                            }}
                            aria-label={`Select address: ${loc.formattedAddress}`}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  textTransform: 'uppercase',
                                  backgroundColor: isCurrentActive ? '#059669' : '#f1f5f9',
                                  color: isCurrentActive ? '#ffffff' : '#475569',
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '6px'
                                }}
                              >
                                {loc.label || (loc.type === 'geolocation' ? 'GPS' : 'Home')}
                              </span>
                              {isCurrentActive && (
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                  <Check size={14} /> Active Location
                                </span>
                              )}
                            </div>

                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.2rem' }}>
                              {loc.compactDisplay}
                            </div>

                            <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>
                              {loc.formattedAddress}
                            </div>
                          </div>

                          {/* Edit / Remove actions */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            {loc.type === 'manual' && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (setEditingLocation) setEditingLocation(loc);
                                  setModalView('edit');
                                }}
                                aria-label={`Edit address ${loc.compactDisplay}`}
                                style={{
                                  padding: '0.4rem',
                                  color: '#64748b',
                                  borderRadius: '6px',
                                  display: 'inline-flex',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = '#059669')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                              >
                                <Edit2 size={16} />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => removeLocation(loc.id)}
                              aria-label={`Remove address ${loc.compactDisplay}`}
                              style={{
                                padding: '0.4rem',
                                color: '#64748b',
                                borderRadius: '6px',
                                display: 'inline-flex',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* View: Manual Form (Add or Edit) */}
          {(modalView === 'manual' || modalView === 'edit') && (
            <ManualAddressForm
              key={editingLocation ? editingLocation.id : 'new'}
              initialLocation={editingLocation}
              isEdit={modalView === 'edit'}
              onSave={saveManualLocation}
              onCancel={() => setModalView('select')}
            />
          )}
        </div>
      </div>
    </div>
  );
}
