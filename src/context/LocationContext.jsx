import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { addressApi } from '../services/api';

const LocationContext = createContext();

const LOCATION_STORAGE_KEY = 'grocery_choice_location';

export function LocationProvider({ children }) {
  // Read initial stored state (defaults to null if not explicitly chosen by user)
  const [locationState, setLocationState] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCATION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Treat legacy placeholder loc-default-1 as null so initial unselected state works
        const initialSelected =
          parsed.selectedLocation && parsed.selectedLocation.id !== 'loc-default-1'
            ? parsed.selectedLocation
            : null;
        const initialSaved =
          Array.isArray(parsed.savedLocations)
            ? parsed.savedLocations.filter((l) => l.id !== 'loc-default-1')
            : [];
        return {
          selectedLocation: initialSelected,
          savedLocations: initialSaved
        };
      }
    } catch {
      // Fallback
    }
    return {
      selectedLocation: null,
      savedLocations: []
    };
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState('select'); // 'select' | 'manual' | 'edit'
  const [editingLocation, setEditingLocation] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [confirmationMessage, setConfirmationMessage] = useState(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(locationState));
    } catch (e) {
      console.error('Failed to sync location to localStorage', e);
    }
  }, [locationState]);

  // Sync with backend saved addresses when customer has an active auth session
  const refreshBackendAddresses = useCallback(async () => {
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('grocery_choice_token') : null;
      if (!token) return;

      const backendAddresses = await addressApi.getAll();
      if (Array.isArray(backendAddresses)) {
        const mappedBackend = backendAddresses.map((addr) => ({
          id: `backend-${addr.id}`,
          addressId: addr.id,
          type: 'manual',
          label: addr.landmark ? 'Other' : (addr.addressLine2 ? 'Work' : 'Home'),
          isDefault: Boolean(addr.isDefault),
          house: addr.addressLine1 || '',
          street: addr.addressLine2 || '',
          landmark: addr.landmark || '',
          city: addr.city || '',
          state: addr.state || '',
          pincode: addr.postalCode || '',
          compactDisplay: `${addr.city}, ${addr.postalCode}`,
          formattedAddress: `${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}, ${addr.city}, ${addr.state} - ${addr.postalCode}`
        }));

        setLocationState((prev) => {
          // Keep non-backend locations (e.g. GPS) that don't collide
          const localOnly = prev.savedLocations.filter(
            (loc) => !loc.addressId && !String(loc.id).startsWith('backend-')
          );
          const combined = [...mappedBackend, ...localOnly];

          let nextSelected = prev.selectedLocation;
          if (nextSelected?.addressId) {
            const fresh = mappedBackend.find((a) => a.addressId === nextSelected.addressId);
            if (fresh) nextSelected = fresh;
          }

          return {
            ...prev,
            savedLocations: combined,
            selectedLocation: nextSelected
          };
        });
      }
    } catch (err) {
      console.debug('Backend address sync notice:', err.message);
    }
  }, []);

  useEffect(() => {
    refreshBackendAddresses();
  }, [refreshBackendAddresses]);

  const openLocationModal = (view = 'select', editTarget = null) => {
    setModalView(view);
    setEditingLocation(editTarget);
    setGeoError(null);
    setConfirmationMessage(null);
    setIsModalOpen(true);
  };

  const closeLocationModal = () => {
    setIsModalOpen(false);
    setEditingLocation(null);
    setGeoError(null);
    setConfirmationMessage(null);
  };

  // Option 1: Browser Geolocation API
  const detectCurrentLocation = () => {
    setGeoError(null);
    setConfirmationMessage(null);

    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser. Please enter your location manually.');
      return;
    }

    setIsDetecting(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsDetecting(false);
        const { latitude, longitude } = position.coords;

        const newLocation = {
          id: `loc-geo-${Date.now()}`,
          type: 'geolocation',
          latitude,
          longitude,
          label: 'Current Location',
          compactDisplay: `GPS Location (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)`,
          formattedAddress: `Coordinates: Latitude ${latitude.toFixed(4)}°, Longitude ${longitude.toFixed(4)}° (Browser Geolocation Detected)`,
          city: 'Local Area',
          state: '',
          pincode: 'Detected',
          createdAt: new Date().toISOString()
        };

        setLocationState((prev) => {
          const updatedList = [newLocation, ...prev.savedLocations.filter((l) => l.type !== 'geolocation')];
          return {
            selectedLocation: newLocation,
            savedLocations: updatedList
          };
        });

        setConfirmationMessage('Location selected using your device GPS coordinates.');
        closeLocationModal();
      },
      (error) => {
        setIsDetecting(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoError('Location permission was denied. Please allow location access in your browser settings or enter your address manually.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError('Location information is currently unavailable. Please enter your address manually.');
            break;
          case error.TIMEOUT:
            setGeoError('Location request timed out. Please try again or enter your address manually.');
            break;
          default:
            setGeoError('An unexpected error occurred while detecting location. Please enter your location manually.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Option 2 & 3: Save / Edit Manual Address (with backend sync if authenticated)
  const saveManualLocation = async (data, editId = null) => {
    const compactDisplay = `${data.city.trim()}, ${data.pincode.trim()}`;
    const formattedAddress = `${data.house.trim()}, ${data.street.trim()}${data.landmark ? ', Near ' + data.landmark.trim() : ''}, ${data.city.trim()}, ${data.state.trim()} - ${data.pincode.trim()}`;
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('grocery_choice_token') : null;

    let savedLoc = null;

    if (token) {
      try {
        const payload = {
          addressLine1: data.house.trim(),
          addressLine2: data.street ? data.street.trim() : '',
          city: data.city.trim(),
          state: data.state.trim(),
          postalCode: data.pincode.trim(),
          landmark: data.landmark ? data.landmark.trim() : '',
          isDefault: Boolean(data.isDefault)
        };

        const existingLoc = editId ? locationState.savedLocations.find((l) => l.id === editId) : null;
        if (existingLoc && existingLoc.addressId) {
          const res = await addressApi.update(existingLoc.addressId, payload);
          savedLoc = {
            id: `backend-${res.id}`,
            addressId: res.id,
            type: 'manual',
            label: data.label || 'Home',
            isDefault: Boolean(res.isDefault),
            house: res.addressLine1,
            street: res.addressLine2 || '',
            landmark: res.landmark || '',
            city: res.city,
            state: res.state,
            pincode: res.postalCode,
            compactDisplay: `${res.city}, ${res.postalCode}`,
            formattedAddress: `${res.addressLine1}${res.addressLine2 ? ', ' + res.addressLine2 : ''}, ${res.city}, ${res.state} - ${res.postalCode}`,
            updatedAt: new Date().toISOString()
          };
        } else {
          const res = await addressApi.create(payload);
          savedLoc = {
            id: `backend-${res.id}`,
            addressId: res.id,
            type: 'manual',
            label: data.label || 'Home',
            isDefault: Boolean(res.isDefault),
            house: res.addressLine1,
            street: res.addressLine2 || '',
            landmark: res.landmark || '',
            city: res.city,
            state: res.state,
            pincode: res.postalCode,
            compactDisplay: `${res.city}, ${res.postalCode}`,
            formattedAddress: `${res.addressLine1}${res.addressLine2 ? ', ' + res.addressLine2 : ''}, ${res.city}, ${res.state} - ${res.postalCode}`,
            createdAt: new Date().toISOString()
          };
        }
      } catch (err) {
        console.warn('Backend address save failed, falling back to local state:', err.message);
      }
    }

    if (!savedLoc) {
      if (editId) {
        savedLoc = {
          id: editId,
          type: 'manual',
          ...data,
          compactDisplay,
          formattedAddress,
          updatedAt: new Date().toISOString()
        };
      } else {
        savedLoc = {
          id: `loc-man-${Date.now()}`,
          type: 'manual',
          ...data,
          compactDisplay,
          formattedAddress,
          createdAt: new Date().toISOString()
        };
      }
    }

    setLocationState((prev) => {
      const isEdit = Boolean(editId);
      const updatedList = isEdit
        ? prev.savedLocations.map((l) => (l.id === editId ? savedLoc : l))
        : [savedLoc, ...prev.savedLocations];

      return {
        selectedLocation: savedLoc,
        savedLocations: updatedList
      };
    });

    closeLocationModal();
    return savedLoc;
  };

  // Switch active selected location
  const selectLocation = (locationId) => {
    const target = locationState.savedLocations.find((l) => l.id === locationId);
    if (target) {
      setLocationState((prev) => ({
        ...prev,
        selectedLocation: target
      }));
      closeLocationModal();
      return target;
    }
    return null;
  };

  // Set address as default
  const setDefaultAddress = async (locationId) => {
    const target = locationState.savedLocations.find((l) => l.id === locationId);
    if (target?.addressId) {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('grocery_choice_token') : null;
      if (token) {
        try {
          await addressApi.update(target.addressId, {
            addressLine1: target.house || target.formattedAddress,
            addressLine2: target.street || '',
            city: target.city || '',
            state: target.state || '',
            postalCode: target.pincode || '',
            landmark: target.landmark || '',
            isDefault: true
          });
        } catch (err) {
          console.warn('Backend set default address failed:', err.message);
        }
      }
    }

    setLocationState((prev) => ({
      ...prev,
      savedLocations: prev.savedLocations.map((l) => ({
        ...l,
        isDefault: l.id === locationId
      }))
    }));
  };

  // Remove a saved location
  const removeLocation = async (locationId) => {
    const target = locationState.savedLocations.find((l) => l.id === locationId);
    if (target?.addressId) {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('grocery_choice_token') : null;
      if (token) {
        try {
          await addressApi.delete(target.addressId);
        } catch (err) {
          console.warn('Backend address delete failed:', err.message);
        }
      }
    }

    setLocationState((prev) => {
      const filtered = prev.savedLocations.filter((l) => l.id !== locationId);
      const wasSelected = prev.selectedLocation?.id === locationId;
      return {
        savedLocations: filtered,
        selectedLocation: wasSelected ? null : prev.selectedLocation
      };
    });
  };

  const clearSelectedLocation = () => {
    setLocationState((prev) => ({
      ...prev,
      selectedLocation: null
    }));
  };

  const value = {
    selectedLocation: locationState.selectedLocation,
    savedLocations: locationState.savedLocations,
    isModalOpen,
    modalView,
    editingLocation,
    isDetecting,
    geoError,
    confirmationMessage,
    openLocationModal,
    openModal: openLocationModal,
    closeLocationModal,
    closeModal: closeLocationModal,
    setModalView,
    setEditingLocation,
    detectCurrentLocation,
    saveManualLocation,
    selectLocation,
    setDefaultAddress,
    removeLocation,
    clearSelectedLocation,
    refreshBackendAddresses
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useDeliveryLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useDeliveryLocation must be used within a LocationProvider');
  }
  return context;
}

