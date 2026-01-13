#!/bin/bash
cd /c/xampp/htdocs/perspectivas
git add style.css index.html
git config user.email "bot@perspectivas.py"
git config user.name "Perspectivas Bot"
git commit -m "🎬 Refactor: Mejora visual premium para sección Programa"
git push origin main
