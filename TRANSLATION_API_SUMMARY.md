# Translation API Summary

## Translation Functions Used

The following translation utility functions are implemented in `src/lib/translations.ts`:

1. **`saveUserNameTranslations(userId, nameEn, nameAr)`** - Saves user name translations
2. **`saveLoanNotesTranslations(loanId, notesEn, notesAr)`** - Saves loan notes translations
3. **`saveChatMessageTranslations(messageId, contentEn, contentAr, senderNameEn, senderNameAr)`** - Saves chat message translations
4. **`saveNotificationTranslations(notificationId, titleEn, messageEn, titleAr, messageAr)`** - Saves notification translations
5. **`saveBroadcastTranslations(broadcastId, titleEn, messageEn, titleAr, messageAr)`** - Saves broadcast translations
6. **`getUserNameTranslation(userId, locale)`** - Gets user name translation
7. **`getLoanNotesTranslation(loanId, locale)`** - Gets loan notes translation

## APIs Using Translations

### 1. Authentication APIs
- **`POST /api/auth/signup`** ✅
  - Uses: `saveUserNameTranslations`
  - Saves name translations when creating customer account
  - Returns user with `nameKey` for translation lookup

### 2. Customer APIs
- **`GET /api/customers`** ✅
  - Retrieves customers with translations via LEFT JOIN
  - Returns `name_en`, `name_ar`, and `nameKey`
  
- **`POST /api/customers`** ✅
  - Uses: `saveUserNameTranslations`
  - Saves name translations before creating customer record
  - Transaction ensures data consistency
  
- **`GET /api/customers/[id]`** ✅
  - Retrieves customer with translations via LEFT JOIN
  - Returns both English and Arabic name versions
  
- **`PUT /api/customers/[id]`** ✅
  - Uses: `saveUserNameTranslations`
  - Updates name translations if name is provided
  - Transaction ensures data consistency

### 3. Employee APIs
- **`GET /api/employees`** ✅
  - Retrieves employees with translations via LEFT JOIN
  - Returns `name_en`, `name_ar`, and `nameKey`
  
- **`POST /api/employees`** ✅
  - Uses: `saveUserNameTranslations`
  - Saves name translations before creating employee record
  - Transaction ensures data consistency
  
- **`GET /api/employees/[id]`** ✅
  - Retrieves employee with translations via LEFT JOIN
  - Returns both English and Arabic name versions
  
- **`PUT /api/employees/[id]`** ✅
  - Uses: `saveUserNameTranslations`
  - Updates name translations if name is provided
  - Transaction ensures data consistency

### 4. Loan APIs
- **`GET /api/loans`** ✅
  - Retrieves loans with notes translations via LEFT JOIN
  - Returns `notes_en`, `notes_ar`, and `notesKey`
  - Supports filtering by customerId, employeeId, status
  
- **`POST /api/loans`** ✅
  - Uses: `saveLoanNotesTranslations`
  - Saves notes translations before creating loan record
  - Transaction ensures data consistency
  
- **`GET /api/loans/[id]`** ✅
  - Retrieves loan with notes translations via LEFT JOIN
  - Returns both English and Arabic notes versions
  
- **`PUT /api/loans/[id]`** ✅
  - Uses: `saveLoanNotesTranslations`
  - Updates notes translations if notes are provided
  - Transaction ensures data consistency

### 5. Notification APIs
- **`GET /api/notifications`** ✅
  - Retrieves notifications with translations via LEFT JOIN
  - Returns `title_en`, `title_ar`, `message_en`, `message_ar`
  - Returns `titleKey` and `messageKey` for translation lookup
  
- **`POST /api/notifications`** ✅
  - Uses: `saveNotificationTranslations`
  - Accepts `titleAr` and `messageAr` parameters
  - Saves translations before creating notification
  - Transaction ensures data consistency

### 6. Chat APIs
- **`GET /api/chat`** ✅
  - Retrieves chats with last message translations
  - Uses LEFT JOIN to get message translations
  
- **Chat Message APIs** (To be implemented)
  - Will use: `saveChatMessageTranslations`
  - Will save content and sender name translations

## Translation Flow

### Create/Update Flow:
1. Extract translatable fields (name, notes, content, title, message)
2. **Save translations FIRST** to respective translation tables (en and ar)
3. Save main record with reference to translations
4. Return record with translations included in response

### Read Flow:
1. Query main table with LEFT JOIN to translation tables
2. Return both English and Arabic versions
3. Include `nameKey`/`notesKey`/`titleKey`/`messageKey` for frontend translation lookup

## Database Tables Used

- `user_translations` - Stores user name translations
- `loan_translations` - Stores loan notes translations
- `chat_message_translations` - Stores chat message translations
- `notification_translations` - Stores notification translations
- `broadcast_translations` - Stores broadcast translations

## Current Status

✅ **Working Correctly:**
- All translation functions are properly implemented
- All APIs save translations before creating/updating records
- All GET APIs retrieve translations via LEFT JOIN
- Transactions ensure data consistency
- Translation functions were fixed to directly save to database (not using generic helper)

⚠️ **Note:**
- Currently, when creating users/employees/customers, the same value is used for both English and Arabic (e.g., `saveUserNameTranslations(userId, name, name)`)
- To support separate Arabic translations, APIs would need to accept `nameAr` parameter
- This can be enhanced later if needed

## Testing Translation APIs

To verify translations are working:

1. **Create a customer/employee** - Check `user_translations` table has both `en` and `ar` entries
2. **Create a loan with notes** - Check `loan_translations` table has both `en` and `ar` entries
3. **Create a notification** - Check `notification_translations` table has both `en` and `ar` entries
4. **Query APIs** - Verify responses include both `name_en`/`name_ar` or `notes_en`/`notes_ar`
5. **Update records** - Verify translations are updated correctly
