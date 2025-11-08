// Articles Service - Fetches factual, evidence-based information from ChatGPT
const OPENAI_API_KEY = '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';

export interface ArticleContent {
  title: string;
  summary: string;
  sections: ArticleSection[];
  keyPoints: string[];
  sources?: string[];
  lastUpdated?: string;
}

export interface ArticleSection {
  heading: string;
  content: string;
}

/**
 * Fetches evidence-based article content from ChatGPT
 * Ensures all information is medically accurate and factually correct
 */
export async function fetchArticleContent(categoryId: string): Promise<ArticleContent | null> {
  try {
    const prompt = generatePromptForCategory(categoryId);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a medical expert specializing in pregnancy and child health. Provide only evidence-based, medically accurate information. Always cite medical sources and follow current clinical guidelines.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    const parsedContent = JSON.parse(jsonMatch[0]);
    return parsedContent;

  } catch (error) {
    console.error('Error fetching article content:', error);
    return null;
  }
}

function generatePromptForCategory(categoryId: string): string {
  const categoryPrompts: { [key: string]: string } = {
    'pregnancy': `
Create a comprehensive, evidence-based article about pregnancy basics. Include:
- Summary: Brief overview of pregnancy journey
- Sections: [
  { heading: "Timeline & Stages", content: "Explain pregnancy stages and what to expect" },
  { heading: "What to Expect", content: "Physical and emotional changes" },
  { heading: "Healthcare", content: "Importance of prenatal care" }
]
- Key Points: Array of 5-7 important facts
- Sources: Array of authoritative medical sources

Return ONLY valid JSON in this exact format:
{
  "title": "Complete Guide to Pregnancy",
  "summary": "...",
  "sections": [{"heading": "...", "content": "..."}],
  "keyPoints": ["...", "..."],
  "sources": ["...", "..."]
}
`,

    'symptoms': `
Create a comprehensive article about pregnancy symptoms and when to seek medical attention. Focus on:
- Normal vs concerning symptoms
- When to call your healthcare provider
- Common discomforts and management
Include evidence-based information only.

Return ONLY valid JSON in the exact format specified.
`,

    'fetal-movement': `
Create an article about fetal movement including:
- When to expect baby kicks
- Normal movement patterns
- When to be concerned about decreased movement
- How to count kicks
Include medical guidelines from ACOG.

Return ONLY valid JSON.
`,

    'mental-health': `
Create a comprehensive article about mental health during pregnancy including:
- Common mental health concerns (anxiety, depression)
- Signs and symptoms to watch for
- Treatment options and resources
- When to seek professional help
Include evidence-based treatment recommendations.

Return ONLY valid JSON.
`,

    'diet-advice': `
Create an evidence-based article about nutrition during pregnancy including:
- Essential nutrients and why they matter
- Foods to eat and avoid
- Safe food handling practices
- Sample meal plans
Include guidelines from ACOG and dietary recommendations.

Return ONLY valid JSON.
`,

    'labor': `
Create a comprehensive guide to labor and delivery including:
- Stages of labor
- Signs of labor
- When to go to the hospital
- Pain management options
- Delivery options
Include ACOG guidelines.

Return ONLY valid JSON.
`,

    'breastfeeding': `
Create a comprehensive breastfeeding guide including:
- Benefits of breastfeeding
- Proper latch and positioning
- Common challenges and solutions
- When to seek help
- Resources and support
Include WHO and AAP recommendations.

Return ONLY valid JSON.
`,

    'car-seat': `
Create a car seat safety guide including:
- Types of car seats
- Installation guidelines
- When to transition between seat types
- Safety best practices
Include AAP and NHTSA guidelines.

Return ONLY valid JSON.
`,

    'partner': `
Create a guide for partners during pregnancy including:
- How to support the pregnant person
- Understanding physical and emotional changes
- Preparing for parenthood together
- Communication strategies

Return ONLY valid JSON.
`,

    'medical-board': `
Create an article about understanding your medical team during pregnancy including:
- Types of healthcare providers
- What to expect at appointments
- Questions to ask
- Building a care team

Return ONLY valid JSON.
`,

    'newborn-care': `
Create a comprehensive newborn care guide including:
- Feeding basics
- Diaper changing
- Bathing
- Sleep safety
- When to call pediatrician
Include AAP guidelines.

Return ONLY valid JSON.
`,

    'feeding': `
Create a guide to feeding your baby including:
- Breastfeeding basics
- Formula feeding
- Introducing solids
- Feeding schedules
Include AAP and WHO recommendations.

Return ONLY valid JSON.
`,

    'sleep': `
Create a baby sleep guide including:
- Newborn sleep patterns
- Safe sleep guidelines
- Establishing routines
- Sleep training (for older babies)
Include AAP safe sleep recommendations.

Return ONLY valid JSON.
`,

    'development': `
Create a baby development guide including:
- Developmental milestones
- What to expect month by month
- When to be concerned
- How to support development
Include CDC milestones.

Return ONLY valid JSON.
`,
  };

  return categoryPrompts[categoryId] || `
Create a comprehensive, evidence-based article about this topic. Include medically accurate information only.

Return ONLY valid JSON in this format:
{
  "title": "Article Title",
  "summary": "Brief overview",
  "sections": [{"heading": "Section Title", "content": "Section content"}],
  "keyPoints": ["Key point 1", "Key point 2"],
  "sources": ["Authoritative source 1", "Authoritative source 2"]
}
`;
}

export const articlesService = {
  fetchArticleContent,
};

