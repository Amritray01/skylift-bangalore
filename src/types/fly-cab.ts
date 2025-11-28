export interface Skyport {
  id: string;
  name: string;
  address: string | null;
  type: string;
  lat: number;
  lng: number;
  capacity: number;
  amenities: Record<string, any>;
  status: string;
}

export interface Vehicle {
  id: string;
  call_sign: string;
  model: string;
  status: string;
  battery_level: number;
  lat: number;
  lng: number;
  vibe_features: Record<string, any>;
}

export interface NoFlyZone {
  id: string;
  name: string;
  reason: string;
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
}


export interface Booking {
  id: string;
  created_at: string;
  scheduled_for: string;
  status: 'pending' | 'confirmed' | 'flying' | 'completed' | 'cancelled';
  price: number;
  
  // These fields come from the Supabase Join (pickup:pickup_port_id(...))
  pickup?: {
    name: string;
    type?: string;
  };
  dropoff?: {
    name: string;
    type?: string;
  };
}