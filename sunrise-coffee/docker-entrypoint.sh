#!/bin/sh
set -e

# Avvia nginx in background
nginx

# Avvia il backend Express in foreground (così Docker vede i log)
exec node server.js
