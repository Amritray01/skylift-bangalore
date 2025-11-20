import { Button } from "@/components/ui/button";
import { Plane, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface HeroProps {
  onStartBooking: () => void;
}

const Hero = ({ onStartBooking }: HeroProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Top Navigation */}
      <div className="absolute top-0 left-0 right-0 p-4 md:p-8 flex justify-between items-center z-20">
        <div className="flex items-center gap-2">
          <Plane className="w-8 h-8 text-white" />
          <span className="text-2xl font-bold text-white">SkyLift</span>
        </div>
        <div className="flex gap-2">
          {user ? (
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              <User className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => navigate("/auth")}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              <User className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          )}
        </div>
      </div>
      {/* Animated gradient background */}
      <div className="absolute inset-0 sky-gradient opacity-90" />
      
      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-accent/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      
      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <div className="mb-6 inline-block">
          <Plane className="w-20 h-20 text-white animate-float" />
        </div>
        
        <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tight">
          SkyLift
        </h1>
        
        <p className="text-xl md:text-2xl text-white/90 mb-4 font-light">
          Bangalore's First Autonomous Flying Taxi Service
        </p>
        
        <p className="text-lg md:text-xl text-white/80 mb-12 max-w-2xl mx-auto">
          Skip the traffic. Fly direct. Experience premium air mobility with eVTOL technology.
        </p>
        
        <Button 
          size="lg"
          variant="hero"
          onClick={onStartBooking}
          className="text-lg px-10 py-7 glow-effect transition-all duration-300 hover:scale-105"
        >
          Book Your Flight
        </Button>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-white/90">
          <div className="glass-panel p-6 rounded-xl">
            <div className="text-4xl font-bold mb-2">5 min</div>
            <div className="text-sm uppercase tracking-wide">Average Flight Time</div>
          </div>
          <div className="glass-panel p-6 rounded-xl">
            <div className="text-4xl font-bold mb-2">Zero</div>
            <div className="text-sm uppercase tracking-wide">Carbon Emissions</div>
          </div>
          <div className="glass-panel p-6 rounded-xl">
            <div className="text-4xl font-bold mb-2">100%</div>
            <div className="text-sm uppercase tracking-wide">Autonomous</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
