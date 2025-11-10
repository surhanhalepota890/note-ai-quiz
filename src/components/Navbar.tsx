import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { GraduationCap, History, LogOut, User, BookOpen, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const Navbar = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
    navigate("/auth");
  };

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center gap-1.5 sm:gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate("/")}
          >
            <GraduationCap className="w-6 sm:w-8 h-6 sm:h-8 text-primary" />
            <span className="text-xl sm:text-2xl font-bold gradient-text">Quizify</span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {user ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => navigate("/flashcards")}
                  className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4"
                  size="sm"
                >
                  <Layers className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Cards</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/study")}
                  className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4"
                  size="sm"
                >
                  <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Study</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/history")}
                  className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4"
                  size="sm"
                >
                  <History className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">History</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/profile")}
                  className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4"
                  size="sm"
                >
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Profile</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleSignOut} 
                  className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4"
                  size="sm"
                >
                  <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate("/auth")} size="sm">Sign In</Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};