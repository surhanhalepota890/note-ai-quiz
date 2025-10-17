import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, RefreshCw, Home, Share2, Download, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Answer {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
}

interface QuizResultsProps {
  score: number;
  total: number;
  answers: Answer[];
  onRetry: () => void;
  onHome: () => void;
}

export const QuizResults = ({ score, total, answers, onRetry, onHome }: QuizResultsProps) => {
  const { toast } = useToast();
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

  const incorrectAnswers = answers.filter(a => !a.isCorrect);

  const handleShare = () => {
    const text = `I scored ${score}/${total} (${percentage}%) on Quizify! 🎓`;
    if (navigator.share) {
      navigator.share({ title: "My Quiz Results", text });
    } else {
      navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard!",
        description: "Share your results with friends",
      });
    }
  };

  const handleDownload = () => {
    const resultsText = `
Quiz Results
============
Score: ${score}/${total} (${percentage}%)

${answers.map((a, i) => `
Question ${i + 1}: ${a.question}
Your Answer: ${a.userAnswer}
Correct Answer: ${a.correctAnswer}
Status: ${a.isCorrect ? '✓ Correct' : '✗ Incorrect'}
Explanation: ${a.explanation}
`).join('\n---\n')}
    `;
    
    const blob = new Blob([resultsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-results-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen p-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Summary Card */}
        <Card className="w-full p-8 card-glass glow text-center">
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button onClick={onRetry} size="lg" variant="outline">
              <RefreshCw className="mr-2 h-5 w-5" />
              Retry
            </Button>
            <Button onClick={onHome} size="lg" variant="outline">
              <Home className="mr-2 h-5 w-5" />
              New Quiz
            </Button>
            <Button onClick={handleShare} size="lg" variant="outline">
              <Share2 className="mr-2 h-5 w-5" />
              Share
            </Button>
            <Button onClick={handleDownload} size="lg" variant="outline">
              <Download className="mr-2 h-5 w-5" />
              Download
            </Button>
          </div>
        </Card>

        {/* Incorrect Answers Review */}
        {incorrectAnswers.length > 0 && (
          <Card className="w-full p-8 card-glass">
            <h2 className="text-2xl font-bold mb-6 text-destructive">
              Review Incorrect Answers ({incorrectAnswers.length})
            </h2>
            <div className="space-y-6">
              {incorrectAnswers.map((answer, index) => (
                <div key={index} className="p-6 rounded-lg bg-destructive/10 border-2 border-destructive/20">
                  <div className="flex items-start gap-3 mb-4">
                    <XCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{answer.question}</h3>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="font-medium">Your Answer: </span>
                          <span className="text-destructive">{answer.userAnswer}</span>
                        </p>
                        <p>
                          <span className="font-medium">Correct Answer: </span>
                          <span className="text-success">{answer.correctAnswer}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="pl-9 text-sm text-muted-foreground border-l-2 border-primary ml-3">
                    <p className="pl-4">{answer.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* All Answers Review */}
        <Card className="w-full p-8 card-glass">
          <h2 className="text-2xl font-bold mb-6">All Answers</h2>
          <div className="space-y-4">
            {answers.map((answer, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg border-2 ${
                  answer.isCorrect 
                    ? 'bg-success/10 border-success/20' 
                    : 'bg-destructive/10 border-destructive/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  {answer.isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium mb-1">{answer.question}</p>
                    <p className="text-sm text-muted-foreground">
                      Your answer: <span className={answer.isCorrect ? "text-success" : "text-destructive"}>{answer.userAnswer}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
