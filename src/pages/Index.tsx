import { useState } from "react";
import { UploadNotes } from "@/components/UploadNotes";
import { QuizInterface } from "@/components/QuizInterface";
import { QuizResults } from "@/components/QuizResults";
import { TopicSelector } from "@/components/TopicSelector";

type AppState = "upload" | "topics" | "quiz" | "results";

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
  const [finalScore, setFinalScore] = useState({ score: 0, total: 0 });

  const handleNotesUploaded = (content: string, extractedTopics?: Topic[]) => {
    setNoteContent(content);
    
    if (extractedTopics && extractedTopics.length > 0) {
      setTopics(extractedTopics);
      setAppState("topics");
    } else {
      setAppState("quiz");
    }
  };

  const handleTopicsSelected = (selected: string[]) => {
    setSelectedTopics(selected);
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
      {appState === "quiz" && (
        <QuizInterface
          noteContent={noteContent}
          selectedTopics={selectedTopics.length > 0 ? selectedTopics : undefined}
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
