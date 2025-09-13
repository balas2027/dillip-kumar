import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { places } from '../data/places';
import type { Place } from '../types';

interface RoutingMapProps {
  from: [number, number] | null;
  to: [number, number] | null;
  fromname: string;
  toname: string;
  handleDistanceUpdate: (distance: string | null) => void;
  onPlaceSelect: (place: Place) => void;
}

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const placeIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
});

const currentLocationIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/25/25231.png',
    iconSize: [25, 25],
    iconAnchor: [12.5, 12.5],
    popupAnchor: [0, -12.5],
});

export default function RoutingMap({ from, to, fromname, toname, handleDistanceUpdate, onPlaceSelect }: RoutingMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const routeMarkersRef = useRef<L.Marker[]>([]);
  const routeLayersRef = useRef<L.GeoJSON[]>([]);
  const [distance, setDistance] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map("map").setView([23.6102, 85.2799], 8); // Centered on Jharkhand
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(mapRef.current);

      places.forEach(place => {
        const popupContent = `
          <div class="w-52 font-sans">
            <h3 class="font-bold mb-2 text-base">${place.name}</h3>
            <img src="${place.images[0]}" alt="${place.name}" class="w-full h-28 object-cover rounded mb-2" />
            <p class="text-xs mb-3 max-h-12 overflow-hidden">${place.description}</p>
            <div class="flex gap-2">
              <button id="route-btn-${place.id}" class="flex-1 py-1.5 px-2 text-xs bg-black text-white rounded cursor-pointer border-none">Route to here</button>
              <a href="https://www.google.com/maps?q=${place.coords[0]},${place.coords[1]}" target="_blank" rel="noopener noreferrer" class="flex-1 py-1.5 px-2 text-xs bg-gray-100 text-black border border-gray-300 rounded no-underline text-center">View on Google</a>
            </div>
          </div>
        `;
        const marker = L.marker(place.coords, { icon: placeIcon }).addTo(mapRef.current!);
        marker.bindPopup(popupContent, { minWidth: 220 });

        marker.on('popupopen', () => {
          const btn = document.getElementById(`route-btn-${place.id}`);
          if (btn) {
            btn.onclick = () => {
              onPlaceSelect(place);
              mapRef.current?.closePopup();
            };
          }
        });
      });
    }

    return () => {
      // Clean up map instance on component unmount
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear previous route layers
    routeMarkersRef.current.forEach((m) => mapRef.current?.removeLayer(m));
    routeMarkersRef.current = [];
    routeLayersRef.current.forEach((l) => mapRef.current?.removeLayer(l));
    routeLayersRef.current = [];
    setDistance(null);

    if (from && to && from.length === 2 && to.length === 2) {
      const [fromLat, fromLng] = from;
      const [toLat, toLng] = to;

      const fromMarker = L.marker([fromLat, fromLng], { icon: fromname === "My Location" ? currentLocationIcon : new L.Icon.Default() }).addTo(mapRef.current).bindPopup(`From: ${fromname}`);
      const toMarker = L.marker([toLat, toLng]).addTo(mapRef.current).bindPopup(`To: ${toname}`);
      routeMarkersRef.current.push(fromMarker, toMarker);

      const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
      fetch(url)
        .then((res) => res.json())
        .then((result) => {
          if (!result.routes || result.routes.length === 0) return;
          const route = result.routes[0].geometry;
          
          const distMeters = result.routes[0].distance;
          const distKm = (distMeters / 1000).toFixed(2);
          setDistance(distKm);

          const geojson = L.geoJSON(route, {
            style: { color: "#000", weight: 4, opacity: 0.7 },
          }).addTo(mapRef.current!);

          routeLayersRef.current.push(geojson);
          mapRef.current!.fitBounds(geojson.getBounds(), { padding: [50, 50] });
        })
        .catch((err) => console.error("Routing error", err));
    } else if (from && from.length === 2) {
        const fromMarker = L.marker(from, { icon: currentLocationIcon }).addTo(mapRef.current).bindPopup(`From: ${fromname}`);
        routeMarkersRef.current.push(fromMarker);
        mapRef.current.setView(from, 13);
    }

  }, [from, to, fromname, toname]);

  useEffect(() => {
      handleDistanceUpdate(distance);
  }, [distance, handleDistanceUpdate]);

  return (
    <div className="h-full w-full relative">
      <div id="map" className="h-full w-full z-0"></div>
    </div>
  );
}