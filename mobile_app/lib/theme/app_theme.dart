import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Matches web app globals.css: primary #0066B3, neutrals, semantic colors.
class AppTheme {
  static const Color primary50 = Color(0xFFE6F2FA);
  static const Color primary100 = Color(0xFFCCE5F5);
  static const Color primary200 = Color(0xFF99CBEB);
  static const Color primary300 = Color(0xFF66B1E0);
  static const Color primary400 = Color(0xFF3397D6);
  static const Color primary500 = Color(0xFF0066B3);
  static const Color primary600 = Color(0xFF005EB8);
  static const Color primary700 = Color(0xFF004C94);
  static const Color primary800 = Color(0xFF003A70);
  static const Color primary900 = Color(0xFF00284C);

  static const Color neutral50 = Color(0xFFFAFAFA);
  static const Color neutral100 = Color(0xFFF5F5F5);
  static const Color neutral200 = Color(0xFFE0E0E0);
  static const Color neutral400 = Color(0xFFA3A3A3);
  static const Color neutral500 = Color(0xFF737373);
  static const Color neutral600 = Color(0xFF525252);
  static const Color neutral900 = Color(0xFF171717);

  static const Color bgPage = Color(0xFFF8FAFC);
  static const Color error = Color(0xFFEF4444);
  static const Color errorDark = Color(0xFFDC2626);

  static ThemeData get light {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.light(
        primary: primary500,
        onPrimary: Colors.white,
        primaryContainer: primary50,
        onPrimaryContainer: primary900,
        secondary: primary600,
        surface: Colors.white,
        onSurface: neutral900,
        surfaceContainerHighest: neutral100,
        outline: neutral200,
        error: error,
        onError: Colors.white,
      ),
      scaffoldBackgroundColor: bgPage,
      appBarTheme: AppBarTheme(
        elevation: 0,
        centerTitle: true,
        backgroundColor: primary500,
        foregroundColor: Colors.white,
        titleTextStyle: GoogleFonts.plusJakartaSans(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: Colors.white,
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        margin: EdgeInsets.zero,
        clipBehavior: Clip.antiAlias,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: neutral200),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primary500, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: error),
        ),
        labelStyle: GoogleFonts.plusJakartaSans(color: neutral600),
        hintStyle: GoogleFonts.plusJakartaSans(color: neutral400),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary500,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: GoogleFonts.plusJakartaSans(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primary500,
          textStyle: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w500),
        ),
      ),
      textTheme: GoogleFonts.plusJakartaSansTextTheme().copyWith(
        titleLarge: GoogleFonts.plusJakartaSans(
          fontSize: 22,
          fontWeight: FontWeight.w700,
          color: neutral900,
        ),
        titleMedium: GoogleFonts.plusJakartaSans(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: neutral900,
        ),
        bodyLarge: GoogleFonts.plusJakartaSans(fontSize: 16, color: neutral900),
        bodyMedium: GoogleFonts.plusJakartaSans(fontSize: 14, color: neutral600),
        bodySmall: GoogleFonts.plusJakartaSans(fontSize: 12, color: neutral500),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Colors.white,
        selectedItemColor: primary500,
        unselectedItemColor: neutral500,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
    );
  }
}
