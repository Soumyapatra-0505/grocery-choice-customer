import React, { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext();

const LOCATION_STORAGE_KEY = 'grocery_choice_location';

const DEFAULT_SAVED_LOCATION = {
  id: 'loc-default-1',
  type: 'manual',
  label: 'Home',
  house: 'Flat 402, Green Glen Apartments',
  street: 'Sector 14 Hub',
  city: 'Gurugram',
  state: 'Haryana',
  pincode: '122001',
  compactDisplay: 'Gurugram, 122001',
  formattedAddress: 'Flat 402, Green Glen Apartments, Sector 14 Hub, Gurugram, Haryana - 122001',
  createdAt: new Date().toISOString()
};

export function LocationProvider({ children }) {
  // Read initial stored state
  const [locationState, setLocationState] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCATION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          selectedLocation: parsed.selectedLocation || DEFAULT_SAVED_LOCATION,
          savedLocations: Array.isArray(parsed.savedLocations) && parsed.savedLocations.length > 0 ? parsed.savedLocations : [DEFAULT_SAVED_LOCATION]
        };
      }
    } catch {
      // Fallback
    }
    return {
      selectedLocation: DEFAULT_SAVED_LOCATION,
      savedLocations: [DEFAULT_SAVED_LOCATION]
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

  // Option 2: Save Manual Address
  const saveManualLocation = (data, editId = null) => {
    const compactDisplay = `${data.city.trim()}, ${data.pincode.trim()}`;
    const formattedAddress = `${data.house.trim()}, ${data.street.trim()}${data.landmark ? ', Near ' + data.landmark.trim() : ''}, ${data.city.trim()}, ${data.state.trim()} - ${data.pincode.trim()}`;

    if (editId) {
      // Edit existing
      setLocationState((prev) => {
        const updatedList = prev.savedLocations.map((loc) =>
          loc.id === editId
            ? {
                ...loc,
                ...data,
                compactDisplay,
                formattedAddress,
                updatedAt: new Date().toISOString()
              }
            : loc
        );

        const updatedSelected =
          prev.selectedLocation?.id === editId
            ? { ...prev.selectedLocation, ...data, compactDisplay, formattedAddress }
            : prev.selectedLocation;

        return {
          selectedLocation: updatedSelected,
          savedLocations: updatedList
        };
      });
    } else {
      // Add new
      const newLoc = {
        id: `loc-man-${Date.now()}`,
        type: 'manual',
        ...data,
        compactDisplay,
        formattedAddress,
        createdAt: new Date().toISOString()
      };

      setLocationState((prev) => ({
        selectedLocation: newLoc,
        savedLocations: [newLoc, ...prev.savedLocations]
      }));
    }

    closeLocationModal();
  };

  // Switch selected location
  const selectLocation = (locationId) => {
    const target = locationState.savedLocations.find((l) => l.id === locationId);
    if (target) {
      setLocationState((prev) => ({
        ...prev,
        selectedLocation: target
      }));
      closeLocationModal();
    }
  };

  // Remove a saved location
  const removeLocation = (locationId) => {
    setLocationState((prev) => {
      const filtered = prev.savedLocations.filter((l) => l.id !== locationId);
      const wasSelected = prev.selectedLocation?.id === locationId;
      return {
        savedLocations: filtered,
        selectedLocation: wasSelected ? (filtered.length > 0 ? filtered[0] : null) : prev.selectedLocation
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
    removeLocation,
    clearSelectedLocation
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
