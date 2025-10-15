import { useState, useEffect } from "react";
import { Auth } from "@/components/Auth";
import { UploadNotes } from "@/components/UploadNotes";
import { QuizInterface } from "@/components/QuizInterface";
import { QuizResults } from "@/components/QuizResults";
import { TopicSelector } from "@/components/TopicSelector";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

type AppState = "upload" | "topics" | "quiz" | "results";

interface Topic {
  id: string;
  title: string;
  description: string;
  subtopics?: string[];
}

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [appState, setAppState] = useState<AppState>("upload");
  const [noteId, setNoteId] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [finalScore, setFinalScore] = useState({ score: 0, total: 0 });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleNotesUploaded = (id: string, content: string, extractedTopics?: Topic[]) => {
    setNoteId(id);
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
    setNoteId("");
    setNoteContent("");
    setAppState("upload");
  };

  if (!session) {
    return <Auth />;
  }

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
          noteId={noteId}
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
