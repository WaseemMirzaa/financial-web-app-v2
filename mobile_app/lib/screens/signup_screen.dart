import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../l10n/mobile_strings.dart';
import '../theme/app_theme.dart';
import '../providers/auth_provider.dart';
import '../providers/locale_provider.dart';
import '../providers/settings_provider.dart';
import 'main_screen.dart';

/// Signup for both Customer and Employee (temporary; can be turned off from admin via signupEnabled).
class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _phone = TextEditingController();
  final _address = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  String _role = 'customer'; // 'customer' | 'employee'
  bool _obscurePassword = true;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    _phone.dispose();
    _address.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = context.read<AuthProvider>();
    if (_role == 'employee') {
      final ok = await auth.signupEmployee(
        name: _name.text.trim(),
        email: _email.text.trim(),
        password: _password.text,
        locale: context.read<LocaleProvider>().locale,
      );
      if (!mounted) return;
      if (ok) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const MainScreen()),
          (_) => false,
        );
      }
    } else {
      final ok = await auth.signup(
        name: _name.text.trim(),
        email: _email.text.trim(),
        password: _password.text,
        phone: _phone.text.trim().isEmpty ? null : _phone.text.trim(),
        address: _address.text.trim().isEmpty ? null : _address.text.trim(),
        locale: context.read<LocaleProvider>().locale,
      );
      if (!mounted) return;
      if (ok) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const MainScreen()),
          (_) => false,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final settings = context.watch<SettingsProvider>();
    final signupEnabled = settings.signupEnabled;
    final t = MobileStrings(context.watch<LocaleProvider>().locale);

    if (!signupEnabled) {
      return Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          title: Text(t.createAccount),
          backgroundColor: Colors.white,
          foregroundColor: AppTheme.primary500,
          elevation: 0,
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              t.signupDisabledBody,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppTheme.neutral600),
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(t.createAccount),
        backgroundColor: Colors.white,
        foregroundColor: AppTheme.primary500,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.neutral200),
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
                      Text(t.signingUpAs, style: const TextStyle(fontWeight: FontWeight.w600, color: AppTheme.neutral900)),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: RadioListTile<String>(
                              title: Text(t.customer),
                              value: 'customer',
                              groupValue: _role,
                              onChanged: (v) => setState(() => _role = v!),
                              activeColor: AppTheme.primary500,
                              contentPadding: EdgeInsets.zero,
                            ),
                          ),
                          Expanded(
                            child: RadioListTile<String>(
                              title: Text(t.employee),
                              value: 'employee',
                              groupValue: _role,
                              onChanged: (v) => setState(() => _role = v!),
                              activeColor: AppTheme.primary500,
                              contentPadding: EdgeInsets.zero,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      TextFormField(
                        controller: _name,
                        decoration: InputDecoration(labelText: t.name),
                        validator: (v) => v == null || v.isEmpty ? t.enterName : null,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _email,
                        keyboardType: TextInputType.emailAddress,
                        decoration: InputDecoration(labelText: t.email),
                        validator: (v) => v == null || v.isEmpty ? t.enterEmail : null,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _password,
                        obscureText: _obscurePassword,
                        decoration: InputDecoration(
                          labelText: t.password,
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscurePassword
                                  ? Icons.visibility_outlined
                                  : Icons.visibility_off_outlined,
                              color: AppTheme.neutral600,
                            ),
                            onPressed: () => setState(
                              () => _obscurePassword = !_obscurePassword,
                            ),
                            tooltip: _obscurePassword ? t.showPassword : t.hidePassword,
                          ),
                        ),
                        validator: (v) => v == null || v.length < 6 ? t.atLeast6Chars : null,
                      ),
                      if (_role == 'customer') ...[
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _phone,
                          keyboardType: TextInputType.phone,
                          decoration: InputDecoration(labelText: t.phoneOptional),
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _address,
                          decoration: InputDecoration(labelText: t.addressOptional),
                        ),
                      ],
                      if (auth.error != null) ...[
                        const SizedBox(height: 12),
                        Text(
                          auth.error!,
                          style: const TextStyle(color: AppTheme.error, fontSize: 13),
                        ),
                      ],
                      const SizedBox(height: 24),
                      SizedBox(
                        height: 52,
                        child: ElevatedButton(
                          onPressed: auth.isLoading ? null : _submit,
                          child: auth.isLoading
                              ? const SizedBox(
                                  height: 24,
                                  width: 24,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : Text(t.createAccount),
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
    );
  }
}
