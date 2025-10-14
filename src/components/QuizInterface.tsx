import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Question {
  question: string;
  type: "multiple_choice" | "true_false" | "short_answer";
  options?: string[];
  correct_answer: string;
  explanation: string;
}

interface QuizInterfaceProps {
  noteId: string;
  noteContent: string;
  onComplete: (score: number, total: number) => void;
}

export const QuizInterface = ({ noteId, noteContent, onComplete }: QuizInterfaceProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    generateQuiz();
  }, []);

  const generateQuiz = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: { content: noteContent },
      });

      if (error) throw error;

      setQuestions(data.questions);
      setLoading(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to generate quiz",
      });
      setLoading(false);
    }
  };

  const handleAnswer = () => {
    const question = questions[currentIndex];
    const correct = selectedAnswer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
    
    setIsCorrect(correct);
    setShowFeedback(true);
    
    if (correct) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer("");
      setShowFeedback(false);
    } else {
      onComplete(score + (isCorrect ? 1 : 0), questions.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Generating your personalized quiz...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 card-glass max-w-md text-center">
          <p className="text-lg">No questions generated. Please try with different content.</p>
        </Card>
      </div>
    );
  }

  const question = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-3xl space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span>Score: {score}/{questions.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="p-8 card-glass glow">
          <h2 className="text-2xl font-bold mb-6">{question.question}</h2>

          <div className="space-y-4">
            {question.type === "multiple_choice" && question.options && (
              <div className="space-y-3">
                {question.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => !showFeedback && setSelectedAnswer(option)}
                    disabled={showFeedback}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      selectedAnswer === option
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    } ${showFeedback ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {question.type === "true_false" && (
              <div className="grid grid-cols-2 gap-4">
                {["True", "False"].map((option) => (
                  <Button
                    key={option}
                    onClick={() => !showFeedback && setSelectedAnswer(option)}
                    disabled={showFeedback}
                    variant={selectedAnswer === option ? "default" : "outline"}
                    size="lg"
                  >
                    {option}
                  </Button>
                ))}
              </div>
            )}

            {question.type === "short_answer" && (
              <input
                type="text"
                value={selectedAnswer}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                disabled={showFeedback}
                placeholder="Type your answer..."
                className="w-full p-4 rounded-lg border-2 border-border bg-input focus:border-primary outline-none transition-colors"
              />
            )}
          </div>

          {showFeedback && (
            <div className={`mt-6 p-4 rounded-lg ${isCorrect ? "bg-success/10 border-2 border-success" : "bg-destructive/10 border-2 border-destructive"}`}>
              <div className="flex items-start gap-3">
                {isCorrect ? (
                  <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-semibold mb-2">
                    {isCorrect ? "Correct!" : `Incorrect. The correct answer is: ${question.correct_answer}`}
                  </p>
                  <p className="text-sm text-muted-foreground">{question.explanation}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            {!showFeedback ? (
              <Button onClick={handleAnswer} disabled={!selectedAnswer} size="lg">
                Submit Answer
              </Button>
            ) : (
              <Button onClick={handleNext} size="lg">
                {currentIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
