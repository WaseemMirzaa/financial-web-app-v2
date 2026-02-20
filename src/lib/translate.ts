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
 * DISABLED: Always returns original text for both languages
 */
export async function translateText(
  text: string,
  options: TranslateOptions
): Promise<string> {
  // Google Translate API disabled - always return original text
  return text;
  
  /* COMMENTED OUT - Google Translate API
  console.log('[Translate] translateText called:', { text: text.substring(0, 50), options });
  
  // If no API key is configured, return original text
  if (!GOOGLE_TRANSLATE_API_KEY) {
    console.warn('[Translate] Google Translate API key not configured. Returning original text.');
    return text;
  }

  // If source and target are the same, return original
  if (options.sourceLanguage === options.targetLanguage) {
    console.log('[Translate] Source and target language are the same, returning original');
    return text;
  }

  try {
    const requestBody = {
      q: text,
      source: options.sourceLanguage || 'auto',
      target: options.targetLanguage,
      format: 'text',
    };
    console.log('[Translate] Sending request to Google Translate API:', { 
      url: GOOGLE_TRANSLATE_API_URL,
      hasKey: !!GOOGLE_TRANSLATE_API_KEY,
      body: { ...requestBody, q: requestBody.q.substring(0, 50) }
    });

    const response = await fetch(
      `${GOOGLE_TRANSLATE_API_URL}?key=${GOOGLE_TRANSLATE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    console.log('[Translate] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const error = await response.json();
      console.error('[Translate] Google Translate API error:', error);
      return text; // Return original text on error
    }

    const data = await response.json();
    const translated = data.data?.translations?.[0]?.translatedText || text;
    console.log('[Translate] Translation result:', { 
      original: text.substring(0, 50), 
      translated: translated.substring(0, 50),
      detectedSource: data.data?.translations?.[0]?.detectedSourceLanguage
    });
    return translated;
  } catch (error) {
    console.error('[Translate] Translation error:', error);
    return text; // Return original text on error
  }
  */
}

/**
 * Detect language of text
 * DISABLED: Always returns 'en'
 */
export async function detectLanguage(text: string): Promise<string> {
  // Google Translate API disabled - always return 'en'
  return 'en';
  
  /* COMMENTED OUT - Google Translate API
  console.log('[Translate] detectLanguage called:', { text: text.substring(0, 50) });
  
  if (!GOOGLE_TRANSLATE_API_KEY) {
    console.warn('[Translate] No API key, defaulting to en');
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
      console.warn('[Translate] Detection failed, defaulting to en');
      return 'en'; // Default to English on error
    }

    const data = await response.json();
    const detected = data.data?.detections?.[0]?.[0]?.language || 'en';
    console.log('[Translate] Detected language:', detected);
    return detected;
  } catch (error) {
    console.error('[Translate] Language detection error:', error);
    return 'en';
  }
  */
}

/**
 * Translate text to both English and Arabic
 * DISABLED: Always returns same text for both languages
 */
export async function translateToBothLanguages(
  text: string,
  sourceLanguage?: string
): Promise<{ en: string; ar: string }> {
  // Google Translate API disabled - return same text for both languages
  return { en: text, ar: text };
  
  /* COMMENTED OUT - Google Translate API
  console.log('[Translate] translateToBothLanguages called:', { 
    text: text.substring(0, 50), 
    sourceLanguage 
  });
  
  // If source language is not provided, detect it
  const detectedLanguage = sourceLanguage || (await detectLanguage(text));
  console.log('[Translate] Detected/source language:', detectedLanguage);

  // If text is already in English, only translate to Arabic
  if (detectedLanguage === 'en') {
    console.log('[Translate] Text is English, translating to Arabic only');
    const ar = await translateText(text, {
      sourceLanguage: 'en',
      targetLanguage: 'ar',
    });
    const result = { en: text, ar };
    console.log('[Translate] Result:', { en: result.en.substring(0, 50), ar: result.ar.substring(0, 50) });
    return result;
  }

  // If text is already in Arabic, only translate to English
  if (detectedLanguage === 'ar') {
    console.log('[Translate] Text is Arabic, translating to English only');
    const en = await translateText(text, {
      sourceLanguage: 'ar',
      targetLanguage: 'en',
    });
    const result = { en, ar: text };
    console.log('[Translate] Result:', { en: result.en.substring(0, 50), ar: result.ar.substring(0, 50) });
    return result;
  }

  // If text is in another language, translate to both
  console.log('[Translate] Text is in another language, translating to both EN and AR');
  const en = await translateText(text, {
    sourceLanguage: detectedLanguage,
    targetLanguage: 'en',
  });
  const ar = await translateText(text, {
    sourceLanguage: detectedLanguage,
    targetLanguage: 'ar',
  });

  const result = { en, ar };
  console.log('[Translate] Final result:', { en: result.en.substring(0, 50), ar: result.ar.substring(0, 50) });
  return result;
  */
}
