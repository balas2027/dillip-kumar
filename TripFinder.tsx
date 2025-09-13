
import React, { useState, useEffect } from "react";
import RoutingMap from "./RoutingMap";
import type { Coords, Place, SearchHistoryItem } from '../types';

export default function TripFinder() {
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [coords, setCoords] = useState<Coords>({ from: null, to: null });
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [distance, setDistance] = useState<string | null>(null);

  function handleDistanceUpdate(newDistance: string | null) {
    setDistance(newDistance);
  }

  async function geocodePlace(place: string): Promise<[number, number] | null> {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`);
      const data = await res.json();
      if (data.length > 0)
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      return null;
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  }

  async function handleSearch() {
    if (!from || !to) {
      alert("Please enter both pick-up and drop-off locations.");
      return;
    }
    const fromCoords = from === "My Location" && coords.from ? coords.from : await geocodePlace(from);
    const toCoords = await geocodePlace(to);

    if (fromCoords && toCoords) {
      setCoords({ from: fromCoords, to: toCoords });

      const newSearch: SearchHistoryItem = { from, to, timestamp: new Date().toLocaleString() };
      setSearchHistory((prev) => {
        const exists = prev.some((search) => search.from === from && search.to === to);
        if (!exists) {
          return [newSearch, ...prev.slice(0, 9)];
        }
        return prev;
      });
    } else {
      alert("One or both locations could not be found. Please try again.");
    }
  }

  async function handleHistoryClick(historyItem: SearchHistoryItem) {
    setFrom(historyItem.from);
    setTo(historyItem.to);
    
    // Immediately fetch coordinates and update the map
    const fromCoords = await geocodePlace(historyItem.from);
    const toCoords = await geocodePlace(historyItem.to);
    if (fromCoords && toCoords) {
      setCoords({ from: fromCoords, to: toCoords });
    } else {
      alert("Could not find locations from history.");
      setCoords({ from: null, to: null });
    }
  }

  const handlePlaceSelect = (place: Place) => {
    setTo(place.name);
    setCoords(prev => ({ ...prev, to: place.coords }));
  };
  
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFrom("My Location");
        setCoords({ from: [latitude, longitude], to: null });
      },
      () => {
        alert("Unable to retrieve your location. Please check browser permissions.");
      }
    );
  };

  return (
    <div className="min-h-screen bg-white flex font-sans">
      {/* Left Sidebar */}
      <div className="w-96 bg-white shadow-lg flex flex-col shrink-0">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 m-0">
              Jharkhand Tours
            </h1>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Find a trip
            </h2>

            <div className="flex flex-col gap-4">
              {/* Pick-up location */}
              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <input
                    type="text"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    placeholder="Pick-up location"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-900 text-base outline-none focus:ring-2 focus:ring-black focus:border-black"
                  />
                </div>
                 <button 
                  onClick={handleUseCurrentLocation}
                  className="text-sm text-blue-600 hover:underline mt-2 ml-6"
                >
                  Use my current location
                </button>
              </div>

              {/* Drop-off location */}
              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-black rounded-sm"></div>
                  <input
                    type="text"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="Drop-off location (or select on map)"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-900 text-base outline-none focus:ring-2 focus:ring-black focus:border-black"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSearch}
              className="w-full bg-black text-white font-medium py-3 rounded-lg border-none cursor-pointer mt-6 transition-opacity hover:opacity-80"
            >
              Search
            </button>

            {distance && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="text-gray-800 font-medium">
                  Distance: <span className="font-bold text-black">{distance} km</span>
                </div>
                <div className="text-gray-800 font-medium">
                  Estimated Price: <span className="font-bold text-black">₹{(parseFloat(distance) * 10).toFixed(2)}</span> (@ ₹10/km)
                </div>
              </div>
            )}

            {/* Search History */}
            {searchHistory.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200 flex flex-col gap-3">
                <h3 className="text-sm font-medium text-gray-900">
                  Recent searches
                </h3>
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                  {searchHistory.map((search, index) => (
                    <div
                      key={index}
                      onClick={() => handleHistoryClick(search)}
                      className="p-3 bg-gray-50 rounded-lg cursor-pointer transition-colors hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-gray-700 flex-1 truncate">{search.from}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm mt-1">
                        <div className="w-2 h-2 bg-black rounded-sm"></div>
                        <span className="text-gray-700 flex-1 truncate">{search.to}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 pl-4">{search.timestamp}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setSearchHistory([])}
                  className="w-full text-sm text-gray-500 bg-transparent border-none cursor-pointer p-2 hover:text-red-600"
                >
                  Clear history
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative">
        <RoutingMap
          from={coords.from}
          to={coords.to}
          fromname={from}
          toname={to}
          handleDistanceUpdate={handleDistanceUpdate}
          onPlaceSelect={handlePlaceSelect}
        />
      </div>
    </div>
  );
}
