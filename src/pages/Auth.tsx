import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Loader2, Mail, Lock, User } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const nameSchema = z.string().min(2, "Name must be at least 2 characters");

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});
  const navigate = useNavigate();
  const { toast } = useToast();


  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkUser();
  }, [navigate]);

  const validateInputs = () => {
    const newErrors: { email?: string; password?: string; name?: string } = {};
    
    try {
      emailSchema.parse(email);
    } catch (error) {
      if (error instanceof z.ZodError) {
        newErrors.email = error.issues[0].message;
      }
    }

    try {
      passwordSchema.parse(password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        newErrors.password = error.issues[0].message;
      }
    }

    if (!isLogin) {
      try {
        nameSchema.parse(fullName);
      } catch (error) {
        if (error instanceof z.ZodError) {
          newErrors.name = error.issues[0].message;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInputs()) {
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            throw new Error("Invalid email or password. Please try again.");
          }
          throw error;
        }

        // Ensure profile exists for this user
        const { data: { user: loggedInUser } } = await supabase.auth.getUser();
        if (loggedInUser) {
          await supabase
            .from('profiles')
            .upsert(
              {
                id: loggedInUser.id,
                email: loggedInUser.email,
                full_name: loggedInUser.user_metadata?.full_name ?? null,
              },
              { onConflict: 'id' }
            );
        }

        toast({
          title: "Welcome back!",
          description: "You've successfully logged in.",
        });
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            throw new Error("This email is already registered. Please sign in instead.");
          }
          throw error;
        }

        // Create profile row for the new user
        const { data: { user: signedUpUser } } = await supabase.auth.getUser();
        if (signedUpUser) {
          await supabase
            .from('profiles')
            .upsert(
              {
                id: signedUpUser.id,
                email: signedUpUser.email,
                full_name: fullName.trim(),
              },
              { onConflict: 'id' }
            );
        }

        toast({
          title: "Account created!",
          description: "Welcome to Quizify. You can now start creating quizzes!",
        });
        navigate("/");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md p-6 sm:p-8 card-glass glow">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 sm:p-4 bg-primary/10 rounded-full">
              <GraduationCap className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text mb-2">
            {isLogin ? "Welcome Back" : "Join Quizify"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {isLogin ? "Sign in to continue your learning journey" : "Create an account to get started"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Full Name
              </label>
              <Input
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setErrors({ ...errors, name: undefined });
                }}
                className="bg-input border-border"
              />
              {errors.name && (
                <p className="text-xs text-destructive mt-1">{errors.name}</p>
              )}
            </div>
          )}


          <div>
            <label className="text-sm font-medium mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              Email
            </label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors({ ...errors, email: undefined });
              }}
              className="bg-input border-border"
            />
            {errors.email && (
              <p className="text-xs text-destructive mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors({ ...errors, password: undefined });
              }}
              className="bg-input border-border"
            />
            {errors.password && (
              <p className="text-xs text-destructive mt-1">{errors.password}</p>
            )}
            {!isLogin && (
              <p className="text-xs text-muted-foreground mt-1">
                Must be at least 6 characters
              </p>
            )}
          </div>


          <Button
            type="submit"
            className="w-full mt-6"
            size="lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait...
              </>
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setErrors({});
            }}
            className="text-sm text-primary hover:underline transition-colors"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-center text-muted-foreground">
            By continuing, you agree to Quizify's Terms of Service and Privacy Policy
          </p>
        </div>
      </Card>
    </div>
  );
};