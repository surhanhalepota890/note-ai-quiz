import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { BookOpen, ArrowLeft, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface IncorrectAnswer {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  quiz_date: string;
}

export const Study = () => {
  const [incorrectAnswers, setIncorrectAnswers] = useState<IncorrectAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
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
    fetchIncorrectAnswers(session.user.id);
  };

  const fetchIncorrectAnswers = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('quiz_results')
        .select('incorrect_answers, completed_at')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      // Flatten all incorrect answers from all quizzes
      const allIncorrect: IncorrectAnswer[] = [];
      (data || []).forEach((result) => {
        if (result.incorrect_answers && Array.isArray(result.incorrect_answers)) {
          result.incorrect_answers.forEach((answer: any) => {
            allIncorrect.push({
              question: answer.question,
              userAnswer: answer.userAnswer,
              correctAnswer: answer.correctAnswer,
              explanation: answer.explanation,
              quiz_date: result.completed_at,
            });
          });
        }
      });

      setIncorrectAnswers(allIncorrect);
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

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
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
            <h1 className="text-4xl font-bold gradient-text mb-2">Study Mode</h1>
            <p className="text-muted-foreground">Review your incorrect answers to improve your knowledge</p>
          </div>

          {incorrectAnswers.length === 0 ? (
            <Card className="p-12 card-glass text-center">
              <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Perfect Performance!</h2>
              <p className="text-muted-foreground mb-6">
                You haven't missed any questions yet. Keep up the great work!
              </p>
              <Button onClick={() => navigate("/")}>Take More Quizzes</Button>
            </Card>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <span className="text-lg font-semibold">
                    {incorrectAnswers.length} question{incorrectAnswers.length !== 1 ? 's' : ''} to review
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {incorrectAnswers.map((answer, index) => (
                  <Card key={index} className="p-6 card-glass hover:glow transition-all">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              Incorrect
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(answer.quiz_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold mb-3">{answer.question}</h3>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="p-3 bg-destructive/10 border-l-4 border-destructive rounded">
                          <p className="text-sm font-medium text-destructive mb-1">Your Answer:</p>
                          <p className="text-sm">{answer.userAnswer}</p>
                        </div>

                        <div className="p-3 bg-success/10 border-l-4 border-success rounded">
                          <p className="text-sm font-medium text-success mb-1">Correct Answer:</p>
                          <p className="text-sm">{answer.correctAnswer}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(index)}
                          className="w-full justify-between"
                        >
                          <span className="text-sm font-medium">
                            {expandedIndex === index ? "Hide" : "Show"} Explanation
                          </span>
                          <span className={`transform transition-transform ${expandedIndex === index ? 'rotate-180' : ''}`}>
                            ▼
                          </span>
                        </Button>
                        
                        {expandedIndex === index && (
                          <div className="mt-3 p-4 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {answer.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};
