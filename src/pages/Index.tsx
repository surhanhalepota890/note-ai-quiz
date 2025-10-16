import { useState } from "react";
import { UploadNotes } from "@/components/UploadNotes";
import { TopicSelector } from "@/components/TopicSelector";
import { QuizConfig, QuizConfiguration } from "@/components/QuizConfig";
import { QuizInterface } from "@/components/QuizInterface";
import { QuizResults } from "@/components/QuizResults";

type AppState = "upload" | "topics" | "config" | "quiz" | "results";

interface Topic {
  id: string;
  title: string;
  description: string;
  subtopics?: string[];
}

const Index = () => {
  const [appState, setAppState] = useState<AppState>("upload");
  const [noteContent, setNoteContent] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [quizConfig, setQuizConfig] = useState<QuizConfiguration | null>(null);
  const [finalScore, setFinalScore] = useState({ score: 0, total: 0 });

  const handleNotesUploaded = (content: string, extractedTopics?: Topic[]) => {
    setNoteContent(content);
    
    if (extractedTopics && extractedTopics.length > 0) {
      setTopics(extractedTopics);
      setAppState("topics");
    } else {
      setAppState("config");
    }
  };

  const handleTopicsSelected = (selected: string[]) => {
    setSelectedTopics(selected);
    setAppState("config");
  };

  const handleConfigComplete = (config: QuizConfiguration) => {
    setQuizConfig(config);
    setAppState("quiz");
  };

  const handleBackToUpload = () => {
    setTopics([]);
    setSelectedTopics([]);
    setAppState("upload");
  };

  const handleQuizComplete = (score: number, total: number) => {
    setFinalScore({ score, total });
    setAppState("results");
  };

  const handleRetry = () => {
    setAppState("quiz");
  };

  const handleHome = () => {
    setNoteContent("");
    setTopics([]);
    setSelectedTopics([]);
    setQuizConfig(null);
    setAppState("upload");
  };

  return (
    <>
      {appState === "upload" && <UploadNotes onNotesUploaded={handleNotesUploaded} />}
      {appState === "topics" && (
        <TopicSelector
          topics={topics}
          onContinue={handleTopicsSelected}
          onBack={handleBackToUpload}
        />
      )}
      {appState === "config" && (
        <QuizConfig
          onContinue={handleConfigComplete}
          onBack={() => topics.length > 0 ? setAppState("topics") : setAppState("upload")}
        />
      )}
      {appState === "quiz" && quizConfig && (
        <QuizInterface
          noteContent={noteContent}
          selectedTopics={selectedTopics.length > 0 ? selectedTopics : undefined}
          quizConfig={quizConfig}
          onComplete={handleQuizComplete}
        />
      )}
      {appState === "results" && (
        <QuizResults
          score={finalScore.score}
          total={finalScore.total}
          onRetry={handleRetry}
          onHome={handleHome}
        />
      )}
    </>
  );
};

export default Index;
