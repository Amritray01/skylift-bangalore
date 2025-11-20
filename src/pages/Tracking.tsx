import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MapContainer, TileLayer, Marker, Polyline, Circle, useMap } from "react-leaflet";
import { Icon, LatLng } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plane, MapPin, Clock, Navigation, ArrowLeft } from "lucide-react";

const VehicleIcon = new Icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233B82F6'%3E%3Cpath d='M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z'/%3E%3C/svg%3E",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

interface MapUpdaterProps {
  center: LatLng;
  zoom?: number;
}

const MapUpdater = ({ center, zoom = 13 }: MapUpdaterProps) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
};

const Tracking = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  const [vehiclePosition, setVehiclePosition] = useState<{ lat: number; lng: number } | null>(null);
  const [eta, setEta] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndFetchBooking();
  }, [bookingId]);

  useEffect(() => {
    if (!booking) return;

    // Set up realtime subscription for vehicle updates
    const channel = supabase
      .channel(`booking-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${bookingId}`
        },
        (payload) => {
          console.log('Booking updated:', payload);
          setBooking(payload.new);
        }
      )
      .subscribe();

    // Simulate vehicle movement
    simulateVehicleMovement();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [booking, bookingId]);

  const checkAuthAndFetchBooking = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.error("Please sign in to track your flight");
      navigate("/auth");
      return;
    }

    await fetchBooking();
  };

  const fetchBooking = async () => {
    setLoading(true);
    try {
      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

      if (bookingError) throw bookingError;
      setBooking(bookingData);

      // Fetch assigned vehicle
      const { data: vehicleData } = await supabase
        .from("vehicles")
        .select("*")
        .eq("tier", bookingData.vehicle_tier)
        .eq("status", "available")
        .limit(1)
        .single();

      if (vehicleData) {
        setVehicle(vehicleData);
        const location = vehicleData.current_location as { lat: number; lng: number };
        setVehiclePosition(location);
      }

      setEta(bookingData.estimated_duration);
    } catch (error: any) {
      toast.error("Failed to load tracking information");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const simulateVehicleMovement = () => {
    if (!booking || !vehiclePosition) return;

    const interval = setInterval(() => {
      setVehiclePosition((prev) => {
        if (!prev || !booking) return prev;

        const destination = booking.destination;
        const latDiff = destination.lat - prev.lat;
        const lngDiff = destination.lng - prev.lng;

        // Move 10% closer to destination each update
        const newLat = prev.lat + latDiff * 0.1;
        const newLng = prev.lng + lngDiff * 0.1;

        // Update ETA
        setEta((prevEta) => Math.max(0, prevEta - 0.5));

        // Check if reached destination
        if (Math.abs(latDiff) < 0.001 && Math.abs(lngDiff) < 0.001) {
          clearInterval(interval);
          updateBookingStatus("completed");
          toast.success("Flight completed!");
        }

        return { lat: newLat, lng: newLng };
      });
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  };

  const updateBookingStatus = async (status: string) => {
    await supabase
      .from("bookings")
      .update({ status })
      .eq("id", bookingId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-start to-sky-end">
        <Card className="glass-panel">
          <CardContent className="py-8">
            <p className="text-center">Loading tracking information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-start to-sky-end">
        <Card className="glass-panel">
          <CardContent className="py-8 text-center">
            <p className="mb-4">Booking not found</p>
            <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mapCenter = vehiclePosition 
    ? new LatLng(vehiclePosition.lat, vehiclePosition.lng)
    : new LatLng(booking.pickup_location.lat, booking.pickup_location.lng);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-start to-sky-end p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2 h-[600px] rounded-xl overflow-hidden border-2 border-primary/20">
            <MapContainer
              center={[mapCenter.lat, mapCenter.lng]}
              zoom={13}
              className="h-full w-full"
              zoomControl={true}
            >
              <MapUpdater center={mapCenter} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Pickup Location */}
              <Circle
                center={[booking.pickup_location.lat, booking.pickup_location.lng]}
                radius={150}
                pathOptions={{
                  color: '#10B981',
                  fillColor: '#10B981',
                  fillOpacity: 0.2,
                }}
              />

              {/* Destination */}
              <Circle
                center={[booking.destination.lat, booking.destination.lng]}
                radius={150}
                pathOptions={{
                  color: '#EF4444',
                  fillColor: '#EF4444',
                  fillOpacity: 0.2,
                }}
              />

              {/* Vehicle Position */}
              {vehiclePosition && (
                <Marker
                  position={[vehiclePosition.lat, vehiclePosition.lng]}
                  icon={VehicleIcon}
                />
              )}

              {/* Flight Path */}
              {vehiclePosition && (
                <Polyline
                  positions={[
                    [vehiclePosition.lat, vehiclePosition.lng],
                    [booking.destination.lat, booking.destination.lng],
                  ]}
                  pathOptions={{
                    color: '#3B82F6',
                    weight: 3,
                    opacity: 0.6,
                    dashArray: '10, 10',
                  }}
                />
              )}
            </MapContainer>
          </div>

          {/* Info Panel */}
          <div className="space-y-4">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Plane className="w-5 h-5 text-primary" />
                    Live Tracking
                  </span>
                  <Badge className="bg-green-500">In Transit</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Estimated Time</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-8 h-8 text-accent" />
                      <p className="text-4xl font-bold">{eta.toFixed(0)}</p>
                      <p className="text-xl text-muted-foreground">min</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Vehicle</p>
                    <p className="font-semibold">
                      {booking.vehicle_tier === "skypod" ? "SkyPod Economy" : "AeroLuxe Premium"}
                    </p>
                    {vehicle && (
                      <p className="text-sm text-muted-foreground">{vehicle.vehicle_code}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-green-500" />
                      Pickup
                    </p>
                    <p className="text-sm">{booking.pickup_location.address}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-500" />
                      Destination
                    </p>
                    <p className="text-sm">{booking.destination.address}</p>
                  </div>

                  <div className="border-t pt-3">
                    <p className="text-sm text-muted-foreground mb-1">Total Fare</p>
                    <p className="text-2xl font-bold text-primary">₹{booking.final_price.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="w-5 h-5" />
                  Flight Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <div>
                      <p className="text-sm font-semibold">Vehicle En Route</p>
                      <p className="text-xs text-muted-foreground">Your SkyLift is on the way</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                    <div>
                      <p className="text-sm font-semibold">Flying</p>
                      <p className="text-xs text-muted-foreground">Currently in flight</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-gray-300" />
                    <div>
                      <p className="text-sm font-semibold">Landing Soon</p>
                      <p className="text-xs text-muted-foreground">Preparing for arrival</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tracking;
