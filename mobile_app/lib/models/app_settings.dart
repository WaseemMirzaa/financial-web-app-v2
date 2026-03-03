class AppSettings {
  final bool forgetPasswordEnabled;
  final bool signupEnabled;
  final bool deleteAccountEnabled;

  const AppSettings({
    this.forgetPasswordEnabled = true,
    this.signupEnabled = false,
    this.deleteAccountEnabled = true,
  });

  factory AppSettings.fromJson(Map<String, dynamic> json) {
    return AppSettings(
      forgetPasswordEnabled: json['forgetPasswordEnabled'] == true,
      signupEnabled: json['signupEnabled'] == true,
      deleteAccountEnabled: json['deleteAccountEnabled'] == true,
    );
  }
}
