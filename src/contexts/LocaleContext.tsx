'use client';

import React, { createContext, useContext, useState, useEffect, useLayoutEffect, ReactNode } from 'react';
import { Locale } from '@/types';

function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  const l = localStorage.getItem('locale');
  return (l === 'ar' || l === 'en') ? l : 'en';
}

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isInitialized: boolean;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

// Simple translations (in production, use i18n library)
const translations: Record<Locale, Record<string, string>> = {
  en: {
    // Common
    'common.login': 'Login',
    'common.logout': 'Logout',
    'common.email': 'Email',
    'common.password': 'Password',
    'common.submit': 'Submit',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.dashboard': 'Dashboard',
    'common.customers': 'Customers',
    'common.employees': 'Employees',
    'common.loans': 'Loans',
    'common.chat': 'Chat',
    'common.notifications': 'Notifications',
    'common.settings': 'Settings',
    'common.profile': 'Profile',
    'common.language': 'Language',
    'common.english': 'English',
    'common.arabic': 'Arabic',
    'common.back': 'Back',
    'common.admin': 'Admin',
    'common.employee': 'Employee',
    'common.customer': 'Customer',
    'common.name': 'Name',
    'common.phone': 'Phone',
    'common.address': 'Address',
    'common.status': 'Status',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.welcome': 'Welcome',
    'common.welcomeBack': 'Welcome back',
    'common.error': 'Error',
    'common.loading': 'Loading',
    'common.close': 'Close',
    'common.openMenu': 'Open menu',
    'common.changeLanguage': 'Change language',
    'common.notificationsAria': 'Notifications',
    'app.loanManager': 'LoanManager',
    
    // Login & Signup
    'auth.signIn': 'Sign in to access your dashboard',
    'auth.signUp': 'Sign up as a customer to get started',
    'auth.dontHaveAccount': "Don't have an account?",
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.signUpAsCustomer': 'Sign up as customer',
    'auth.signInLink': 'Sign in',
    'auth.createAccount': 'Create Account',
    'auth.creatingAccount': 'Creating account…',
    'auth.signingIn': 'Signing in…',
    'auth.fullName': 'Full Name',
    'auth.confirmPassword': 'Confirm Password',
    'auth.phoneOptional': 'Phone (Optional)',
    'auth.addressOptional': 'Address (Optional)',
    'auth.enterprisePlatform': 'Enterprise Platform',
    'auth.customerRegistration': 'Customer Registration',
    'auth.heroTitle': 'Secure, intelligent loan management for modern finance teams',
    'auth.heroDescription': 'Streamline operations, enhance visibility, and maintain compliance with our comprehensive loan management solution designed for financial institutions.',
    'auth.signupHeroTitle': 'Join thousands of customers managing their loans with confidence',
    'auth.signupHeroDescription': 'Create your account today and gain instant access to your loan information, payment schedules, and direct communication with your loan officer.',
    'auth.bankGradeSecurity': 'Bank-grade security',
    'auth.enterpriseCompliance': 'Enterprise compliance',
    'auth.realTimeAnalytics': 'Real-time analytics',
    'auth.dataDrivenInsights': 'Data-driven insights',
    'auth.roleBasedAccess': 'Role-based access',
    'auth.granularPermissions': 'Granular permissions',
    'auth.securePlatform': 'Secure platform',
    'auth.yourDataProtected': 'Your data protected',
    'auth.trackLoans': 'Track loans',
    'auth.realTimeUpdates': 'Real-time updates',
    'auth.directSupport': 'Direct support',
    'auth.expertAssistance': 'Expert assistance',
    'auth.professionalPlatform': 'Professional loan management platform',
    'auth.demoCredentials': 'Demo credentials',
    'auth.useAnyPassword': 'Use any password for demo purposes.',
    'auth.invalidEmailPassword': 'Invalid email or password',
    'auth.errorOccurred': 'An error occurred. Please try again.',
    'auth.passwordsDoNotMatch': 'Passwords do not match',
    'auth.passwordMinLength': 'Password must be at least 6 characters',
    'auth.emailExists': 'Email already exists. Please use a different email or login.',
    'auth.employeeAccountsNote': 'Note: Employee accounts are created by administrators only.',
    'auth.forgotPassword': 'Forgot password?',
    'auth.forgotPasswordTitle': 'Reset your password',
    'auth.forgotPasswordDescription': 'Enter your email and we’ll send you a one-time code to reset your password.',
    'auth.sendOtp': 'Send OTP',
    'auth.otpSent': 'We’ve sent a one-time code to your email. Enter it below along with your new password.',
    'auth.enterOtp': 'Enter OTP',
    'auth.newPassword': 'New password',
    'auth.resetPassword': 'Reset password',
    'auth.otpInvalidOrExpired': 'Invalid or expired OTP. Please request a new code.',
    'auth.passwordResetSuccess': 'Password reset successfully. You can now sign in.',
    'auth.backToLogin': 'Back to login',
    'auth.sendingOtp': 'Sending…',
    'auth.resettingPassword': 'Resetting…',
    'auth.demoOtpHint': 'Demo: OTP sent to your email (use this code)',
    
    // Dashboard
    'dashboard.welcomeAdmin': 'Welcome to the admin dashboard',
    'dashboard.welcomeEmployee': 'Welcome, {name}',
    'dashboard.welcomeCustomer': 'Welcome, {name}',
    'dashboard.totalCustomers': 'Total Customers',
    'dashboard.totalEmployees': 'Total Employees',
    'dashboard.totalLoans': 'Total Loans',
    'dashboard.activeChats': 'Active Chats',
    'dashboard.recentLoans': 'Recent Loans',
    'dashboard.recentCustomers': 'Recent Customers',
    'dashboard.recentEmployees': 'Recent Employees',
    'dashboard.systemOverview': 'System Overview',
    'dashboard.activeLoans': 'Active Loans',
    'dashboard.pendingReviews': 'Pending Reviews',
    'dashboard.totalLoanAmount': 'Total Loan Amount',
    'dashboard.assignedCustomers': 'Assigned Customers',
    'dashboard.activeLoansCount': 'Active Loans',
    'dashboard.pendingReviewsCount': 'Pending Reviews',
    'dashboard.noAssignedCustomers': 'No assigned customers',
    'dashboard.noActiveLoan': 'No Active Loan',
    'dashboard.noActiveLoanDescription': "You don't have an active loan at the moment.",
    'dashboard.activeLoanDescription': 'Your current loan details',
    'dashboard.viewAllLoans': 'View All Loans',
    'dashboard.seeAllLoanDetails': 'See all your loan details',
    'dashboard.chatWithEmployee': 'Chat with Employee',
    'dashboard.contactAssignedEmployee': 'Contact your assigned employee',
    
    // Forms & Labels
    'form.customer': 'Customer',
    'form.employee': 'Employee',
    'form.selectCustomer': 'Select customer',
    'form.selectEmployee': 'Select employee',
    'form.placeholder.email': 'name@company.com',
    'form.placeholder.password': '••••••••',
    'form.placeholder.fullName': 'John Doe',
    'form.placeholder.phone': '+1234567890',
    'form.placeholder.address': '123 Main St, City, Country',
    'form.amount': 'Amount',
    'form.interestRate': 'Interest Rate',
    'form.numberOfInstallments': 'Number of Installments',
    'form.installmentTotal': 'Installment Amount',
    'form.startDate': 'Start Date',
    'form.notes': 'Notes',
    'form.assigned': 'Assigned',
    'form.assignedEmployee': 'Assigned Employee',
    'form.memberSince': 'Member Since',
    'form.created': 'Created',
    'form.started': 'Started',
    
    // Pages
    'page.manageEmployees': 'Manage employees and their assignments',
    'page.manageCustomers': 'Manage customers and their assignments',
    'page.manageAllLoans': 'Manage all loans in the system',
    'page.viewAssignedCustomers': 'View and manage your assigned customers',
    'page.createEmployee': 'Create Employee',
    'page.editEmployee': 'Edit Employee',
    'page.createCustomer': 'Create Customer',
    'page.editCustomer': 'Edit Customer',
    'page.createLoan': 'Create Loan',
    'page.editLoan': 'Edit Loan',
    'page.assignEmployee': 'Assign Employee',
    'page.changeEmployee': 'Change Employee',
    'page.removeEmployee': 'Remove Employee',
    
    // Detail Pages
    'detail.employeeInformation': 'Employee Information',
    'detail.assignedCustomers': 'Assigned Customers',
    'detail.noCustomersAssigned': 'No customers assigned',
    'detail.totalCustomers': 'Total: {count} customer{plural}',
    'detail.contactInformation': 'Contact Information',
    'detail.loanHistory': 'Loan History',
    'detail.noLoansFound': 'No loans found',
    'detail.loanDetails': 'Loan Details',
    'detail.loanAmount': 'Loan Amount',
    'detail.interestRate': 'Interest Rate',
    'detail.numberOfInstallments': 'Number of Installments',
    'detail.installmentAmount': 'Installment Amount',
    'detail.startDate': 'Start Date',
    'detail.parties': 'Parties',
    'detail.customer': 'Customer',
    'detail.assignedEmployee': 'Assigned Employee',
    'detail.noEmployeeAssigned': 'No employee assigned',
    'detail.employeeNotFound': 'Employee not found',
    'detail.customerNotFound': 'Customer not found',
    'detail.loanNotFound': 'Loan not found',
    'detail.unknown': 'Unknown',
    'detail.unassigned': 'Unassigned',
    
    // Table Headers
    'table.name': 'Name',
    'table.email': 'Email',
    'table.phone': 'Phone',
    'table.customer': 'Customer',
    'table.amount': 'Amount',
    'table.interestRate': 'Interest Rate',
    'table.installments': 'Installments',
    'table.status': 'Status',
    'table.actions': 'Actions',
    
    // Status & Badges
    'status.active': 'Active',
    'status.inactive': 'Inactive',
    
    // Loan Status
    'loan.status.under_review': 'Under Review',
    'loan.status.approved': 'Approved',
    'loan.status.active': 'Active',
    'loan.status.rejected': 'Rejected',
    'loan.status.closed': 'Closed',
    
    // Notifications
    'notification.markAllRead': 'Mark all read',
    'notification.noNotifications': 'No notifications',
    'notification.newCustomerAssigned': 'New Customer Assigned',
    'notification.ahmedAssignedToYou': 'Ahmed Customer has been assigned to you',
    'notification.loanStatusUpdated': 'Loan Status Updated',
    'notification.loanUpdatedToActive': 'Your loan status has been updated to Active',
    
    // Chat
    'chat.selectConversation': 'Select a conversation to start chatting',
    'chat.noConversations': 'No conversations available',
    'chat.typeMessage': 'Type a message...',
    'chat.send': 'Send',
    'chat.noMessages': 'No messages yet. Start the conversation!',
    'chat.selectChat': 'Select a chat to view messages',
    'chat.allChats': 'All Chats',
    'chat.chats': 'Chats',
    'chat.chat': 'Chat',
    'chat.monitorAll': 'Monitor all customer-employee and internal chats',
    'chat.withCustomers': 'Chat with customers and internal teams',
    'chat.withEmployee': 'Chat with your assigned employee',
    'chat.noChatAvailable': 'No chat available. Please contact support.',
    'chat.file': 'File',
    'chat.room.contracts': 'Contracts',
    'chat.room.followUp': 'Follow Up',
    'chat.room.receipts': 'Receipts',
    'chat.msg.helloQuestion': 'Hello, I have a question about my loan.',
    'chat.msg.helloHelp': 'Hello Ahmed, how can I help you today?',
    'chat.msg.nextPayment': 'When is my next payment due?',
    'chat.msg.contractTemplate': 'Has anyone reviewed the new contract template?',
    'chat.sender.ahmedCustomer': 'Ahmed Customer',
    'chat.sender.johnEmployee': 'John Employee',
    'chat.sender.fatimaCustomer': 'Fatima Customer',
    'chat.sender.sarahEmployee': 'Sarah Employee',
    'loan.notes.monthlyPayment': 'Monthly payment plan',
    'loan.notes.pendingActivation': 'Pending activation',
    'loan.notes.documentationReview': 'Documentation review in progress',
    'detail.name.ahmedCustomer': 'Ahmed Customer',
    'detail.name.fatimaCustomer': 'Fatima Customer',
    'detail.name.mohammedCustomer': 'Mohammed Customer',
    'detail.name.johnEmployee': 'John Employee',
    'detail.name.sarahEmployee': 'Sarah Employee',
    
    // Loan Detail
    'loan.loanNumber': 'Loan #{number}',
    'loan.notes': 'Notes',
    'loan.notFoundOrNotAssigned': 'Loan not found or not assigned to you',
    'loan.customerNotFoundOrNotAssigned': 'Customer not found or not assigned to you',
    'loan.interest': 'interest',
    'loan.installments': 'installments',
    'loan.started': 'Started',
    'loan.summary': 'Loan Summary',
    'loan.totalLoans': 'Total Loans',
    'loan.totalLoanAmount': 'Total Loan Amount',
    
    // Employee Pages
    'employee.manageLoans': 'Manage loans for your assigned customers',
    
    // Customer Loan Page
    'customer.myLoans': 'My Loans',
    'customer.viewAllLoans': 'View all your loan information (Read-only)',
    'customer.lastUpdated': 'Last Updated',
  },
  ar: {
    // Common
    'common.login': 'تسجيل الدخول',
    'common.logout': 'تسجيل الخروج',
    'common.email': 'البريد الإلكتروني',
    'common.password': 'كلمة المرور',
    'common.submit': 'إرسال',
    'common.cancel': 'إلغاء',
    'common.save': 'حفظ',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.create': 'إنشاء',
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.dashboard': 'لوحة التحكم',
    'common.customers': 'العملاء',
    'common.employees': 'الموظفون',
    'common.loans': 'القروض',
    'common.chat': 'الدردشة',
    'common.notifications': 'الإشعارات',
    'common.settings': 'الإعدادات',
    'common.profile': 'الملف الشخصي',
    'common.language': 'اللغة',
    'common.english': 'الإنجليزية',
    'common.arabic': 'العربية',
    'common.back': 'رجوع',
    'common.admin': 'مسؤول',
    'common.employee': 'موظف',
    'common.customer': 'عميل',
    'common.name': 'الاسم',
    'common.phone': 'الهاتف',
    'common.address': 'العنوان',
    'common.status': 'الحالة',
    'common.active': 'نشط',
    'common.inactive': 'غير نشط',
    'common.welcome': 'مرحباً',
    'common.welcomeBack': 'مرحباً بعودتك',
    'common.error': 'خطأ',
    'common.loading': 'جاري التحميل',
    'common.close': 'إغلاق',
    'common.openMenu': 'فتح القائمة',
    'common.changeLanguage': 'تغيير اللغة',
    'common.notificationsAria': 'الإشعارات',
    'app.loanManager': 'LoanManager',
    
    // Login & Signup
    'auth.signIn': 'قم بتسجيل الدخول للوصول إلى لوحة التحكم',
    'auth.signUp': 'سجل كعميل للبدء',
    'auth.dontHaveAccount': 'ليس لديك حساب؟',
    'auth.alreadyHaveAccount': 'لديك حساب بالفعل؟',
    'auth.signUpAsCustomer': 'سجل كعميل',
    'auth.signInLink': 'تسجيل الدخول',
    'auth.createAccount': 'إنشاء حساب',
    'auth.creatingAccount': 'جاري إنشاء الحساب…',
    'auth.signingIn': 'جاري تسجيل الدخول…',
    'auth.fullName': 'الاسم الكامل',
    'auth.confirmPassword': 'تأكيد كلمة المرور',
    'auth.phoneOptional': 'الهاتف (اختياري)',
    'auth.addressOptional': 'العنوان (اختياري)',
    'auth.enterprisePlatform': 'منصة المؤسسات',
    'auth.customerRegistration': 'تسجيل العملاء',
    'auth.heroTitle': 'إدارة قروض آمنة وذكية لفرق المالية الحديثة',
    'auth.heroDescription': 'تبسيط العمليات وتعزيز الرؤية والحفاظ على الامتثال مع حل إدارة القروض الشامل المصمم للمؤسسات المالية.',
    'auth.signupHeroTitle': 'انضم إلى آلاف العملاء الذين يديرون قروضهم بثقة',
    'auth.signupHeroDescription': 'أنشئ حسابك اليوم واحصل على وصول فوري لمعلومات قرضك وجداول الدفع والتواصل المباشر مع موظف القرض الخاص بك.',
    'auth.bankGradeSecurity': 'أمان على مستوى البنوك',
    'auth.enterpriseCompliance': 'امتثال المؤسسات',
    'auth.realTimeAnalytics': 'تحليلات فورية',
    'auth.dataDrivenInsights': 'رؤى مدفوعة بالبيانات',
    'auth.roleBasedAccess': 'وصول قائم على الأدوار',
    'auth.granularPermissions': 'أذونات دقيقة',
    'auth.securePlatform': 'منصة آمنة',
    'auth.yourDataProtected': 'بياناتك محمية',
    'auth.trackLoans': 'تتبع القروض',
    'auth.realTimeUpdates': 'تحديثات فورية',
    'auth.directSupport': 'دعم مباشر',
    'auth.expertAssistance': 'مساعدة الخبراء',
    'auth.professionalPlatform': 'منصة احترافية لإدارة القروض',
    'auth.demoCredentials': 'بيانات تجريبية',
    'auth.useAnyPassword': 'استخدم أي كلمة مرور للأغراض التجريبية.',
    'auth.invalidEmailPassword': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    'auth.errorOccurred': 'حدث خطأ. يرجى المحاولة مرة أخرى.',
    'auth.passwordsDoNotMatch': 'كلمات المرور غير متطابقة',
    'auth.passwordMinLength': 'يجب أن تكون كلمة المرور 6 أحرف على الأقل',
    'auth.emailExists': 'البريد الإلكتروني موجود بالفعل. يرجى استخدام بريد إلكتروني مختلف أو تسجيل الدخول.',
    'auth.employeeAccountsNote': 'ملاحظة: يتم إنشاء حسابات الموظفين من قبل المسؤولين فقط.',
    'auth.forgotPassword': 'نسيت كلمة المرور؟',
    'auth.forgotPasswordTitle': 'إعادة تعيين كلمة المرور',
    'auth.forgotPasswordDescription': 'أدخل بريدك الإلكتروني وسنرسل لك رمزاً لمرة واحدة لإعادة تعيين كلمة المرور.',
    'auth.sendOtp': 'إرسال الرمز',
    'auth.otpSent': 'لقد أرسلنا رمزاً لمرة واحدة إلى بريدك. أدخله أدناه مع كلمة المرور الجديدة.',
    'auth.enterOtp': 'أدخل الرمز',
    'auth.newPassword': 'كلمة المرور الجديدة',
    'auth.resetPassword': 'إعادة تعيين كلمة المرور',
    'auth.otpInvalidOrExpired': 'الرمز غير صالح أو منتهي. يرجى طلب رمز جديد.',
    'auth.passwordResetSuccess': 'تم إعادة تعيين كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.',
    'auth.backToLogin': 'العودة لتسجيل الدخول',
    'auth.sendingOtp': 'جاري الإرسال…',
    'auth.resettingPassword': 'جاري إعادة التعيين…',
    'auth.demoOtpHint': 'تجربة: تم إرسال الرمز إلى بريدك (استخدم هذا الرمز)',
    
    // Dashboard
    'dashboard.welcomeAdmin': 'مرحباً بك في لوحة تحكم المسؤول',
    'dashboard.welcomeEmployee': 'مرحباً، {name}',
    'dashboard.welcomeCustomer': 'مرحباً، {name}',
    'dashboard.totalCustomers': 'إجمالي العملاء',
    'dashboard.totalEmployees': 'إجمالي الموظفين',
    'dashboard.totalLoans': 'إجمالي القروض',
    'dashboard.activeChats': 'الدردشات النشطة',
    'dashboard.recentLoans': 'القروض الأخيرة',
    'dashboard.recentCustomers': 'العملاء الأخيرون',
    'dashboard.recentEmployees': 'الموظفون الأخيرون',
    'dashboard.systemOverview': 'نظرة عامة على النظام',
    'dashboard.activeLoans': 'القروض النشطة',
    'dashboard.pendingReviews': 'المراجعات المعلقة',
    'dashboard.totalLoanAmount': 'إجمالي مبلغ القرض',
    'dashboard.assignedCustomers': 'العملاء المعينون',
    'dashboard.activeLoansCount': 'القروض النشطة',
    'dashboard.pendingReviewsCount': 'المراجعات المعلقة',
    'dashboard.noAssignedCustomers': 'لا يوجد عملاء معينون',
    'dashboard.noActiveLoan': 'لا يوجد قرض نشط',
    'dashboard.noActiveLoanDescription': 'ليس لديك قرض نشط في الوقت الحالي.',
    'dashboard.activeLoanDescription': 'تفاصيل قرضك الحالي',
    'dashboard.viewAllLoans': 'عرض جميع القروض',
    'dashboard.seeAllLoanDetails': 'اطلع على جميع تفاصيل قروضك',
    'dashboard.chatWithEmployee': 'الدردشة مع الموظف',
    'dashboard.contactAssignedEmployee': 'اتصل بالموظف المعين لك',
    
    // Forms & Labels
    'form.customer': 'العميل',
    'form.employee': 'الموظف',
    'form.selectCustomer': 'اختر العميل',
    'form.selectEmployee': 'اختر الموظف',
    'form.placeholder.email': 'name@company.com',
    'form.placeholder.password': '••••••••',
    'form.placeholder.fullName': 'أحمد محمد',
    'form.placeholder.phone': '+966501234567',
    'form.placeholder.address': 'الرياض، المملكة العربية السعودية',
    'form.amount': 'المبلغ',
    'form.interestRate': 'معدل الفائدة',
    'form.numberOfInstallments': 'عدد الأقساط',
    'form.installmentTotal': 'مبلغ القسط',
    'form.startDate': 'تاريخ البدء',
    'form.notes': 'ملاحظات',
    'form.assigned': 'معين',
    'form.assignedEmployee': 'الموظف المعين',
    'form.memberSince': 'عضو منذ',
    'form.created': 'تم الإنشاء',
    'form.started': 'تم البدء',
    
    // Pages
    'page.manageEmployees': 'إدارة الموظفين وتعييناتهم',
    'page.manageCustomers': 'إدارة العملاء وتعييناتهم',
    'page.manageAllLoans': 'إدارة جميع القروض في النظام',
    'page.viewAssignedCustomers': 'عرض وإدارة العملاء المعينين لك',
    'page.createEmployee': 'إنشاء موظف',
    'page.editEmployee': 'تعديل الموظف',
    'page.createCustomer': 'إنشاء عميل',
    'page.editCustomer': 'تعديل العميل',
    'page.createLoan': 'إنشاء قرض',
    'page.editLoan': 'تعديل القرض',
    'page.assignEmployee': 'تعيين موظف',
    'page.changeEmployee': 'تغيير الموظف',
    'page.removeEmployee': 'إزالة الموظف',
    
    // Detail Pages
    'detail.employeeInformation': 'معلومات الموظف',
    'detail.assignedCustomers': 'العملاء المعينون',
    'detail.noCustomersAssigned': 'لا يوجد عملاء معينون',
    'detail.totalCustomers': 'الإجمالي: {count} عميل{plural}',
    'detail.contactInformation': 'معلومات الاتصال',
    'detail.loanHistory': 'سجل القروض',
    'detail.noLoansFound': 'لم يتم العثور على قروض',
    'detail.loanDetails': 'تفاصيل القرض',
    'detail.loanAmount': 'مبلغ القرض',
    'detail.interestRate': 'معدل الفائدة',
    'detail.numberOfInstallments': 'عدد الأقساط',
    'detail.installmentAmount': 'مبلغ القسط',
    'detail.startDate': 'تاريخ البدء',
    'detail.parties': 'الأطراف',
    'detail.customer': 'العميل',
    'detail.assignedEmployee': 'الموظف المعين',
    'detail.noEmployeeAssigned': 'لا يوجد موظف معين',
    'detail.employeeNotFound': 'لم يتم العثور على الموظف',
    'detail.customerNotFound': 'لم يتم العثور على العميل',
    'detail.loanNotFound': 'لم يتم العثور على القرض',
    'detail.unknown': 'غير معروف',
    'detail.unassigned': 'غير معين',
    
    // Table Headers
    'table.name': 'الاسم',
    'table.email': 'البريد الإلكتروني',
    'table.phone': 'الهاتف',
    'table.customer': 'العميل',
    'table.amount': 'المبلغ',
    'table.interestRate': 'معدل الفائدة',
    'table.installments': 'الأقساط',
    'table.status': 'الحالة',
    'table.actions': 'الإجراءات',
    
    // Status & Badges
    'status.active': 'نشط',
    'status.inactive': 'غير نشط',
    
    // Loan Status
    'loan.status.under_review': 'قيد المراجعة',
    'loan.status.approved': 'معتمد',
    'loan.status.active': 'نشط',
    'loan.status.rejected': 'مرفوض',
    'loan.status.closed': 'مغلق',
    
    // Notifications
    'notification.markAllRead': 'تعليم الكل كمقروء',
    'notification.noNotifications': 'لا توجد إشعارات',
    'notification.newCustomerAssigned': 'تم تعيين عميل جديد',
    'notification.ahmedAssignedToYou': 'تم تعيين أحمد عميل لك',
    'notification.loanStatusUpdated': 'تم تحديث حالة القرض',
    'notification.loanUpdatedToActive': 'تم تحديث حالة قرضك إلى نشط',
    
    // Chat
    'chat.selectConversation': 'اختر محادثة للبدء في الدردشة',
    'chat.noConversations': 'لا توجد محادثات متاحة',
    'chat.typeMessage': 'اكتب رسالة...',
    'chat.send': 'إرسال',
    'chat.noMessages': 'لا توجد رسائل بعد. ابدأ المحادثة!',
    'chat.selectChat': 'اختر محادثة لعرض الرسائل',
    'chat.allChats': 'جميع المحادثات',
    'chat.chats': 'المحادثات',
    'chat.chat': 'محادثة',
    'chat.monitorAll': 'مراقبة جميع محادثات العملاء والموظفين والداخلية',
    'chat.withCustomers': 'الدردشة مع العملاء والفرق الداخلية',
    'chat.withEmployee': 'الدردشة مع الموظف المعين لك',
    'chat.noChatAvailable': 'لا توجد محادثة متاحة. يرجى الاتصال بالدعم.',
    'chat.file': 'ملف',
    'chat.room.contracts': 'العقود',
    'chat.room.followUp': 'المتابعة',
    'chat.room.receipts': 'الإيصالات',
    'chat.msg.helloQuestion': 'مرحباً، لدي سؤال حول قرضي.',
    'chat.msg.helloHelp': 'مرحباً أحمد، كيف يمكنني مساعدتك اليوم؟',
    'chat.msg.nextPayment': 'متى يكون موعد الدفعة القادمة؟',
    'chat.msg.contractTemplate': 'هل راجع أحد قالب العقد الجديد؟',
    'chat.sender.ahmedCustomer': 'أحمد عميل',
    'chat.sender.johnEmployee': 'جون موظف',
    'chat.sender.fatimaCustomer': 'فاطمة عميلة',
    'chat.sender.sarahEmployee': 'سارة موظفة',
    'loan.notes.monthlyPayment': 'خطة الدفع الشهرية',
    'loan.notes.pendingActivation': 'في انتظار التفعيل',
    'loan.notes.documentationReview': 'مراجعة المستندات قيد التنفيذ',
    'detail.name.ahmedCustomer': 'أحمد عميل',
    'detail.name.fatimaCustomer': 'فاطمة عميلة',
    'detail.name.mohammedCustomer': 'محمد عميل',
    'detail.name.johnEmployee': 'جون موظف',
    'detail.name.sarahEmployee': 'سارة موظفة',
    
    // Loan Detail
    'loan.loanNumber': 'قرض #{number}',
    'loan.notes': 'ملاحظات',
    'loan.notFoundOrNotAssigned': 'لم يتم العثور على القرض أو لم يتم تعيينه لك',
    'loan.customerNotFoundOrNotAssigned': 'لم يتم العثور على العميل أو لم يتم تعيينه لك',
    'loan.interest': 'فائدة',
    'loan.installments': 'أقساط',
    'loan.started': 'تم البدء',
    'loan.summary': 'ملخص القرض',
    'loan.totalLoans': 'إجمالي القروض',
    'loan.totalLoanAmount': 'إجمالي مبلغ القرض',
    
    // Employee Pages
    'employee.manageLoans': 'إدارة القروض للعملاء المعينين لك',
    
    // Customer Loan Page
    'customer.myLoans': 'قروضي',
    'customer.viewAllLoans': 'عرض جميع معلومات القروض الخاصة بك (للقراءة فقط)',
    'customer.lastUpdated': 'آخر تحديث',
  },
};

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize locale from localStorage on mount
  useEffect(() => {
    const storedLocale = getStoredLocale();
    setLocaleState(storedLocale);
    
    // Ensure locale is stored in cache
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', storedLocale);
    }
    
    // Set document attributes
    document.documentElement.setAttribute('dir', storedLocale === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', storedLocale);
    
    // Mark as initialized after a brief delay to ensure everything is set
    setTimeout(() => {
      setIsInitialized(true);
    }, 100);
  }, []);

  useLayoutEffect(() => {
    if (isInitialized) {
      document.documentElement.setAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', locale);
    }
  }, [locale, isInitialized]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }
    document.documentElement.setAttribute('dir', newLocale === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', newLocale);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = translations[locale][key] || key;
    if (params) {
      Object.keys(params).forEach((paramKey) => {
        const value = params[paramKey];
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value));
      });
    }
    return text;
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, isInitialized }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
