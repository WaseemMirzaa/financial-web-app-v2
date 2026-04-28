import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../l10n/mobile_strings.dart';
import '../providers/auth_provider.dart';
import '../providers/locale_provider.dart';
import '../theme/app_theme.dart';
import 'login_screen.dart';

/// Confirms password and calls POST /api/auth/delete-account.
class DeleteAccountScreen extends StatefulWidget {
  const DeleteAccountScreen({super.key});

  @override
  State<DeleteAccountScreen> createState() => _DeleteAccountScreenState();
}

class _DeleteAccountScreenState extends State<DeleteAccountScreen> {
  final _password = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _obscure = true;

  @override
  void dispose() {
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = context.read<AuthProvider>();
    final locale = context.read<LocaleProvider>().locale;
    final err = await auth.deleteAccount(_password.text, locale: locale);
    if (!mounted) return;
    if (err == null) {
      final strings = MobileStrings(locale);
      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          title: Text(strings.deleteAccountSuccessTitle),
          content: Text(strings.deleteAccountSuccessBody),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: Text(strings.okAction),
            ),
          ],
        ),
      );
      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (_) => false,
      );
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(err)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final t = MobileStrings(context.watch<LocaleProvider>().locale);
    final email = auth.user?.email ?? '';

    return Scaffold(
      backgroundColor: AppTheme.bgPage,
      appBar: AppBar(
        title: Text(t.deleteAccount),
        backgroundColor: AppTheme.primary500,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                t.deleteAccountEnterPassword,
                style: const TextStyle(color: AppTheme.neutral600, fontSize: 15),
              ),
              const SizedBox(height: 8),
              Text(
                email,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  color: AppTheme.neutral900,
                ),
              ),
              const SizedBox(height: 20),
              TextFormField(
                controller: _password,
                obscureText: _obscure,
                decoration: InputDecoration(
                  labelText: t.password,
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                      color: AppTheme.neutral600,
                    ),
                    onPressed: () => setState(() => _obscure = !_obscure),
                    tooltip: _obscure ? t.showPassword : t.hidePassword,
                  ),
                ),
                validator: (v) =>
                    v == null || v.isEmpty ? t.pleaseEnterPassword : null,
              ),
              const SizedBox(height: 16),
              Text(
                t.deleteAccountConfirmBody,
                style: const TextStyle(fontSize: 13, color: AppTheme.neutral600),
              ),
              const SizedBox(height: 24),
              SizedBox(
                height: 52,
                child: ElevatedButton(
                  onPressed: auth.isLoading ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.error,
                    foregroundColor: Colors.white,
                  ),
                  child: auth.isLoading
                      ? const SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : Text(t.deleteAccountSubmit),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
