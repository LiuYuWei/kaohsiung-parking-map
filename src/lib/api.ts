
export interface ParkingLotRaw {
    Seq: number;
    編號: string;
    行政區: string;
    型式: string;
    停車場名稱: string;
    停車場位置: string;
    大型車車位: string;
    小型車車位: string;
    機車車位: string;
    孕婦及育有六歲以下兒童者停車位: string;
    收費標準: string;
    營業時間: string;
    客服電話: string;
    緯度: string;
    經度: string;
}

export interface ParkingLot {
    id: number;
    code: string;
    area: string;
    type: string;
    name: string;
    address: string;
    largeCarSpaces: number;
    smallCarSpaces: number;
    motorSpaces: number;
    pregnancySpaces: number;
    rates: string;
    hours: string;
    phone: string;
    lat: number;
    lng: number;
}

export async function fetchParkingData(): Promise<ParkingLot[]> {
    try {
        const response = await fetch(
            'https://openapi.kcg.gov.tw/Api/Service/Get/f7a489d4-18ca-46a6-9404-1a4a9ee66c3e'
        );
        if (!response.ok) {
            throw new Error('Failed to fetch parking data');
        }
        const json = await response.json();
        const data: ParkingLotRaw[] = json.data;

        return data.map((item) => ({
            id: item.Seq,
            code: item.編號,
            area: item.行政區,
            type: item.型式,
            name: item.停車場名稱,
            address: item.停車場位置,
            largeCarSpaces: parseInt(item.大型車車位) || 0,
            smallCarSpaces: parseInt(item.小型車車位) || 0,
            motorSpaces: parseInt(item.機車車位) || 0,
            pregnancySpaces: parseInt(item.孕婦及育有六歲以下兒童者停車位) || 0,
            rates: item.收費標準,
            hours: item.營業時間,
            phone: item.客服電話,
            lat: parseFloat(item.緯度),
            lng: parseFloat(item.經度),
        }));
    } catch (error) {
        console.error('Error fetching parking data:', error);
        return [];
    }
}
