import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Settings2 } from "lucide-react";

export interface QuizConfiguration {
  numQuestions: number;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  questionTypes: "mcq" | "true_false" | "short_answer" | "mixed";
}

interface QuizConfigProps {
  onContinue: (config: QuizConfiguration) => void;
  onBack: () => void;
}

export const QuizConfig = ({ onContinue, onBack }: QuizConfigProps) => {
  const [numQuestions, setNumQuestions] = useState(7);
  const [difficulty, setDifficulty] = useState<QuizConfiguration["difficulty"]>("mixed");
  const [questionTypes, setQuestionTypes] = useState<QuizConfiguration["questionTypes"]>("mixed");

  const handleContinue = () => {
    onContinue({
      numQuestions,
      difficulty,
      questionTypes,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 gradient-text">Quiz Configuration</h1>
          <p className="text-lg text-muted-foreground">
            Customize your quiz experience
          </p>
        </div>

        <Card className="p-8 card-glass glow">
          <div className="space-y-8">
            <div className="flex items-center gap-2 text-lg font-semibold mb-6">
              <Settings2 className="w-6 h-6 text-primary" />
              <span>Customize Your Quiz</span>
            </div>

            {/* Number of Questions */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-base font-semibold">Number of Questions</Label>
                <span className="text-2xl font-bold text-primary">{numQuestions}</span>
              </div>
              <Slider
                value={[numQuestions]}
                onValueChange={(value) => setNumQuestions(value[0])}
                min={3}
                max={20}
                step={1}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Choose between 3 and 20 questions
              </p>
            </div>

            {/* Difficulty Level */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Difficulty Level</Label>
              <RadioGroup value={difficulty} onValueChange={(value) => setDifficulty(value as QuizConfiguration["difficulty"])}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2 p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-colors">
                    <RadioGroupItem value="easy" id="easy" />
                    <Label htmlFor="easy" className="cursor-pointer flex-1">
                      <div className="font-semibold">Easy</div>
                      <div className="text-xs text-muted-foreground">Basic concepts</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-colors">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium" className="cursor-pointer flex-1">
                      <div className="font-semibold">Medium</div>
                      <div className="text-xs text-muted-foreground">Moderate challenge</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-colors">
                    <RadioGroupItem value="hard" id="hard" />
                    <Label htmlFor="hard" className="cursor-pointer flex-1">
                      <div className="font-semibold">Hard</div>
                      <div className="text-xs text-muted-foreground">Advanced topics</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-colors">
                    <RadioGroupItem value="mixed" id="mixed-diff" />
                    <Label htmlFor="mixed-diff" className="cursor-pointer flex-1">
                      <div className="font-semibold">Mixed</div>
                      <div className="text-xs text-muted-foreground">All levels</div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Question Types */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Question Types</Label>
              <RadioGroup value={questionTypes} onValueChange={(value) => setQuestionTypes(value as QuizConfiguration["questionTypes"])}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2 p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-colors">
                    <RadioGroupItem value="mcq" id="mcq" />
                    <Label htmlFor="mcq" className="cursor-pointer flex-1">
                      <div className="font-semibold">Multiple Choice</div>
                      <div className="text-xs text-muted-foreground">MCQ only</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-colors">
                    <RadioGroupItem value="true_false" id="true_false" />
                    <Label htmlFor="true_false" className="cursor-pointer flex-1">
                      <div className="font-semibold">True/False</div>
                      <div className="text-xs text-muted-foreground">T/F only</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-colors">
                    <RadioGroupItem value="short_answer" id="short_answer" />
                    <Label htmlFor="short_answer" className="cursor-pointer flex-1">
                      <div className="font-semibold">Short Answer</div>
                      <div className="text-xs text-muted-foreground">Written responses</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-colors">
                    <RadioGroupItem value="mixed" id="mixed-type" />
                    <Label htmlFor="mixed-type" className="cursor-pointer flex-1">
                      <div className="font-semibold">Mixed</div>
                      <div className="text-xs text-muted-foreground">All question types</div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="flex gap-4 mt-6">
              <Button
                onClick={onBack}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleContinue}
                size="lg"
                className="flex-1"
              >
                Start Quiz
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};