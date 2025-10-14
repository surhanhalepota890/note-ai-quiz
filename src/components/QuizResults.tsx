import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, RefreshCw, Home } from "lucide-react";

interface QuizResultsProps {
  score: number;
  total: number;
  onRetry: () => void;
  onHome: () => void;
}

export const QuizResults = ({ score, total, onRetry, onHome }: QuizResultsProps) => {
  const percentage = Math.round((score / total) * 100);
  
  const getPerformanceFeedback = () => {
    if (percentage >= 90) return "Outstanding! You've mastered this material! 🌟";
    if (percentage >= 75) return "Great job! You have a solid understanding! 👏";
    if (percentage >= 60) return "Good effort! Keep studying to improve! 📚";
    return "Keep practicing! Review the material and try again! 💪";
  };

  const getPerformanceColor = () => {
    if (percentage >= 90) return "text-success";
    if (percentage >= 75) return "text-primary";
    if (percentage >= 60) return "text-accent";
    return "text-destructive";
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 card-glass glow text-center">
        <Trophy className="w-20 h-20 text-primary mx-auto mb-6" />
        
        <h1 className="text-4xl font-bold mb-4 gradient-text">Quiz Complete!</h1>
        
        <div className="mb-8 space-y-4">
          <div className="text-6xl font-bold">
            <span className={getPerformanceColor()}>{score}</span>
            <span className="text-muted-foreground">/{total}</span>
          </div>
          
          <div className="text-3xl font-semibold">
            <span className={getPerformanceColor()}>{percentage}%</span>
          </div>
          
          <p className="text-xl text-muted-foreground max-w-md mx-auto">
            {getPerformanceFeedback()}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button onClick={onRetry} size="lg" variant="outline">
            <RefreshCw className="mr-2 h-5 w-5" />
            Retry Quiz
          </Button>
          <Button onClick={onHome} size="lg">
            <Home className="mr-2 h-5 w-5" />
            New Quiz
          </Button>
        </div>
      </Card>
    </div>
  );
};
