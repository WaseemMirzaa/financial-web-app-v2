# Google Play — Photo and video permissions declaration

Use this in **Play Console → App content → Sensitive app permissions → Photos and videos** (or the policy task for `READ_MEDIA_IMAGES` / `READ_MEDIA_VIDEO`).

## Core functionality (summary)

**Financial portal access with in-app WebView** — customers and employees use the Alkhalij Tamweel web platform inside the app to complete account workflows, including **uploading photos and documents** (e.g. KYC, loan paperwork, chat attachments) via the website’s file inputs.

## Suggested answers

| Field | Answer |
|--------|--------|
| **Why does your app need this permission?** | App functionality |
| **Describe how your app uses photos/videos** | Users sign in to the Alkhalij Tamweel financial portal in an embedded WebView. When the website asks for a file (image, document, or video), the app uses the **system photo/document picker** so the user can attach files from their device for uploads in the portal (forms, chat, compliance). Access is **user-initiated only** when they tap upload in the web app—not for browsing the gallery in the background. |
| **Is access required for core functionality?** | Yes — uploading supporting documents and attachments is part of using the portal on mobile. |

## Technical note (this build)

Release builds **do not declare** `READ_MEDIA_IMAGES` or `READ_MEDIA_VIDEO` in the manifest. File upload uses Android **GET_CONTENT / OPEN_DOCUMENT / PICK** intents (see `AndroidManifest.xml` `<queries>`), which aligns with Google’s photo-picker guidance and avoids broad media access.

If Play Console still lists old permissions from a previous upload, upload a **new AAB** with a higher `versionCode` and complete the declaration above only if you re-add those permissions later.
