import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QuizConfiguration } from "./QuizConfig";

interface Question {
  question: string;
  type: "multiple_choice" | "true_false" | "short_answer";
  options?: string[];
  correct_answer: string;
  explanation: string;
}

interface QuizInterfaceProps {
  noteContent: string;
  selectedTopics?: string[];
  quizConfig: QuizConfiguration;
  onComplete: (score: number, total: number, answers: any[]) => void;
}

export const QuizInterface = ({ noteContent, selectedTopics, quizConfig, onComplete }: QuizInterfaceProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userAnswers, setUserAnswers] = useState<{ question: string; userAnswer: string; correctAnswer: string; isCorrect: boolean; explanation: string }[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    generateQuiz();
  }, []);

  const generateQuiz = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-quiz`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            content: noteContent,
            selectedTopics: selectedTopics,
            config: quizConfig,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate quiz');
      }

      const data = await response.json();
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

  const handleAnswer = async () => {
    const question = questions[currentIndex];
    let correct = false;

    // For short answer questions, use AI to verify conceptual correctness
    if (question.type === "short_answer") {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-answer`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({
              question: question.question,
              userAnswer: selectedAnswer,
              correctAnswer: question.correct_answer,
              context: noteContent,
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          correct = data.isCorrect;
        } else {
          correct = selectedAnswer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
        }
      } catch (error) {
        console.error('Error verifying answer:', error);
        correct = selectedAnswer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
      }
    } else {
      correct = selectedAnswer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
    }
    
    setIsCorrect(correct);
    setShowFeedback(true);
    
    // Track the answer
    setUserAnswers([...userAnswers, {
      question: question.question,
      userAnswer: selectedAnswer,
      correctAnswer: question.correct_answer,
      isCorrect: correct,
      explanation: question.explanation
    }]);
    
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
      // Calculate final score from userAnswers to ensure accuracy
      const finalScore = isCorrect ? score + 1 : score;
      const finalAnswers = [...userAnswers, {
        question: questions[currentIndex].question,
        userAnswer: selectedAnswer,
        correctAnswer: questions[currentIndex].correct_answer,
        isCorrect: isCorrect,
        explanation: questions[currentIndex].explanation
      }];
      onComplete(finalScore, questions.length, finalAnswers);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedAnswer("");
      setShowFeedback(false);
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
    <div className="min-h-screen flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-3xl space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span>Score: {score}/{questions.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="p-4 sm:p-8 card-glass glow">
          <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 break-words">{question.question}</h2>

          <div className="space-y-3 sm:space-y-4">
            {question.type === "multiple_choice" && question.options && (
              <div className="space-y-2 sm:space-y-3">
                {question.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => !showFeedback && setSelectedAnswer(option)}
                    disabled={showFeedback}
                    className={`w-full p-3 sm:p-4 text-left text-sm sm:text-base rounded-lg border-2 transition-all ${
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
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {["True", "False"].map((option) => (
                  <Button
                    key={option}
                    onClick={() => !showFeedback && setSelectedAnswer(option)}
                    disabled={showFeedback}
                    variant={selectedAnswer === option ? "default" : "outline"}
                    size="lg"
                    className="text-sm sm:text-base"
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
                className="w-full p-3 sm:p-4 text-sm sm:text-base rounded-lg border-2 border-border bg-input focus:border-primary outline-none transition-colors"
              />
            )}
          </div>

          {showFeedback && (
            <div className={`mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg ${isCorrect ? "bg-success/10 border-2 border-success" : "bg-destructive/10 border-2 border-destructive"}`}>
              <div className="flex items-start gap-2 sm:gap-3">
                {isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-success flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-destructive flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold mb-2 text-sm sm:text-base break-words">
                    {isCorrect ? "Correct!" : `Incorrect. The correct answer is: ${question.correct_answer}`}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground break-words">{question.explanation}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 sm:mt-6 flex justify-between gap-2">
            <Button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              variant="outline"
              size="sm"
              className="sm:text-base"
            >
              Previous
            </Button>
            {!showFeedback ? (
              <Button onClick={handleAnswer} disabled={!selectedAnswer} size="sm" className="sm:text-base">
                Submit Answer
              </Button>
            ) : (
              <Button onClick={handleNext} size="sm" className="sm:text-base">
                {currentIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
