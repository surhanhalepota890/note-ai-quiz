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

    // Use Gemini to extract text from the file
    const extractResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all text content from this document. Be thorough and accurate. Return only the extracted text content without any additional formatting or commentary.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${fileData}`
                }
              }
            ]
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!extractResponse.ok) {
      const errorText = await extractResponse.text();
      console.error('AI API error:', extractResponse.status, errorText);
      throw new Error(`AI API error: ${extractResponse.status}`);
    }

    const extractData = await extractResponse.json();
    const extractedText = extractData.choices[0].message.content;

    console.log('Content extracted, length:', extractedText.length);

    let topics = null;

    // If the document is large or topics extraction is requested
    if (extractTopics && extractedText.length > 1000) {
      console.log('Extracting topics from large document...');
      
      const topicsResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
              content: `You are a content analyzer. Analyze the provided text and identify 5-10 main topics or sections. 
              For each topic, provide:
              - A clear title (max 50 characters)
              - A brief description (max 100 characters)
              - Key subtopics if any
              
              Return ONLY valid JSON in this format:
              {
                "topics": [
                  {
                    "id": "topic-1",
                    "title": "Topic Title",
                    "description": "Brief description",
                    "subtopics": ["subtopic1", "subtopic2"]
                  }
                ]
              }`
            },
            {
              role: 'user',
              content: `Analyze this content and extract main topics:\n\n${extractedText}`
            }
          ],
          temperature: 0.5,
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
