/**
 * Google Translate API integration for dynamic translations
 */

const GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;
const GOOGLE_TRANSLATE_API_URL = 'https://translation.googleapis.com/language/translate/v2';

export interface TranslateOptions {
  sourceLanguage?: string;
  targetLanguage: string;
}

/**
 * Translate text using Google Translate API
 */
export async function translateText(
  text: string,
  options: TranslateOptions
): Promise<string> {
  // If no API key is configured, return original text
  if (!GOOGLE_TRANSLATE_API_KEY) {
    console.warn('Google Translate API key not configured. Returning original text.');
    return text;
  }

  // If source and target are the same, return original
  if (options.sourceLanguage === options.targetLanguage) {
    return text;
  }

  try {
    const response = await fetch(
      `${GOOGLE_TRANSLATE_API_URL}?key=${GOOGLE_TRANSLATE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: options.sourceLanguage || 'auto',
          target: options.targetLanguage,
          format: 'text',
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Google Translate API error:', error);
      return text; // Return original text on error
    }

    const data = await response.json();
    return data.data?.translations?.[0]?.translatedText || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text on error
  }
}

/**
 * Detect language of text
 */
export async function detectLanguage(text: string): Promise<string> {
  if (!GOOGLE_TRANSLATE_API_KEY) {
    return 'en'; // Default to English
  }

  try {
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2/detect?key=${GOOGLE_TRANSLATE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
        }),
      }
    );

    if (!response.ok) {
      return 'en'; // Default to English on error
    }

    const data = await response.json();
    return data.data?.detections?.[0]?.[0]?.language || 'en';
  } catch (error) {
    console.error('Language detection error:', error);
    return 'en';
  }
}

/**
 * Translate text to both English and Arabic
 */
export async function translateToBothLanguages(
  text: string,
  sourceLanguage?: string
): Promise<{ en: string; ar: string }> {
  // If source language is not provided, detect it
  const detectedLanguage = sourceLanguage || (await detectLanguage(text));

  // If text is already in English, only translate to Arabic
  if (detectedLanguage === 'en') {
    const ar = await translateText(text, {
      sourceLanguage: 'en',
      targetLanguage: 'ar',
    });
    return { en: text, ar };
  }

  // If text is already in Arabic, only translate to English
  if (detectedLanguage === 'ar') {
    const en = await translateText(text, {
      sourceLanguage: 'ar',
      targetLanguage: 'en',
    });
    return { en, ar: text };
  }

  // If text is in another language, translate to both
  const en = await translateText(text, {
    sourceLanguage: detectedLanguage,
    targetLanguage: 'en',
  });
  const ar = await translateText(text, {
    sourceLanguage: detectedLanguage,
    targetLanguage: 'ar',
  });

  return { en, ar };
}
