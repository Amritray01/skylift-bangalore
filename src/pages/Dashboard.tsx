import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plane, MapPin, Clock, User, LogOut, Calendar } from "lucide-react";

interface Booking {
  id: string;
  pickup_location: any;
  destination: any;
  vehicle_tier: string;
  final_price: number;
  status: string;
  estimated_duration: number;
  created_at: string;
}

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchBookings(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);
    await fetchBookings(session.user.id);
  };

  const fetchBookings = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      toast.error("Failed to load bookings");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500";
      case "in_transit":
        return "bg-blue-500";
      case "completed":
        return "bg-gray-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  };

  const activeBookings = bookings.filter((b) => 
    b.status === "confirmed" || b.status === "in_transit"
  );
  
  const pastBookings = bookings.filter((b) => 
    b.status === "completed" || b.status === "cancelled"
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-start to-sky-end p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Plane className="w-10 h-10 text-white" />
            <div>
              <h1 className="text-3xl font-bold text-white">Dashboard</h1>
              <p className="text-white/80">Welcome back, {user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              Book Flight
            </Button>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-panel">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Flights</p>
                  <p className="text-3xl font-bold">{bookings.length}</p>
                </div>
                <Plane className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Bookings</p>
                  <p className="text-3xl font-bold">{activeBookings.length}</p>
                </div>
                <Clock className="w-8 h-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-3xl font-bold">
                    {bookings.filter((b) => b.status === "completed").length}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Bookings */}
        {activeBookings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Active Flights</h2>
            <div className="grid gap-4">
              {activeBookings.map((booking) => (
                <Card key={booking.id} className="glass-panel">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Plane className="w-5 h-5" />
                          {booking.vehicle_tier === "skypod" ? "SkyPod" : "AeroLuxe"}
                        </CardTitle>
                        <CardDescription>
                          Booking ID: {booking.id.substring(0, 8)}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status.replace("_", " ").toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-primary mt-1" />
                      <div>
                        <p className="text-sm font-semibold">Pickup</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.pickup_location.address}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-accent mt-1" />
                      <div>
                        <p className="text-sm font-semibold">Destination</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.destination.address}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{booking.estimated_duration} min</span>
                      </div>
                      <div className="text-lg font-bold text-primary">
                        ₹{booking.final_price.toFixed(2)}
                      </div>
                    </div>
                    {booking.status === "in_transit" && (
                      <Button
                        className="w-full"
                        onClick={() => navigate(`/tracking/${booking.id}`)}
                      >
                        Track Flight
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Past Bookings */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Flight History</h2>
          {loading ? (
            <Card className="glass-panel">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Loading...</p>
              </CardContent>
            </Card>
          ) : pastBookings.length === 0 ? (
            <Card className="glass-panel">
              <CardContent className="py-8 text-center">
                <Plane className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No past bookings yet</p>
                <Button onClick={() => navigate("/")}>Book Your First Flight</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pastBookings.map((booking) => (
                <Card key={booking.id} className="glass-panel">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {booking.vehicle_tier === "skypod" ? "SkyPod" : "AeroLuxe"}
                        </Badge>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">From</p>
                        <p className="text-sm">{booking.pickup_location.address}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">To</p>
                        <p className="text-sm">{booking.destination.address}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1">Price</p>
                        <p className="text-lg font-bold text-primary">
                          ₹{booking.final_price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
