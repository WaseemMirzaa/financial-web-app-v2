import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:permission_handler/permission_handler.dart';

import '../theme/app_theme.dart';

Future<PermissionResponse?> _handlePermissionRequest(
  InAppWebViewController controller,
  PermissionRequest request,
) async {
  final resources = request.resources;
  for (final r in resources) {
    final v = r.toValue();
    if (v == 'CAMERA') {
      final status = await Permission.camera.request();
      if (!status.isGranted) {
        return PermissionResponse(
          action: PermissionResponseAction.DENY,
          resources: resources,
        );
      }
    } else if (v == 'MICROPHONE') {
      final status = await Permission.microphone.request();
      if (!status.isGranted) {
        return PermissionResponse(
          action: PermissionResponseAction.DENY,
          resources: resources,
        );
      }
    } else if (v == 'CAMERA_AND_MICROPHONE') {
      final cam = await Permission.camera.request();
      final mic = await Permission.microphone.request();
      if (!cam.isGranted || !mic.isGranted) {
        return PermissionResponse(
          action: PermissionResponseAction.DENY,
          resources: resources,
        );
      }
    }
  }
  return PermissionResponse(
    action: PermissionResponseAction.GRANT,
    resources: resources,
  );
}

/// Full-screen WebView for external legal URLs (privacy, terms) with app bar back.
class LegalWebViewScreen extends StatelessWidget {
  const LegalWebViewScreen({
    super.key,
    required this.url,
    required this.title,
  });

  final String url;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(title),
        backgroundColor: AppTheme.primary500,
        foregroundColor: Colors.white,
      ),
      body: InAppWebView(
        initialUrlRequest: URLRequest(url: WebUri(url)),
        initialSettings: InAppWebViewSettings(
          javaScriptEnabled: true,
          domStorageEnabled: true,
          allowsInlineMediaPlayback: true,
          mediaPlaybackRequiresUserGesture: false,
        ),
        onPermissionRequest: _handlePermissionRequest,
      ),
    );
  }
}
