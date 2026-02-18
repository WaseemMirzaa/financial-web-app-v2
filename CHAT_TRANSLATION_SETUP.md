# Chat Dynamic Translation Setup

## Overview
The chat system now supports dynamic translations using Google Translate API. When a user sends a message, it is automatically translated to both English and Arabic and stored in the database.

## Setup Instructions

### 1. Get Google Translate API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Cloud Translation API**
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy your API key

### 2. Configure Environment Variable

Add your Google Translate API key to `.env.local`:

```bash
GOOGLE_TRANSLATE_API_KEY=your-google-translate-api-key-here
```

### 3. How It Works

#### When a Message is Sent:
1. User sends a message in any language
2. System detects the source language automatically
3. Message is translated to both English and Arabic
4. Both translations are stored in `chat_message_translations` table
5. Original message is stored in `chat_messages` table

#### When Messages are Displayed:
1. System fetches messages with translations
2. Displays message in user's current locale (English or Arabic)
3. Falls back to original if translation is missing

## API Endpoints

### GET `/api/chat/[id]/messages?locale=en|ar`
- Fetches all messages for a chat
- Returns messages translated to the specified locale
- Query parameter `locale` determines which translation to return

### POST `/api/chat/[id]/messages`
- Sends a new message
- Automatically translates to both languages
- Stores translations in database

## Database Structure

### `chat_messages` table
- Stores original message data
- Contains: id, chat_id, sender_id, sender_name, sender_role, file_url, timestamp

### `chat_message_translations` table
- Stores translations for each message
- Contains: message_id, locale (en/ar), content, sender_name
- One row per message per language

## Translation Flow

```
User sends message → Detect language → Translate to EN → Translate to AR → Store all
```

## Fallback Behavior

- If Google Translate API is not configured: Uses original text for both languages
- If translation fails: Uses original text as fallback
- If translation API is unavailable: System continues to work with original text

## Cost Considerations

- Google Translate API charges per character translated
- First 500,000 characters per month are free
- After that: $20 per million characters

## Testing

1. Send a message in English → Should be stored in both EN and AR
2. Send a message in Arabic → Should be stored in both EN and AR
3. Switch language → Messages should display in selected language
4. Check database → Both translations should be present

## Notes

- Translations happen server-side for security
- API key should never be exposed to client
- Consider caching translations for frequently used phrases
- Monitor API usage to avoid unexpected costs
