import React from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { useDeliveryLocation } from '../../context/LocationContext';

export default function LocationSelector({ variant = 'header', className = '' }) {
  const { selectedLocation, openLocationModal } = useDeliveryLocation();

  const isCompact = variant === 'compact';
  const isMobileBar = variant === 'mobile-bar';

  if (isMobileBar) {
    return (
      <button
        type="button"
        onClick={() => openLocationModal('select')}
        className={`mobile-location-bar ${className}`}
        aria-label={selectedLocation ? `Delivery location: ${selectedLocation.compactDisplay}. Click to change` : 'Select delivery location'}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.65rem 1rem',
          backgroundColor: '#ecfdf5',
          borderBottom: '1px solid #a7f3d0',
          color: '#065f46',
          fontSize: '0.85rem',
          fontWeight: 600,
          minHeight: '44px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
          <MapPin size={16} color="#059669" style={{ flexShrink: 0 }} />
          <div style={{ textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: '0.72rem', color: '#047857', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Deliver to
            </span>
            <span style={{ fontWeight: 700, color: '#065f46' }}>
              {selectedLocation ? selectedLocation.compactDisplay : 'Select your location'}
            </span>
          </div>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: '#059669', fontSize: '0.78rem', fontWeight: 700 }}>
          <span>{selectedLocation ? 'Change' : 'Select'}</span>
          <ChevronDown size={14} />
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openLocationModal('select')}
      className={`location-selector-btn ${className}`}
      aria-haspopup="dialog"
      aria-label={
        selectedLocation
          ? `Delivering to ${selectedLocation.compactDisplay}. Click to change location.`
          : 'Deliver to: Select your location'
      }
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: isCompact ? '0.35rem 0.65rem' : '0.45rem 0.85rem',
        borderRadius: '10px',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        transition: 'all 0.15s ease',
        cursor: 'pointer',
        textAlign: 'left',
        minHeight: '44px'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#ecfdf5';
        e.currentTarget.style.borderColor = '#a7f3d0';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#f8fafc';
        e.currentTarget.style.borderColor = '#e2e8f0';
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          backgroundColor: '#ecfdf5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#059669',
          flexShrink: 0
        }}
      >
        <MapPin size={17} />
      </div>

      <div style={{ lineHeight: 1.2, maxWidth: '160px', overflow: 'hidden' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Deliver to
        </div>
        <div
          style={{
            fontSize: '0.88rem',
            fontWeight: 700,
            color: selectedLocation ? '#0f172a' : '#059669',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          title={selectedLocation ? selectedLocation.compactDisplay : 'Select your location'}
        >
          {selectedLocation ? selectedLocation.compactDisplay : 'Select your location'}
        </div>
      </div>

      <ChevronDown size={14} color="#64748b" style={{ flexShrink: 0, marginLeft: '0.2rem' }} />
    </button>
  );
}
