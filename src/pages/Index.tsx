import { useState } from "react";
import Hero from "@/components/Hero";
import BookingMap from "@/components/BookingMap";
import BookingForm from "@/components/BookingForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Location {
  lat: number;
  lng: number;
  address: string;
}

const Index = () => {
  const [showBooking, setShowBooking] = useState(false);
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [vehicleTier, setVehicleTier] = useState<'skypod' | 'aeroluxe'>('skypod');
  const [pricing, setPricing] = useState<any>(null);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateRouteComplexity = (): number => {
    // Simulate route complexity based on distance
    // In production, this would analyze no-fly zones in the path
    const distance = pricing?.baseDistance || 0;
    if (distance < 5) return 1.0;
    if (distance < 10) return 1.1;
    if (distance < 20) return 1.2;
    return 1.3;
  };

  const getSurgeMultiplier = (): number => {
    const hour = new Date().getHours();
    // Peak hours: 8-11 AM and 5-8 PM
    if ((hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 20)) {
      return 1.5;
    }
    return 1.0;
  };

  const calculatePricing = (pickup: Location, dest: Location, tier: 'skypod' | 'aeroluxe') => {
    const baseDistance = calculateDistance(pickup.lat, pickup.lng, dest.lat, dest.lng);
    const routeComplexity = baseDistance < 5 ? 1.0 : baseDistance < 15 ? 1.2 : 1.4;
    const surgeMultiplier = getSurgeMultiplier();
    
    // Base rates per km
    const basePricePerKm = tier === 'skypod' ? 50 : 80;
    
    const finalPrice = baseDistance * basePricePerKm * routeComplexity * surgeMultiplier;
    
    setPricing({
      baseDistance,
      routeComplexity,
      surgeMultiplier,
      finalPrice,
    });
  };

  const handleLocationUpdate = (pickup: Location, dest: Location) => {
    setPickupLocation(pickup);
    setDestination(dest);
    calculatePricing(pickup, dest, vehicleTier);
  };

  const handleVehicleSelect = (tier: 'skypod' | 'aeroluxe') => {
    setVehicleTier(tier);
    if (pickupLocation && destination) {
      calculatePricing(pickupLocation, destination, tier);
    }
  };

  const handleConfirmBooking = async () => {
    if (!pickupLocation || !destination) {
      toast.error("Please select pickup and destination locations");
      return;
    }

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.error("Please sign in to book a flight");
      setTimeout(() => {
        window.location.href = "/auth";
      }, 1500);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("bookings")
        .insert({
          user_id: session.user.id,
          pickup_location: { lat: pickupLocation.lat, lng: pickupLocation.lng, address: pickupLocation.address },
          destination: { lat: destination.lat, lng: destination.lng, address: destination.address },
          vehicle_tier: vehicleTier,
          base_distance: pricing.baseDistance,
          route_complexity: pricing.routeComplexity,
          surge_multiplier: pricing.surgeMultiplier,
          final_price: pricing.finalPrice,
          status: 'confirmed',
          estimated_duration: Math.ceil(pricing.baseDistance / (vehicleTier === 'aeroluxe' ? 1.3 : 1.0) * 5),
        })
        .select()
        .single();

      if (error) {
        toast.error("Booking failed: " + error.message);
      } else {
        toast.success("Flight booked successfully! 🚁");
        
        // Update booking to in_transit after 2 seconds
        setTimeout(async () => {
          await supabase
            .from("bookings")
            .update({ status: 'in_transit' })
            .eq('id', data.id);
          
          // Navigate to tracking page
          window.location.href = `/tracking/${data.id}`;
        }, 2000);
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("An error occurred while booking");
    }
  };

  if (!showBooking) {
    return <Hero onStartBooking={() => setShowBooking(true)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-start to-sky-end p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => setShowBooking(false)}
            className="text-white hover:text-white/80 transition-colors"
          >
            ← Back to Home
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map Section */}
          <div className="h-[600px] lg:h-[800px]">
            <BookingMap
              pickupLocation={pickupLocation ? { lat: pickupLocation.lat, lng: pickupLocation.lng } : null}
              destination={destination ? { lat: destination.lat, lng: destination.lng } : null}
            />
          </div>

          {/* Booking Form Section */}
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-xl">
              <h2 className="text-3xl font-bold text-white mb-2">Book Your Flight</h2>
              <p className="text-white/80">Plan your autonomous journey across Bangalore</p>
            </div>
            
            <BookingForm
              onLocationUpdate={handleLocationUpdate}
              onVehicleSelect={handleVehicleSelect}
              onConfirmBooking={handleConfirmBooking}
              pricing={pricing}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
