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
    const { content, selectedTopics, config } = await req.json();

    if (!content || content.trim().length < 50) {
      throw new Error("Content must be at least 50 characters long");
    }

    // Build configuration context
    const topicsContext = selectedTopics && selectedTopics.length > 0
      ? `\n\nFocus ONLY on these specific topics from the content: ${selectedTopics.join(', ')}`
      : '';

    const numQuestions = config?.numQuestions || 7;
    const difficulty = config?.difficulty || 'mixed';
    const questionTypes = config?.questionTypes || 'mixed';

    let difficultyInstructions = '';
    if (difficulty === 'easy') {
      difficultyInstructions = '\n\nDifficulty: EASY - Focus on basic definitions, simple concepts, and recall questions.';
    } else if (difficulty === 'medium') {
      difficultyInstructions = '\n\nDifficulty: MEDIUM - Include application questions and moderate complexity.';
    } else if (difficulty === 'hard') {
      difficultyInstructions = '\n\nDifficulty: HARD - Include complex scenarios, analysis, and synthesis questions.';
    } else {
      difficultyInstructions = '\n\nDifficulty: MIXED - Include a variety of difficulty levels.';
    }

    let typeInstructions = '';
    if (questionTypes === 'mcq') {
      typeInstructions = `\n\nGenerate ${numQuestions} multiple choice questions ONLY.`;
    } else if (questionTypes === 'true_false') {
      typeInstructions = `\n\nGenerate ${numQuestions} true/false questions ONLY.`;
    } else if (questionTypes === 'short_answer') {
      typeInstructions = `\n\nGenerate ${numQuestions} short answer questions ONLY.`;
    } else {
      typeInstructions = `\n\nGenerate ${numQuestions} questions with a mix of:
- Multiple choice (${Math.ceil(numQuestions * 0.5)} questions)
- True/False (${Math.floor(numQuestions * 0.3)} questions)
- Short answer (${Math.floor(numQuestions * 0.2)} questions)`;
    }

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
        messages: [{
          role: 'user',
          content: `You are a quiz generation expert. Generate educational quizzes STRICTLY based on the provided content.
            
CRITICAL RULES:
- Only use information from the provided text
- Do NOT add external knowledge or facts
- Questions must be answerable from the text alone
- Explanations must reference specific parts of the provided content
${difficultyInstructions}
${typeInstructions}

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
For short answer, provide a brief correct answer from the text.

Generate a quiz from this content:

${content}${topicsContext}`
        }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (response.status === 402) {
        throw new Error('AI credits depleted. Please add credits to continue.');
      }
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
