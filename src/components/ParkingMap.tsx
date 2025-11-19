'use client';

import dynamic from 'next/dynamic';
import { ParkingLot } from '@/lib/api';

const Map = dynamic(() => import('./Map'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <div className="text-gray-400 animate-pulse">Loading Map...</div>
        </div>
    ),
});

interface ParkingMapProps {
    parkingLots: ParkingLot[];
}

export default function ParkingMap({ parkingLots }: ParkingMapProps) {
    return <Map parkingLots={parkingLots} />;
}
