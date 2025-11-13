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
    const { content } = await req.json();

    if (!content || content.trim().length < 100) {
      throw new Error('Content too short for topic extraction');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    console.log('Extracting topics from text content, length:', content.length);
    
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
          content: `You are an expert educational content analyzer. Analyze the provided study material and identify ALL main subjects, chapters, and topics.

CRITICAL INSTRUCTIONS:
- Identify 8-15 main topics/chapters/subjects from the document
- For each topic, extract 3-8 DETAILED subtopics that exist in the text
- Subtopics should be specific concepts, sections, or subsections actually present
- Use the exact headings, chapter titles, and subheadings when possible
- Include hierarchical structure (main topic → subtopics)
- Be thorough - identify every major section
- Make titles concise (max 60 characters)
- Make descriptions clear and informative (max 120 characters)

Return ONLY valid JSON in this exact format:
{
  "topics": [
    {
      "id": "topic-1",
      "title": "Chapter/Subject/Topic Title",
      "description": "Clear description of what this section covers",
      "subtopics": ["Specific Concept 1", "Specific Concept 2", "Specific Concept 3"]
    }
  ]
}

IMPORTANT: 
- Each topic MUST have 3-8 detailed subtopics
- Subtopics must be actual content sections from the document
- Use specific terminology from the source material
- Topics should represent distinct chapters/sections/subjects

Analyze this content and extract the complete topic structure:

${content.length > 30000 ? content.substring(0, 30000) + '... [content continues]' : content}`
        }],
        temperature: 0.3,
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
    const aiContent = data.choices[0].message.content;
    
    let topics;
    try {
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiContent;
      topics = JSON.parse(jsonStr).topics;
      console.log('Topics extracted successfully:', topics.length);
    } catch (parseError) {
      console.error('Failed to parse topics:', parseError);
      throw new Error('Failed to parse topic structure');
    }

    return new Response(
      JSON.stringify({ topics }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in extract-topics:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to extract topics' 
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
