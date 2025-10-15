import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ListChecks } from "lucide-react";

interface Topic {
  id: string;
  title: string;
  description: string;
  subtopics?: string[];
}

interface TopicSelectorProps {
  topics: Topic[];
  onContinue: (selectedTopics: string[]) => void;
  onBack: () => void;
}

export const TopicSelector = ({ topics, onContinue, onBack }: TopicSelectorProps) => {
  const [selectedTopics, setSelectedTopics] = useState<string[]>(
    topics.map(t => t.title) // All topics selected by default
  );

  const toggleTopic = (title: string) => {
    setSelectedTopics(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 gradient-text">Select Quiz Topics</h1>
          <p className="text-lg text-muted-foreground">
            Choose which topics you want to be quizzed on
          </p>
        </div>

        <Card className="p-8 card-glass glow">
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-lg font-semibold mb-6">
              <ListChecks className="w-6 h-6 text-primary" />
              <span>Topics Found ({selectedTopics.length}/{topics.length} selected)</span>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {topics.map((topic) => (
                <div
                  key={topic.id}
                  className="flex items-start gap-4 p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-colors"
                >
                  <Checkbox
                    id={topic.id}
                    checked={selectedTopics.includes(topic.title)}
                    onCheckedChange={() => toggleTopic(topic.title)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={topic.id}
                      className="font-semibold cursor-pointer block mb-1"
                    >
                      {topic.title}
                    </label>
                    <p className="text-sm text-muted-foreground mb-2">
                      {topic.description}
                    </p>
                    {topic.subtopics && topic.subtopics.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {topic.subtopics.map((subtopic, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
                          >
                            {subtopic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
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
                onClick={() => onContinue(selectedTopics)}
                disabled={selectedTopics.length === 0}
                size="lg"
                className="flex-1"
              >
                Generate Quiz from Selected Topics
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
