import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { ArrowLeft, ArrowRight, RotateCcw, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface FlashcardData {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
}

export const Flashcards = () => {
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
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
    fetchFlashcards(session.user.id);
  };

  const fetchFlashcards = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('quiz_results')
        .select('incorrect_answers')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      const allIncorrect: FlashcardData[] = [];
      (data || []).forEach((result) => {
        if (result.incorrect_answers && Array.isArray(result.incorrect_answers)) {
          result.incorrect_answers.forEach((answer: any) => {
            allIncorrect.push({
              question: answer.question,
              userAnswer: answer.userAnswer,
              correctAnswer: answer.correctAnswer,
              explanation: answer.explanation,
            });
          });
        }
      });

      // Shuffle flashcards for better learning
      const shuffled = allIncorrect.sort(() => Math.random() - 0.5);
      setFlashcards(shuffled);
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

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
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

  const currentCard = flashcards[currentIndex];
  const progress = flashcards.length > 0 ? ((currentIndex + 1) / flashcards.length) * 100 : 0;

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
            <h1 className="text-4xl font-bold gradient-text mb-2">Flashcard Review</h1>
            <p className="text-muted-foreground">Master your knowledge with interactive flashcards</p>
          </div>

          {flashcards.length === 0 ? (
            <Card className="p-12 card-glass text-center">
              <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">No Flashcards Available</h2>
              <p className="text-muted-foreground mb-6">
                You haven't missed any questions yet. Take some quizzes to generate flashcards!
              </p>
              <Button onClick={() => navigate("/")}>Start a Quiz</Button>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Card {currentIndex + 1} of {flashcards.length}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Shuffle & Restart
                  </Button>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Flashcard */}
              <div 
                className="relative h-[400px] cursor-pointer perspective-1000"
                onClick={handleFlip}
              >
                <div className={`flashcard-container ${isFlipped ? 'flipped' : ''}`}>
                  {/* Front of card - Question */}
                  <Card className="flashcard-face flashcard-front absolute inset-0 p-8 card-glass glow flex flex-col justify-between">
                    <div>
                      <div className="text-center mb-4">
                        <span className="text-sm font-medium text-muted-foreground">Question</span>
                      </div>
                      <h3 className="text-xl md:text-2xl font-semibold text-center mb-6">
                        {currentCard.question}
                      </h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-destructive/10 border-l-4 border-destructive rounded">
                        <p className="text-sm font-medium text-destructive mb-1">Your Answer:</p>
                        <p className="text-sm">{currentCard.userAnswer}</p>
                      </div>
                      
                      <p className="text-center text-sm text-muted-foreground animate-pulse">
                        Click to reveal answer
                      </p>
                    </div>
                  </Card>

                  {/* Back of card - Answer */}
                  <Card className="flashcard-face flashcard-back absolute inset-0 p-8 card-glass glow flex flex-col justify-between">
                    <div>
                      <div className="text-center mb-4">
                        <span className="text-sm font-medium text-muted-foreground">Correct Answer</span>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 bg-success/10 border-l-4 border-success rounded">
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                            <p className="text-lg font-semibold">{currentCard.correctAnswer}</p>
                          </div>
                        </div>

                        <div className="p-4 bg-muted/50 rounded-lg">
                          <p className="text-sm font-medium mb-2">Explanation:</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {currentCard.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-center text-sm text-muted-foreground">
                      Click to flip back
                    </p>
                  </Card>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between gap-4">
                <Button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  variant="outline"
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </Button>

                <div className="flex gap-2">
                  {flashcards.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentIndex
                          ? 'bg-primary w-8'
                          : idx < currentIndex
                          ? 'bg-success'
                          : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>

                <Button
                  onClick={handleNext}
                  disabled={currentIndex === flashcards.length - 1}
                  variant="outline"
                  className="gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              {currentIndex === flashcards.length - 1 && (
                <Card className="p-6 card-glass text-center">
                  <h3 className="text-lg font-semibold mb-2">You've reviewed all flashcards!</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Great job! Keep practicing to master these concepts.
                  </p>
                  <Button onClick={handleReset} className="gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Start Again
                  </Button>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
