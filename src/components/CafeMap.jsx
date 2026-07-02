import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { LocateFixed, RefreshCcw } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Komponen internal untuk mengontrol pergerakan kamera Leaflet secara imperatif
const MapController = ({ 
  defaultCenter, 
  defaultZoom, 
  userLocation, 
  setUserLocation, 
  shouldLocate, 
  setShouldLocate, 
  shouldReset, 
  setShouldReset 
}) => {
  const map = useMap();

  // Ambil lokasi pengguna saat pertama kali komponen ditempel (mount)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const pos = [latitude, longitude];
          setUserLocation(pos);
          map.flyTo(pos, 15, { animate: true, duration: 1.5 });
        },
        (error) => {
          console.warn("Izin lokasi ditolak atau tidak tersedia.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, [map, setUserLocation]);

  // Efek untuk memproses pemicu tombol manual Locate Me
  useEffect(() => {
    if (shouldLocate) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const pos = [latitude, longitude];
            setUserLocation(pos);
            map.flyTo(pos, 15, { animate: true, duration: 1.5 });
          },
          (error) => {
            console.warn("Gagal memperbarui lokasi terbaru.");
          },
          { enableHighAccuracy: true }
        );
      }
      setShouldLocate(false);
    }
  }, [shouldLocate, map, setUserLocation, setShouldLocate]);

  // Efek untuk memproses pemicu tombol manual Reset View
  useEffect(() => {
    if (shouldReset) {
      map.flyTo(defaultCenter, defaultZoom, { animate: true, duration: 1.5 });
      setShouldReset(false);
    }
  }, [shouldReset, map, defaultCenter, defaultZoom, setShouldReset]);

  return null;
};

const CafeMap = ({ places, onPlaceClick }) => {
  console.log("Places:", places);
console.log("Leaflet:", L);
console.log("CafeMap render");
  const [userLocation, setUserLocation] = useState(null);
  const [shouldLocate, setShouldLocate] = useState(false);
  const [shouldReset, setShouldReset] = useState(false);

  // Koordinat pusat default Purwokerto
  const defaultCenter = [-7.4313, 109.2478];
  const defaultZoom = 13;

  // Desain kustom marker pin cafe (Gold/Copper) menggunakan DivIcon agar aman dari bug path asset Vite
  const cafeIcon = L.divIcon({
    className: 'custom-cafe-marker',
    html: `<div style="background-color: #E4B381; width: 22px; height: 22px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid #1C1917; box-shadow: 0 4px 10px rgba(0,0,0,0.6);"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -22]
  });

  // Desain kustom marker posisi user (Neon Blue)
  const userIcon = L.divIcon({
    className: 'custom-user-marker',
    html: `<div style="background-color: #00D4FF; width: 16px; height: 16px; border-radius: 50%; border: 3px solid #FFFFFF; box-shadow: 0 0 15px rgba(0,212,255,0.8);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-[#2A2624] shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
      
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        zoomControl={false}
        style={{ width: '100%', height: '100%', background: '#12100E' }}
      >
        {/* Lapisan Peta Utama Berbasis CartoDB Dark Matter */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap contributors'
          subdomains="abcd"
          maxZoom={20}
        />

        {/* Sinkronisasi state React ke dalam instans peta Leaflet */}
        <MapController
          defaultCenter={defaultCenter}
          defaultZoom={defaultZoom}
          userLocation={userLocation}
          setUserLocation={setUserLocation}
          shouldLocate={shouldLocate}
          setShouldLocate={setShouldLocate}
          shouldReset={shouldReset}
          setShouldReset={setShouldReset}
        />

        {/* Penanda posisi pengguna jika koordinat tersedia */}
        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div style={{ color: '#12100E', fontWeight: 'bold', fontSize: '11px', textAlign: 'center', fontFamily: 'sans-serif' }}>
                Lokasi Anda Saat Ini
              </div>
            </Popup>
          </Marker>
        )}

        {/* Pemetaan sisa titik lokasi cafe dari database Supabase */}
        {places && places.filter(p => p.latitude && p.longitude).map((place, index) => (
          <Marker
            key={place.id || `${place.name}-${index}`}
            position={[place.latitude, place.longitude]}
            icon={cafeIcon}
            eventHandlers={{
              click: () => {
                if (onPlaceClick) onPlaceClick(place);
              }
            }}
          >
            <Popup>
              <div style={{ color: '#12100E', fontWeight: 'bold', fontFamily: 'sans-serif', fontSize: '13px', textAlign: 'center', padding: '2px' }}>
                {place.name}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Action Buttons UI Overlay */}
      <div className="absolute bottom-6 right-4 z-[1000] flex flex-col gap-3">
        
        {/* Tombol Geolocation (Locate Me) */}
        <button
          onClick={() => setShouldLocate(true)}
          className="w-12 h-12 bg-[#1C1917] hover:bg-[#2A2624] text-[#00D4FF] rounded-full flex items-center justify-center shadow-xl border border-[#2A2624] transition-all group"
          title="Lokasi Saya"
        >
          <LocateFixed size={20} className="group-hover:scale-110 transition-transform" />
        </button>

        {/* Tombol Reset View (Kembali ke Purwokerto) */}
        <button
          onClick={() => setShouldReset(true)}
          className="w-12 h-12 bg-[#1C1917] hover:bg-[#2A2624] text-[#E4B381] rounded-full flex items-center justify-center shadow-xl border border-[#2A2624] transition-all group"
          title="Kembali ke Purwokerto"
        >
          <RefreshCcw size={20} className="group-hover:-rotate-90 transition-transform duration-300" />
        </button>
        
      </div>
    </div>
  );
};

export default CafeMap