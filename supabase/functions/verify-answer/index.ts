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
    const { question, userAnswer, correctAnswer, context } = await req.json();

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    console.log('Verifying answer with AI...');

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + GEMINI_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an expert answer evaluator. Your task is to determine if a student's answer is conceptually correct.

Question: ${question}

Expected Answer: ${correctAnswer}

Student's Answer: ${userAnswer}

Context from notes: ${context.substring(0, 1000)}

IMPORTANT: 
- Focus on whether the student understood the CONCEPT correctly, not exact wording
- If the answer demonstrates understanding of the core concept, mark it as correct
- Minor wording differences, synonyms, or alternative explanations should be accepted
- Only mark as incorrect if the answer shows a fundamental misunderstanding

Respond with ONLY valid JSON in this exact format:
{
  "isCorrect": true or false,
  "reasoning": "Brief explanation of your decision"
}`
          }]
        }],
        generationConfig: {
          temperature: 0.3,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI verification response received');

    const aiContent = data.candidates[0].content.parts[0].text;
    let parsedResult;

    try {
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiContent;
      parsedResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      throw new Error('Failed to parse verification result');
    }

    return new Response(
      JSON.stringify(parsedResult),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in verify-answer:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to verify answer',
        isCorrect: false
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