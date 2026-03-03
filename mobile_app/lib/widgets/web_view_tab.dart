import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

import '../config.dart';

class WebViewTab extends StatefulWidget {
  final String path;
  final String? userId;
  final VoidCallback? onWebLogout;

  const WebViewTab({
    super.key,
    required this.path,
    this.userId,
    this.onWebLogout,
  });

  @override
  State<WebViewTab> createState() => _WebViewTabState();
}

class _WebViewTabState extends State<WebViewTab> {
  InAppWebViewController? _controller;
  bool _loading = true;

  String get _url {
    final base = kBaseUrl.endsWith('/') ? kBaseUrl : kBaseUrl;
    final path = widget.path.startsWith('/') ? widget.path : '/${widget.path}';
    final sep = base.endsWith('/') ? '' : path.startsWith('/') ? '' : '/';
    var u = '$base$sep$path';
    if (widget.userId != null) {
      u += u.contains('?') ? '&' : '?';
      u += 'userId=${Uri.encodeComponent(widget.userId!)}';
    }
    u += u.contains('?') ? '&' : '?';
    u += 'flutter_app=1';
    return u;
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        InAppWebView(
          initialUrlRequest: URLRequest(url: WebUri(_url)),
          initialSettings: InAppWebViewSettings(
            javaScriptEnabled: true,
            domStorageEnabled: true,
          ),
          onWebViewCreated: (c) {
            _controller = c;
            c.addJavaScriptHandler(
              handlerName: 'flutterLogout',
              callback: (_) {
                widget.onWebLogout?.call();
              },
            );
          },
          onLoadStop: (_, __) async {
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
              })();
            ''');
            if (mounted) setState(() => _loading = false);
          },
        ),
        if (_loading)
          const Center(child: CircularProgressIndicator()),
      ],
    );
  }
}
