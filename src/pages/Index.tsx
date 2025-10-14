import { useState, useEffect } from "react";
import { Auth } from "@/components/Auth";
import { UploadNotes } from "@/components/UploadNotes";
import { QuizInterface } from "@/components/QuizInterface";
import { QuizResults } from "@/components/QuizResults";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

type AppState = "upload" | "quiz" | "results";

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [appState, setAppState] = useState<AppState>("upload");
  const [noteId, setNoteId] = useState("");
  const [noteContent, setNoteContent] = useState("");
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

  const handleNotesUploaded = (id: string, content: string) => {
    setNoteId(id);
    setNoteContent(content);
    setAppState("quiz");
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
      {appState === "quiz" && (
        <QuizInterface
          noteId={noteId}
          noteContent={noteContent}
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
