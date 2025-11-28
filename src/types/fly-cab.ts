export interface Skyport {
  id: string;
  name: string;
  address: string | null;
  lat: number;  // From view
  lng: number;  // From view
  capacity: number;
  type: string;
}

export interface NoFlyZone {
  id: string;
  name: string;
  reason: string;
  geometry: {
    type: "Polygon";
    coordinates: number[][][]; // GeoJSON format [lng, lat]
  };
}