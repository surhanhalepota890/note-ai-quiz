import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { UploadNotes } from "@/components/UploadNotes";
import { TopicSelector } from "@/components/TopicSelector";
import { QuizConfig, QuizConfiguration } from "@/components/QuizConfig";
import { QuizInterface } from "@/components/QuizInterface";
import { QuizResults } from "@/components/QuizResults";
import { Navbar } from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";

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
  const [quizAnswers, setQuizAnswers] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isSavingResults, setIsSavingResults] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  const handleQuizComplete = async (score: number, total: number, answers: any[]) => {
    setFinalScore({ score, total });
    setQuizAnswers(answers);
    
    // Persist notes, quiz, and results when logged in (fix FK)
    if (user) {
      if (!isSavingResults) {
        setIsSavingResults(true);
        try {
          // 1) Create a note record
          const title = noteContent.split('\n')[0]?.slice(0, 80) || 'Uploaded Notes';
          const { data: noteInsert, error: noteError } = await supabase
            .from('notes')
            .insert({
              user_id: user.id,
              content_type: 'text',
              content: noteContent,
              title,
            })
            .select('id')
            .maybeSingle();

          if (noteError || !noteInsert) throw noteError || new Error('Failed to create note');
          const noteId = noteInsert.id;

          // 2) Create a quiz record referencing the note
          const questionsPayload = answers.map((a: any) => ({
            question: a.question,
            correct_answer: a.correctAnswer,
            explanation: a.explanation ?? null,
          }));
          const { data: quizInsert, error: quizError } = await supabase
            .from('quizzes')
            .insert({
              user_id: user.id,
              note_id: noteId,
              questions: questionsPayload,
            })
            .select('id')
            .maybeSingle();

          if (quizError || !quizInsert) throw quizError || new Error('Failed to create quiz');
          const quizId = quizInsert.id;

          // 3) Save quiz results with proper foreign key
          const { error: resultsError } = await supabase.from('quiz_results').insert({
            user_id: user.id,
            quiz_id: quizId,
            score,
            total_questions: total,
            answers,
            incorrect_answers: answers.filter((a: any) => !a.isCorrect),
          });

          if (resultsError) throw resultsError;
        } catch (error) {
          console.error('Error saving quiz data:', error);
        } finally {
          setIsSavingResults(false);
        }
      }
    }
    
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
      <Navbar />
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
          answers={quizAnswers}
          onRetry={handleRetry}
          onHome={handleHome}
        />
      )}
    </>
  );
};

export default Index;
