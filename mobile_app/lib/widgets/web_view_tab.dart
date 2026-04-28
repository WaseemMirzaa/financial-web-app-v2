import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:permission_handler/permission_handler.dart';

import '../config.dart';

/// WebView needs camera/mic runtime grants before [onPermissionRequest] can GRANT (chat attachments).
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

class WebViewTab extends StatefulWidget {
  final String path;
  final String? userId;
  final VoidCallback? onWebLogout;
  final Map<String, dynamic>? userJson;
  final void Function(String locale)? onLocaleFromWeb;

  const WebViewTab({
    super.key,
    required this.path,
    this.userId,
    this.onWebLogout,
    this.userJson,
    this.onLocaleFromWeb,
  });

  @override
  State<WebViewTab> createState() => _WebViewTabState();
}

class _WebViewTabState extends State<WebViewTab> {
  InAppWebViewController? _controller;

  bool get _isAbsoluteHttpUrl {
    final p = widget.path;
    return p.startsWith('http://') || p.startsWith('https://');
  }

  String get _url {
    if (_isAbsoluteHttpUrl) return widget.path;
    final base = kBaseUrl.endsWith('/') ? kBaseUrl.substring(0, kBaseUrl.length - 1) : kBaseUrl;
    final path = widget.path.startsWith('/') ? widget.path : '/${widget.path}';
    final uri = Uri.parse('$base$path');
    final query = <String, String>{'flutter_app': '1'};
    if (widget.userId != null) query['userId'] = widget.userId!;
    return uri.replace(queryParameters: {...uri.queryParameters, ...query}).toString();
  }

  @override
  Widget build(BuildContext context) {
    return InAppWebView(
      initialUrlRequest: URLRequest(url: WebUri(_url)),
      initialSettings: InAppWebViewSettings(
        javaScriptEnabled: true,
        domStorageEnabled: true,
        allowsInlineMediaPlayback: true,
        mediaPlaybackRequiresUserGesture: false,
      ),
      onPermissionRequest: _handlePermissionRequest,
      onWebViewCreated: (c) {
        _controller = c;
        c.addJavaScriptHandler(
          handlerName: 'flutterLogout',
          callback: (_) {
            widget.onWebLogout?.call();
          },
        );
        c.addJavaScriptHandler(
          handlerName: 'flutterSetLocale',
          callback: (args) {
            final l = args.isNotEmpty ? args[0]?.toString() : null;
            if (l == 'en' || l == 'ar') widget.onLocaleFromWeb?.call(l!);
          },
        );
      },
      onLoadStop: (_, __) async {
        // Inject mobile user into web localStorage to share session with web app
        if (widget.userJson != null && !_isAbsoluteHttpUrl) {
          final userString = jsonEncode(widget.userJson);
          final escaped = userString
              .replaceAll(r'\', r'\\')
              .replaceAll("'", r"\'");

          await _controller?.evaluateJavascript(source: """
                (function() {
                  try {
                    var shouldSet = true;
                    if (window.localStorage) {
                      var existing = window.localStorage.getItem('user');
                      if (existing) {
                        try {
                          var ex = JSON.parse(existing);
                          if (ex && ex.id === ${jsonEncode(widget.userJson!['id'])}) {
                            shouldSet = false;
                          }
                        } catch(e) {}
                      }
                    }
                    if (shouldSet && window.localStorage) {
                      window.localStorage.setItem('user', '$escaped');
                      if (!window.__flutterSsoApplied) {
                        window.__flutterSsoApplied = true;
                        window.location.reload();
                      }
                    }
                  } catch(e) {}
                })();
              """);
        }

        await _controller?.evaluateJavascript(source: '''
              (function() {
                if (!window.FlutterAppBridge) {
                  window.FlutterAppBridge = {};
                }
                window.FlutterAppBridge.logout = function() {
                  if (window.flutter_inappwebview && window.flutter_inappwebview.callHandler) {
                    window.flutter_inappwebview.callHandler('flutterLogout');
                  }
                };
                window.FlutterAppBridge.setLocale = function(locale) {
                  if (window.flutter_inappwebview && window.flutter_inappwebview.callHandler) {
                    window.flutter_inappwebview.callHandler('flutterSetLocale', locale);
                  }
                };
              })();
            ''');
        if (widget.onLocaleFromWeb != null && !_isAbsoluteHttpUrl) {
          try {
            final result = await _controller?.evaluateJavascript(
              source: "(function(){ return window.localStorage.getItem('locale') || 'en'; })();",
            );
            final l = result?.toString().replaceAll(RegExp(r'^"|"$'), '');
            if (l != null && (l == 'en' || l == 'ar') && mounted) widget.onLocaleFromWeb!.call(l);
          } catch (_) {}
        }
      },
    );
  }
}
