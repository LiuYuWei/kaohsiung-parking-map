'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ParkingLot } from '@/lib/api';
import L from 'leaflet';
import { useState, useEffect } from 'react';
import { Search, MapPin, Navigation } from 'lucide-react';

// Fix for default marker icon in Leaflet with Next.js
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

// Custom icons
const defaultIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const destinationIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const nearestIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface MapProps {
    parkingLots: ParkingLot[];
}

interface Coordinates {
    lat: number;
    lng: number;
}

// Component to handle map movement
function MapController({ center, zoom }: { center: [number, number] | null, zoom: number | null }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom || map.getZoom());
        }
    }, [center, zoom, map]);
    return null;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}

export default function Map({ parkingLots }: MapProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [destination, setDestination] = useState<Coordinates | null>(null);
    const [nearestLots, setNearestLots] = useState<ParkingLot[]>([]);
    const [mapCenter, setMapCenter] = useState<[number, number]>([22.6273, 120.3014]); // Default Kaohsiung center
    const [mapZoom, setMapZoom] = useState<number>(13);
    const [isSearching, setIsSearching] = useState(false);

    const cleanAddress = (input: string) => {
        let cleaned = input;
        // Remove Zip Code (3-5 digits at start)
        cleaned = cleaned.replace(/^\d{3,5}/, '');
        // Remove floor info (e.g., 13樓, B1, 5F)
        // Matches number(s) + 樓/F at the end of string or followed by space
        cleaned = cleaned.replace(/[\d、，,]+[樓Ff].*$/, '');
        return cleaned.trim();
    };

    const searchLocation = async (query: string) => {
        // Append Kaohsiung to query to prioritize local results if not present
        const finalQuery = query.includes('高雄') ? query : `高雄市 ${query}`;

        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(finalQuery)}&addressdetails=1&limit=1`
        );
        return await response.json();
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            let data = await searchLocation(searchQuery);

            // If no results, try cleaning the address
            if (!data || data.length === 0) {
                const cleanedQuery = cleanAddress(searchQuery);
                if (cleanedQuery !== searchQuery) {
                    console.log('Retrying with cleaned query:', cleanedQuery);
                    data = await searchLocation(cleanedQuery);
                }
            }

            if (data && data.length > 0) {
                const result = data[0];

                // Validate if the result is in Kaohsiung
                const isKaohsiung =
                    result.display_name.includes('高雄') ||
                    result.display_name.includes('Kaohsiung') ||
                    (result.address && (result.address.city === '高雄市' || result.address.county === '高雄市'));

                if (!isKaohsiung) {
                    alert('此功能僅支援搜尋高雄市地址，請重新輸入');
                    setIsSearching(false);
                    return;
                }

                const lat = parseFloat(result.lat);
                const lng = parseFloat(result.lon);
                const dest = { lat, lng };
                setDestination(dest);
                setMapCenter([lat, lng]);
                setMapZoom(15);

                // Find nearest parking lots
                const lotsWithDistance = parkingLots.map(lot => ({
                    ...lot,
                    distance: calculateDistance(lat, lng, lot.lat, lot.lng)
                }));

                lotsWithDistance.sort((a, b) => a.distance - b.distance);
                setNearestLots(lotsWithDistance.slice(0, 5));
            } else {
                alert('找不到該地點，請嘗試其他關鍵字');
            }
        } catch (error) {
            console.error('Search error:', error);
            alert('搜尋發生錯誤，請稍後再試');
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="relative h-full w-full">
            {/* Search Overlay */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] w-full max-w-md px-4">
                <form onSubmit={handleSearch} className="relative">
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="請輸入高雄地址 (例如: 巨蛋)..."
                            className="w-full pl-10 pr-4 py-3 rounded-lg shadow-lg border-0 focus:ring-2 focus:ring-blue-500 bg-white/90 backdrop-blur-sm text-gray-800 placeholder-gray-500"
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                            <Search size={20} />
                        </div>
                        <button
                            type="submit"
                            disabled={isSearching}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-1.5 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                        >
                            {isSearching ? (
                                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                                <Navigation size={18} />
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <MapContainer
                center={[22.6273, 120.3014]}
                zoom={13}
                style={{ height: '100%', width: '100%', zIndex: 0 }}
                scrollWheelZoom={true}
            >
                <MapController center={mapCenter} zoom={mapZoom} />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />

                {/* Destination Marker */}
                {destination && (
                    <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
                        <Popup>
                            <div className="font-bold text-red-600">目的地: {searchQuery}</div>
                        </Popup>
                    </Marker>
                )}

                {/* Parking Lots */}
                {parkingLots.map((lot) => {
                    const isNearest = nearestLots.some(n => n.id === lot.id);
                    // If we have nearest lots, only show them? Or show all but highlight nearest?
                    // Let's show all, but highlight nearest with green icon.
                    // If destination is set, maybe we only show nearest 5 to reduce clutter? 
                    // User said "find nearest 5", usually implies showing those.
                    // Let's show all with default icon, and nearest with green icon.

                    return (
                        <Marker
                            key={lot.id}
                            position={[lot.lat, lot.lng]}
                            icon={isNearest ? nearestIcon : defaultIcon}
                            zIndexOffset={isNearest ? 1000 : 0}
                        >
                            <Popup>
                                <div className="p-2 min-w-[200px]">
                                    <h3 className="font-bold text-lg mb-2 text-gray-800 flex items-center gap-2">
                                        {lot.name}
                                        {isNearest && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">最近推薦</span>}
                                    </h3>
                                    <div className="space-y-1 text-sm text-gray-600">
                                        <p><span className="font-semibold">區域:</span> {lot.area}</p>
                                        <p><span className="font-semibold">地址:</span> {lot.address}</p>
                                        <div className="flex gap-2 mt-2">
                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                                小型車: {lot.smallCarSpaces}
                                            </span>
                                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                                機車: {lot.motorSpaces}
                                            </span>
                                        </div>
                                        {lot.rates && (
                                            <p className="mt-2 text-xs text-gray-500 border-t pt-2">
                                                {lot.rates}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
