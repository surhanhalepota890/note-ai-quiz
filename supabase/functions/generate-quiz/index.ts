import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, selectedTopics } = await req.json();

    if (!content || content.trim().length < 50) {
      throw new Error("Content must be at least 50 characters long");
    }

    // If specific topics are selected, add context to the prompt
    const topicsContext = selectedTopics && selectedTopics.length > 0
      ? `\n\nFocus ONLY on these specific topics from the content: ${selectedTopics.join(', ')}`
      : '';

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Generating quiz from content...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a quiz generation expert. Generate educational quizzes STRICTLY based on the provided content. 
            
CRITICAL RULES:
- Only use information from the provided text
- Do NOT add external knowledge or facts
- Questions must be answerable from the text alone
- Explanations must reference specific parts of the provided content

Generate 5-7 questions with a mix of:
- Multiple choice (3-4 questions)
- True/False (1-2 questions)
- Short answer (1-2 questions)

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "question": "Question text based on provided content",
      "type": "multiple_choice",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correct_answer": "Option 1",
      "explanation": "Explanation referencing the provided content"
    }
  ]
}

For true/false questions, use "True" or "False" as correct_answer.
For short answer, provide a brief correct answer from the text.`
          },
          {
            role: 'user',
            content: `Generate a quiz from this content:\n\n${content}${topicsContext}`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');

    const aiContent = data.choices[0].message.content;
    let parsedQuestions;

    try {
      // Try to extract JSON if wrapped in markdown code blocks
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiContent;
      parsedQuestions = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      throw new Error('Failed to parse quiz questions');
    }

    return new Response(
      JSON.stringify(parsedQuestions),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in generate-quiz:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate quiz' 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
