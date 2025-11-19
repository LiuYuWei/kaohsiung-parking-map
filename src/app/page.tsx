
import { fetchParkingData } from '@/lib/api';
import ParkingMap from '@/components/ParkingMap';

export default async function Home() {
  const parkingLots = await fetchParkingData();

  return (
    <main className="flex flex-col h-screen bg-stone-50 text-stone-800 font-sans">
      <header className="flex-none p-6 bg-white shadow-sm z-10 border-b border-stone-200">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">高雄市停車資訊網</h1>
            <p className="text-sm text-stone-500 mt-1">Kaohsiung Parking Map</p>
          </div>
          <div className="text-sm text-stone-500">
            共 {parkingLots.length} 處停車場
          </div>
        </div>
      </header>

      <div className="flex-1 relative">
        <ParkingMap parkingLots={parkingLots} />
      </div>
    </main>
  );
}
