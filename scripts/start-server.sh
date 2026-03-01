#!/bin/bash
# PM2 start script: custom server ensures handler is ready before accepting connections
cd "$(dirname "$0")/.."
exec node server.js
