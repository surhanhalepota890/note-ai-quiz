import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Upload, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UploadNotesProps {
  onNotesUploaded: (noteId: string, content: string) => void;
}

export const UploadNotes = ({ onNotesUploaded }: UploadNotesProps) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleTextSubmit = async () => {
    if (!content.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter some text content",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("notes")
        .insert({
          user_id: user.id,
          title: "Text Note",
          content: content,
          content_type: "text",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Notes uploaded successfully",
      });

      onNotesUploaded(data.id, content);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4 gradient-text">NoteQuiz AI</h1>
          <p className="text-xl text-muted-foreground">Upload your notes and let AI create personalized quizzes</p>
        </div>

        <Card className="p-8 card-glass glow">
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <FileText className="w-6 h-6 text-primary" />
              <span>Paste Your Notes</span>
            </div>

            <Textarea
              placeholder="Paste your study notes, lecture content, or any text you want to be quizzed on..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[300px] resize-none"
            />

            <Button 
              onClick={handleTextSubmit} 
              disabled={loading}
              size="lg"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  Generate Quiz
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
