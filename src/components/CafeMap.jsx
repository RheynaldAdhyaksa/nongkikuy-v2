import React, { useState, useEffect } from 'react';

const CafeMap = ({ places, onPlaceClick }) => {
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setLoaded(true);
      document.body.appendChild(script);
    } else {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded || !window.L) return;
    
    // Proteksi mencegah error "Map container is already initialized"
    const container = document.getElementById('cafe-map-container');
    if (container && container._leaflet_id) {
        container._leaflet_id = null;
    }
    
    // Setup Map Container
    const map = window.L.map('cafe-map-container').setView([-7.4313, 109.2478], 13);
    
    // Gunakan Dark Theme Basemap
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    const bounds = [];

    // Add Markers untuk setiap cafe yang punya koordinat
    if (places && places.length > 0) {
      places.filter(p => p.latitude && p.longitude).forEach(place => {
        const marker = window.L.marker([place.latitude, place.longitude]).addTo(map);
        marker.bindPopup(`<div style="color: #12100E; font-weight: bold; font-family: sans-serif; font-size: 12px; text-align: center;">${place.name}</div>`);
        marker.on('click', () => {
          if (onPlaceClick) onPlaceClick(place);
        });
        bounds.push([place.latitude, place.longitude]);
      });

      // Auto-fit layar peta ke cafe yang ditemukan
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [30, 30] });
      }
    }

    return () => {
      map.remove();
    };
  }, [loaded, places, onPlaceClick]); 

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-[#2A2624] shadow-lg">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1C1917] z-20">
          <span className="text-[#8C8681] text-sm animate-pulse font-bold tracking-widest uppercase">Memuat Peta...</span>
        </div>
      )}
      <div id="cafe-map-container" className="w-full h-full z-10" style={{ background: '#12100E' }}></div>
    </div>
  );
};

export default CafeMap;