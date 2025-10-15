import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Upload, FileText, Loader2, Image, FileType } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Topic {
  id: string;
  title: string;
  description: string;
  subtopics?: string[];
}

interface UploadNotesProps {
  onNotesUploaded: (noteId: string, content: string, topics?: Topic[]) => void;
}

export const UploadNotes = ({ onNotesUploaded }: UploadNotesProps) => {
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a PDF or image file (PNG, JPG)",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
      });
      return;
    }

    setSelectedFile(file);
    setContent(""); // Clear text content if file is selected
  };

  const handleSubmit = async () => {
    if (!content.trim() && !selectedFile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter text or upload a file",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let extractedContent = content;
      let filePath = null;
      let topics = null;

      // If file is uploaded, extract content from it
      if (selectedFile) {
        // Upload file to storage
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('note-files')
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        filePath = fileName;

        // Extract content from file using edge function
        const { data: extractData, error: extractError } = await supabase.functions.invoke(
          "extract-content",
          {
            body: { 
              filePath: fileName,
              extractTopics: true // Always extract topics for files
            },
          }
        );

        if (extractError) throw extractError;

        extractedContent = extractData.content;
        topics = extractData.topics;

        if (!extractedContent || extractedContent.length < 50) {
          throw new Error("Could not extract enough content from the file");
        }
      }

      const { data, error } = await supabase
        .from("notes")
        .insert({
          user_id: user.id,
          title: selectedFile ? selectedFile.name : "Text Note",
          content: extractedContent,
          content_type: selectedFile ? selectedFile.type : "text",
          file_path: filePath,
          topics: topics,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success!",
        description: selectedFile 
          ? "File processed successfully" 
          : "Notes uploaded successfully",
      });

      onNotesUploaded(data.id, extractedContent, topics);
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

        <div className="grid md:grid-cols-2 gap-6">
          {/* Text Input Card */}
          <Card className="p-8 card-glass glow">
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <FileText className="w-6 h-6 text-primary" />
                <span>Paste Your Notes</span>
              </div>

              <Textarea
                placeholder="Paste your study notes, lecture content, or any text you want to be quizzed on..."
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setSelectedFile(null);
                }}
                disabled={!!selectedFile}
                className="min-h-[200px] resize-none"
              />

              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  File upload selected. Clear file to use text input.
                </p>
              )}
            </div>
          </Card>

          {/* File Upload Card */}
          <Card className="p-8 card-glass glow">
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Upload className="w-6 h-6 text-primary" />
                <span>Upload PDF or Image</span>
              </div>

              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  onChange={handleFileSelect}
                  disabled={!!content.trim()}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-4"
                >
                  {selectedFile ? (
                    <>
                      {selectedFile.type === 'application/pdf' ? (
                        <FileType className="w-12 h-12 text-primary" />
                      ) : (
                        <Image className="w-12 h-12 text-primary" />
                      )}
                      <div>
                        <p className="font-semibold">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedFile(null);
                        }}
                      >
                        Remove File
                      </Button>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-muted-foreground" />
                      <div>
                        <p className="font-semibold">Click to upload</p>
                        <p className="text-sm text-muted-foreground">
                          PDF or Image (PNG, JPG) - Max 10MB
                        </p>
                      </div>
                    </>
                  )}
                </label>
              </div>

              {content.trim() && (
                <p className="text-sm text-muted-foreground text-center">
                  Text input detected. Clear text to upload file.
                </p>
              )}
            </div>
          </Card>
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={loading || (!content.trim() && !selectedFile)}
          size="lg"
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {selectedFile ? 'Processing File...' : 'Processing...'}
            </>
          ) : (
            <>
              <Upload className="mr-2 h-5 w-5" />
              Generate Quiz
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
