/// Auth & splash strings for EN / AR (matches app LocaleProvider).

/// Use for [MaterialApp.title] — avoids hot-reload VM lookup issues on `.appName`.
String mobileAppTitle(String locale) {
  final isAr = locale == 'ar';
  return isAr ? 'الخليج للتمويل' : 'Alkhalij for Finance';
}

class MobileStrings {
  MobileStrings(this.locale);
  final String locale;
  bool get isAr => locale == 'ar';

  // Splash
  String get appName => mobileAppTitle(locale);
  String get tagline =>
      isAr ? 'منصة إدارة التمويل' : 'Professional loan management platform';

  // Login
  String get signIn => isAr ? 'تسجيل الدخول' : 'Sign in';
  String get enterCredentials =>
      isAr ? 'أدخل بياناتك للمتابعة' : 'Enter your credentials to continue';
  String get email => isAr ? 'البريد الإلكتروني' : 'Email';
  String get password => isAr ? 'كلمة المرور' : 'Password';
  String get pleaseEnterEmail =>
      isAr ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter email';
  String get pleaseEnterPassword =>
      isAr ? 'يرجى إدخال كلمة المرور' : 'Please enter password';
  String get showPassword => isAr ? 'إظهار كلمة المرور' : 'Show password';
  String get hidePassword => isAr ? 'إخفاء كلمة المرور' : 'Hide password';
  String get createAccount => isAr ? 'إنشاء حساب' : 'Create account';
  String get forgotPassword => isAr ? 'نسيت كلمة المرور؟' : 'Forgot password?';

  // Signup (app bar uses [createAccount] when signup is enabled/disabled)
  String get signupDisabledBody => isAr
      ? 'التسجيل غير متاح حالياً. يرجى التواصل مع المسؤول.'
      : 'Signup is currently disabled. Please contact your administrator.';
  String get signingUpAs =>
      isAr ? 'أقوم بالتسجيل كـ' : 'I am signing up as';
  String get customer => isAr ? 'عميل' : 'Customer';
  String get employee => isAr ? 'موظف' : 'Employee';
  String get name => isAr ? 'الاسم' : 'Name';
  String get enterName => isAr ? 'أدخل الاسم' : 'Enter name';
  String get enterEmail => isAr ? 'أدخل البريد الإلكتروني' : 'Enter email';
  String get atLeast6Chars =>
      isAr ? '6 أحرف على الأقل' : 'At least 6 characters';
  String get phoneOptional =>
      isAr ? 'الهاتف (اختياري)' : 'Phone (optional)';
  String get addressOptional =>
      isAr ? 'العنوان (اختياري)' : 'Address (optional)';

  // Forgot password
  String get forgotPasswordTitle =>
      isAr ? 'نسيت كلمة المرور' : 'Forgot password';
  String get forgotPasswordHeading =>
      isAr ? 'أدخل بريدك الإلكتروني' : 'Enter your email';
  String get forgotPasswordSubtitle => isAr
      ? 'سنرسل لك رابطاً لإعادة تعيين كلمة المرور'
      : "We'll send you a link to reset your password";
  String get emailLabel => isAr ? 'البريد الإلكتروني' : 'Email';
  String get enterEmailValidator =>
      isAr ? 'أدخل البريد' : 'Enter email';
  String get sendResetLink =>
      isAr ? 'إرسال رابط إعادة التعيين' : 'Send reset link';
  String get resetLinkSent => isAr
      ? 'تم إرسال رابط إعادة تعيين كلمة المرور'
      : 'Password reset link has been sent';
  String get genericError => isAr ? 'حدث خطأ' : 'Something went wrong';

  // Auth API errors (login/signup)
  String get authInvalidCredentials =>
      isAr ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Email or password is incorrect';
  String get authUserNotFound =>
      isAr ? 'لا يوجد حساب بهذه البيانات' : 'No account found with these details';
  String get authInactive => isAr
      ? 'حسابك غير نشط. يرجى التواصل مع الدعم.'
      : 'Your account is inactive. Please contact support.';
  String get authEmailExists =>
      isAr ? 'هذا البريد الإلكتروني مسجل مسبقاً' : 'This email is already registered';
  String get authServiceNotFound => isAr
      ? 'تعذر الوصول للخدمة. تحقق من عنوان الخادم وحاول مرة أخرى.'
      : 'Service not found. Please check the server URL and try again.';
  String get authServerHtml => isAr
      ? 'الخادم أعاد صفحة HTML بدلاً من JSON. تحقق من عنوان الـ API.'
      : 'Server returned an HTML page instead of JSON. Please check the API URL.';
  String get authNetworkError => isAr
      ? 'خطأ في الشبكة. تحقق من الاتصال وحاول مرة أخرى.'
      : 'Network error. Please check your internet connection and try again.';
  String get authGenericSignup => isAr
      ? 'حدث خطأ أثناء إنشاء الحساب. حاول مرة أخرى.'
      : 'Something went wrong while creating the account. Please try again.';
  String get authGenericLogin => isAr
      ? 'حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى.'
      : 'Something went wrong while signing in. Please try again.';

  // Profile / menu
  String get profileTitle => isAr ? 'الملف الشخصي' : 'Profile';
  String get notificationsTitle => isAr ? 'الإشعارات' : 'Notifications';
  String get markAllRead => isAr ? 'تعليم الكل كمقروء' : 'Mark all read';
  String get noNotifications => isAr ? 'لا توجد إشعارات' : 'No notifications';
  String get privacyPolicy => isAr ? 'سياسة الخصوصية' : 'Privacy policy';
  String get termsOfService => isAr ? 'الشروط والأحكام' : 'Terms & conditions';
  String get logout => isAr ? 'تسجيل الخروج' : 'Log out';
  String get deleteAccount => isAr ? 'حذف الحساب' : 'Delete account';
  String get deleteAccountConfirmTitle =>
      isAr ? 'حذف الحساب' : 'Delete account';
  String get deleteAccountConfirmBody => isAr
      ? 'هل أنت متأكد؟ لا يمكن التراجع.'
      : 'Are you sure? This cannot be undone.';
  String get deleteAccountEnterPassword => isAr
      ? 'أدخل كلمة المرور لتأكيد حذف الحساب.'
      : 'Enter your password to confirm account deletion.';
  String get deleteAccountSubmit => isAr ? 'حذف نهائياً' : 'Delete permanently';
  String get deleteAccountDisabled => isAr
      ? 'حذف الحساب غير مفعّل. تواصل مع الدعم.'
      : 'Account deletion is disabled. Contact support.';
  String get deleteAccountAdminNotAllowed => isAr
      ? 'لا يمكن حذف حساب المسؤول من التطبيق.'
      : 'Administrator accounts cannot be deleted from the app.';
  String get deleteAccountNotAllowed => isAr
      ? 'لا يمكن حذف هذا الحساب من هنا.'
      : 'This account cannot be deleted here.';
  String get deleteAccountEmployeeHasAssignments => isAr
      ? 'لا يزال لديك عملاء معينون. اطلب من المسؤول إلغاء التعيين أولاً.'
      : 'You still have assigned customers. Ask your administrator to unassign them first.';
  String get deleteAccountGenericError => isAr
      ? 'تعذّر حذف الحساب. حاول مرة أخرى.'
      : 'Could not delete account. Please try again.';
  String get cancel => isAr ? 'إلغاء' : 'Cancel';
  String get delete => isAr ? 'حذف' : 'Delete';
  String get roleAdmin => isAr ? 'مدير' : 'Admin';
  String get roleEmployeeLabel => isAr ? 'موظف' : 'Employee';
  String get roleCustomerLabel => isAr ? 'عميل' : 'Customer';
  String get openLinkHint => isAr
      ? 'افتح الرابط في المتصفح أو WebView'
      : 'Open the link in browser or WebView';

  // Offline / connectivity
  String get internetRequired => isAr ? 'يتطلب اتصالاً بالإنترنت' : 'Internet required';
  String get internetHint => isAr
      ? 'يرجى تشغيل الواي فاي أو بيانات الجوال والمحاولة مرة أخرى.'
      : 'Please turn on Wi‑Fi or mobile data and try again.';
  String get retry => isAr ? 'إعادة المحاولة' : 'Retry';
}
