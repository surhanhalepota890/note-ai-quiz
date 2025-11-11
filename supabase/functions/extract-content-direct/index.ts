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
    const { fileData, mimeType, extractTopics } = await req.json();

    if (!fileData) {
      throw new Error('No file data provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    console.log('Extracting content from file...');

    // Use Lovable AI with OCR capabilities to extract text from the file
    const extractResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Extract ALL text content from this document using OCR if needed. 
              
CRITICAL INSTRUCTIONS:
- Extract EVERY word, heading, paragraph, bullet point, and section
- Preserve structure: headings, subheadings, lists, tables
- Perform OCR on any scanned or image-based text
- Include ALL content from every page
- Maintain hierarchical structure (Chapter > Section > Subsection)
- Do NOT summarize or skip content
- Return ONLY the extracted text without any commentary

Be thorough and accurate. Extract everything.`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${fileData}`
              }
            }
          ]
        }],
        temperature: 0.1,
      }),
    });

    if (!extractResponse.ok) {
      const errorText = await extractResponse.text();
      console.error('AI API error:', extractResponse.status, errorText);
      if (extractResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (extractResponse.status === 402) {
        throw new Error('AI credits depleted. Please add credits to continue.');
      }
      throw new Error(`AI API error: ${extractResponse.status}`);
    }

    const extractData = await extractResponse.json();
    const extractedText = extractData.choices[0].message.content;

    console.log('Content extracted, length:', extractedText.length);

    let topics = null;

    // If the document is large or topics extraction is requested
    if (extractTopics && extractedText.length > 500) {
      console.log('Extracting topics from document...');
      
      const topicsResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{
            role: 'user',
            content: `You are an educational content analyzer. Analyze the provided text and identify ALL main chapters, topics, and sections.

CRITICAL INSTRUCTIONS:
- Identify 8-15 main topics/chapters from the document
- For each topic, extract DETAILED subtopics that exist in the text
- Subtopics should be specific concepts, sections, or subsections actually present
- Use the exact headings and subheadings from the document when possible
- Include hierarchical structure (main topic -> subtopics)
- Be thorough - don't skip sections

Return ONLY valid JSON in this exact format:
{
  "topics": [
    {
      "id": "topic-1",
      "title": "Chapter/Topic Title (max 60 chars)",
      "description": "Clear description of what this covers (max 120 chars)",
      "subtopics": ["Specific Subtopic 1", "Specific Subtopic 2", "Specific Subtopic 3", "etc"]
    }
  ]
}

IMPORTANT: 
- Each topic should have 3-8 detailed subtopics
- Subtopics must be actual content sections from the document
- Use specific terminology from the source material

Analyze this content and extract the complete topic structure:

${extractedText.length > 30000 ? extractedText.substring(0, 30000) + '... [content continues]' : extractedText}`
          }],
          temperature: 0.3,
        }),
      });

      if (topicsResponse.ok) {
        const topicsData = await topicsResponse.json();
        const topicsContent = topicsData.choices[0].message.content;
        
        try {
          const jsonMatch = topicsContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          const jsonStr = jsonMatch ? jsonMatch[1] : topicsContent;
          topics = JSON.parse(jsonStr).topics;
          console.log('Topics extracted:', topics.length);
        } catch (parseError) {
          console.error('Failed to parse topics:', parseError);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        content: extractedText,
        topics: topics
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in extract-content-direct:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to extract content' 
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
