import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Booking } from "@/types/fly-cab"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Clock, ArrowRight, TrendingUp } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Traveler");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeFleet, setActiveFleet] = useState<number>(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Check User Session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth"); 
        return;
      }
      
      // Get User Profile (Optional)
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
        
      if (profile?.full_name) setUserName(profile.full_name);

      // 2. Fetch My Bookings
      // We join with Skyports to get the readable names instead of just IDs
      const { data: myBookings, error } = await supabase
        .from("bookings")
        .select(`
          *,
          pickup:pickup_port_id(name, type),
          dropoff:dropoff_port_id(name, type)
        `)
        .eq("user_id", user.id)
        .order("scheduled_for", { ascending: false });

      if (error) console.error("Error fetching bookings:", error);
      else setBookings(myBookings as any);

      // 3. Get Live Fleet Count
      const { count } = await supabase
        .from("view_vehicles_public") // Querying the View
        .select("*", { count: 'exact', head: true })
        .neq("status", "maintenance"); // Count everything except maintenance
      
      setActiveFleet(count || 0);

    } catch (error) {
      console.error("Dashboard Load Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-white">Loading Command Center...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Welcome back, {userName}
          </h1>
          <p className="text-slate-400 mt-2 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            Bangalore Airspace is Active
          </p>
        </div>
        <Button 
          onClick={() => navigate("/booking")} 
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-6 text-lg shadow-lg shadow-blue-900/20"
        >
          Book New Flight
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider">Total Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white">{bookings.length}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider">Active SkyCabs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-emerald-400 flex items-center gap-2">
              {activeFleet}
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-xs text-slate-500 mt-1">Currently airborne over Bangalore</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {bookings.find(b => b.status === 'pending') 
                ? new Date(bookings.find(b => b.status === 'pending')!.scheduled_for).toLocaleDateString()
                : "No flights"}
            </div>
            <p className="text-xs text-slate-500 mt-1">
               {bookings.find(b => b.status === 'pending') ? "Scheduled & Confirmed" : "Plan your next trip"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Flight Logs */}
      <h2 className="text-xl font-semibold mb-4 text-white">Recent Flight Logs</h2>
      <div className="space-y-4">
        {bookings.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-800 rounded-lg text-center text-slate-500">
            No flight history found. Start your journey today!
          </div>
        ) : (
          bookings.map((booking: any) => (
            <div key={booking.id} className="flex flex-col md:flex-row items-center justify-between p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-600 transition-all group">
              <div className="flex items-center gap-5 w-full md:w-auto">
                <div className={`p-3 rounded-full ${
                  booking.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 
                  booking.status === 'pending' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'
                }`}>
                  {booking.status === 'completed' ? <MapPin className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                </div>
                <div>
                  <div className="text-lg font-medium text-slate-200 flex items-center gap-2">
                    {booking.pickup?.name || "Unknown"} 
                    <ArrowRight className="w-4 h-4 text-slate-600"/> 
                    {booking.dropoff?.name || "Unknown"}
                  </div>
                  <div className="text-sm text-slate-500 flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(booking.scheduled_for).toLocaleDateString()}</span>
                    <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                    <span className="text-slate-400">₹{booking.price}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0 w-full md:w-auto text-right">
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
                  booking.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                  booking.status === 'pending' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                  'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {booking.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;