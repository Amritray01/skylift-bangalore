import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polygon, Polyline, Circle, useMap } from "react-leaflet";
import { Icon, LatLng, LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { Skyport, NoFlyZone } from "@/types/fly-cab"; // Import the types we just made

// --- ICON SETUP ---
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";

const DefaultIcon = new Icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const SkyPortIcon = new Icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233B82F6'%3E%3Cpath d='M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.86 0-7-3.14-7-7V8.3l7-3.11 7 3.11V13c0 3.86-3.14 7-7 7z'/%3E%3C/svg%3E",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

interface BookingMapProps {
  pickupLocation: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number } | null;
  onLocationSelect?: (type: 'pickup' | 'destination', location: { lat: number; lng: number }) => void;
}

const MapUpdater = ({ center }: { center: LatLng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const BookingMap = ({ pickupLocation, destination }: BookingMapProps) => {
  const [skyports, setSkyports] = useState<Skyport[]>([]);
  const [noFlyZones, setNoFlyZones] = useState<NoFlyZone[]>([]);
  const [mapCenter, setMapCenter] = useState<LatLng>(new LatLng(12.9716, 77.5946));

  useEffect(() => {
    fetchSkyports();
    fetchNoFlyZones();
  }, []);

  useEffect(() => {
    if (pickupLocation) {
      setMapCenter(new LatLng(pickupLocation.lat, pickupLocation.lng));
    }
  }, [pickupLocation]);

  const fetchSkyports = async () => {
    // UPDATED: Query the VIEW, not the table
    const { data, error } = await supabase
      .from("view_skyports_public") 
      .select("*");
    
    if (!error && data) {
      setSkyports(data as Skyport[]);
    } else if (error) {
      console.error("Error fetching ports:", error);
    }
  };

  const fetchNoFlyZones = async () => {
    // UPDATED: Query the VIEW, not the table
    const { data, error } = await supabase
      .from("view_no_fly_zones_public")
      .select("*");
    
    if (!error && data) {
      setNoFlyZones(data as unknown as NoFlyZone[]);
    }
  };

  return (
    <div className="relative h-full w-full rounded-xl overflow-hidden border-2 border-primary/20">
      <MapContainer
        center={[12.9716, 77.5946]}
        zoom={11}
        className="h-full w-full"
        zoomControl={true}
      >
        <MapUpdater center={mapCenter} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* --- Render SkyPorts --- */}
        {skyports.map((port) => (
          <Marker
            key={port.id}
            // UPDATED: Using flat lat/lng from the View
            position={[port.lat, port.lng]} 
            icon={SkyPortIcon}
          >
            <Popup>
              <div className="text-sm">
                <strong>{port.name}</strong>
                <br />
                {port.address}
                <br />
                <span className="text-blue-600 font-bold">{port.type.toUpperCase()}</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* --- Render No-Fly Zones --- */}
        {noFlyZones.map((zone) => {
          // GeoJSON is [Lng, Lat], but Leaflet needs [Lat, Lng]. We must swap them.
          const coordinates: LatLngExpression[] = zone.geometry.coordinates[0].map(
            (coord) => [coord[1], coord[0]] // Swap here!
          );

          return (
            <Polygon
              key={zone.id}
              positions={coordinates}
              pathOptions={{
                color: '#EF4444',
                fillColor: '#EF4444',
                fillOpacity: 0.2,
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-sm">
                  <strong>{zone.name}</strong>
                  <br />
                  {zone.reason}
                </div>
              </Popup>
            </Polygon>
          );
        })}

        {/* Pickup & Destination Visuals */}
        {pickupLocation && (
          <Circle
            center={[pickupLocation.lat, pickupLocation.lng]}
            radius={200}
            pathOptions={{ color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3 }}
          />
        )}

        {destination && (
          <Circle
            center={[destination.lat, destination.lng]}
            radius={200}
            pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 0.3 }}
          />
        )}

        {pickupLocation && destination && (
          <Polyline
            positions={[
              [pickupLocation.lat, pickupLocation.lng],
              [destination.lat, destination.lng],
            ]}
            pathOptions={{
              color: '#3B82F6',
              weight: 3,
              opacity: 0.7,
              dashArray: '10, 10',
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default BookingMap;