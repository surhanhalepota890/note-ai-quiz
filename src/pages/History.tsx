import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Trophy, Calendar, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const History = () => {
  const [quizResults, setQuizResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
    fetchHistory(session.user.id);
  };

  const fetchHistory = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      setQuizResults(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen p-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            <h1 className="text-4xl font-bold gradient-text mb-2">Quiz History</h1>
            <p className="text-muted-foreground">Review your past quiz performances</p>
          </div>

          {quizResults.length === 0 ? (
            <Card className="p-12 card-glass text-center">
              <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">No quiz history yet</h2>
              <p className="text-muted-foreground mb-6">
                Start taking quizzes to see your progress here
              </p>
              <Button onClick={() => navigate("/")}>Create Your First Quiz</Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {quizResults.map((result) => {
                const percentage = Math.round((result.score / result.total_questions) * 100);
                const getPerformanceColor = () => {
                  if (percentage >= 90) return "text-success";
                  if (percentage >= 75) return "text-primary";
                  if (percentage >= 60) return "text-accent";
                  return "text-destructive";
                };

                return (
                  <Card key={result.id} className="p-6 card-glass hover:glow transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                          <Trophy className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-2xl font-bold ${getPerformanceColor()}`}>
                              {result.score}/{result.total_questions}
                            </span>
                            <span className="text-muted-foreground">
                              ({percentage}%)
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {new Date(result.completed_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${getPerformanceColor()}`}>
                          {percentage >= 90 ? "Outstanding!" :
                           percentage >= 75 ? "Great Job!" :
                           percentage >= 60 ? "Good Effort" :
                           "Keep Practicing"}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};