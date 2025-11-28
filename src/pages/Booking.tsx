import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skyport } from "@/types/fly-cab";
import BookingMap from "@/components/BookingMap";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner"; // If you don't have sonner, replace with alert()

const BookingPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [skyports, setSkyports] = useState<Skyport[]>([]);
  
  // Selection State
  const [pickupId, setPickupId] = useState<string>("");
  const [dropoffId, setDropoffId] = useState<string>("");
  
  // Computed Data
  const [pickupPort, setPickupPort] = useState<Skyport | null>(null);
  const [dropoffPort, setDropoffPort] = useState<Skyport | null>(null);
  const [price, setPrice] = useState<number>(0);

  // 1. Load Skyports from the VIEW
  useEffect(() => {
    const loadPorts = async () => {
      const { data, error } = await supabase.from('view_skyports_public').select('*');
      if (data) setSkyports(data as Skyport[]);
      if (error) console.error("Failed to load ports", error);
    };
    loadPorts();
  }, []);

  // 2. Update Map & Price when selection changes
  useEffect(() => {
    const p = skyports.find(s => s.id === pickupId) || null;
    const d = skyports.find(s => s.id === dropoffId) || null;
    setPickupPort(p);
    setDropoffPort(d);

    if (p && d) {
      // Simple Price Algo: Distance * Rate
      // 1 degree lat/lng is roughly 111km
      const dist = Math.sqrt(Math.pow(p.lat - d.lat, 2) + Math.pow(p.lng - d.lng, 2)) * 111;
      const calculatedPrice = Math.round(dist * 180) + 250; // Base fare ₹250 + ₹180/km
      setPrice(calculatedPrice);
    } else {
      setPrice(0);
    }
  }, [pickupId, dropoffId, skyports]);


  const handleBooking = async () => {
    if (!pickupPort || !dropoffPort) return;

    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login first");
        navigate("/auth");
        return;
      }

      // INSERT into the flexible 'bookings' table
      const { error } = await supabase.from('bookings').insert({
        user_id: user.id,
        pickup_port_id: pickupPort.id,
        dropoff_port_id: dropoffPort.id,
        status: 'pending',
        price: price,
        scheduled_for: new Date().toISOString(), // Now
        // If you are using the 'Strict' schema, uncomment these:
        // final_price: price, 
        // pickup_location: { lat: pickupPort.lat, lng: pickupPort.lng, name: pickupPort.name },
        // destination: { lat: dropoffPort.lat, lng: dropoffPort.lng, name: dropoffPort.name },
        // vehicle_tier: 'Premium'
      });

      if (error) throw error;

      toast.success("Flight Booked Successfully!");
      navigate("/dashboard");

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-slate-950 text-slate-100 overflow-hidden">
      
      {/* LEFT SIDEBAR: Controls */}
      <div className="w-full md:w-[400px] p-6 z-20 bg-slate-900 border-r border-slate-800 shadow-2xl flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Book Skylift</h2>
          <p className="text-slate-400 text-sm mt-1">Select your route across the city.</p>
        </div>

        <div className="space-y-5">
          {/* Pickup Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pickup Skyport</label>
            <Select onValueChange={setPickupId} value={pickupId}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-12 focus:ring-blue-500">
                <SelectValue placeholder="Select Pickup" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                {skyports.map((port) => (
                  <SelectItem key={port.id} value={port.id} className="focus:bg-slate-700 focus:text-white">
                    {port.name} <span className="text-slate-500 text-xs ml-2">({port.type})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dropoff Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Destination</label>
            <Select onValueChange={setDropoffId} value={dropoffId}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-12 focus:ring-emerald-500">
                <SelectValue placeholder="Select Destination" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                {skyports.map((port) => (
                  <SelectItem key={port.id} value={port.id} disabled={port.id === pickupId} className="focus:bg-slate-700 focus:text-white">
                    {port.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Fare Estimate */}
        {price > 0 && (
          <Card className="bg-blue-950/30 border-blue-500/30 p-4 mt-2 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-blue-200 font-medium">Estimated Fare</span>
              <span className="text-3xl font-bold text-blue-400">₹{price}</span>
            </div>
            <div className="w-full bg-blue-900/50 h-1 mt-2 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full w-2/3"></div>
            </div>
            <p className="text-[10px] text-blue-300/60 mt-2 uppercase tracking-wide">
              Includes Premium Service Charge
            </p>
          </Card>
        )}

        <div className="mt-auto pt-6">
          <Button 
            className={`w-full h-14 text-lg font-bold shadow-xl transition-all ${
              price > 0 ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
            onClick={handleBooking}
            disabled={loading || !pickupId || !dropoffId}
          >
            {loading ? (
              <span className="flex items-center gap-2">Processing...</span>
            ) : "Request Cab"}
          </Button>
          <p className="text-center text-xs text-slate-600 mt-4">
            By booking, you agree to Skylift Bangalore Terms of Service.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Map */}
      <div className="flex-1 relative bg-slate-800">
        <BookingMap 
          pickupLocation={pickupPort ? { lat: pickupPort.lat, lng: pickupPort.lng } : null}
          destination={dropoffPort ? { lat: dropoffPort.lat, lng: dropoffPort.lng } : null}
        />
        
        {/* Overlay Badges */}
        <div className="absolute top-6 right-6 flex flex-col gap-2 pointer-events-none">
          <div className="bg-black/80 backdrop-blur-md text-emerald-400 px-3 py-1.5 rounded-md text-xs font-bold border border-emerald-500/30 shadow-lg">
            LIVE AIR TRAFFIC
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;