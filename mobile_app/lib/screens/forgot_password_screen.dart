import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../l10n/mobile_strings.dart';
import '../theme/app_theme.dart';
import '../providers/locale_provider.dart';
import '../services/api_service.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _email = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _loading = false;
  String? _message;
  bool _success = false;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final t = MobileStrings(context.read<LocaleProvider>().locale);
    setState(() {
      _loading = true;
      _message = null;
    });
    try {
      final data = await ApiService.forgotPassword(_email.text.trim());
      if (!mounted) return;
      setState(() {
        _loading = false;
        _success = data['success'] == true;
        _message = data['message']?.toString() ??
            (data['success'] == true
                ? t.resetLinkSent
                : data['error']?.toString() ?? t.genericError);
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _success = false;
        _message = e.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = MobileStrings(context.watch<LocaleProvider>().locale);
    return Scaffold(
      appBar: AppBar(
        title: Text(t.forgotPasswordTitle),
        backgroundColor: AppTheme.primary500,
        foregroundColor: Colors.white,
      ),
      body: Container(
        color: AppTheme.bgPage,
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 24),
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.06),
                          blurRadius: 16,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          t.forgotPasswordHeading,
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                color: AppTheme.neutral900,
                              ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          t.forgotPasswordSubtitle,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppTheme.neutral500,
                              ),
                        ),
                        const SizedBox(height: 24),
                        TextFormField(
                          controller: _email,
                          keyboardType: TextInputType.emailAddress,
                          decoration: InputDecoration(
                            labelText: t.emailLabel,
                          ),
                          validator: (v) =>
                              v == null || v.isEmpty ? t.enterEmailValidator : null,
                        ),
                        if (_message != null) ...[
                          const SizedBox(height: 12),
                          Text(
                            _message!,
                            style: TextStyle(
                              color: _success ? AppTheme.primary600 : AppTheme.error,
                              fontSize: 13,
                            ),
                          ),
                        ],
                        const SizedBox(height: 24),
                        SizedBox(
                          height: 52,
                          child: ElevatedButton(
                            onPressed: _loading ? null : _submit,
                            child: _loading
                                ? const SizedBox(
                                    height: 24,
                                    width: 24,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white,
                                    ),
                                  )
                                : Text(t.sendResetLink),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
