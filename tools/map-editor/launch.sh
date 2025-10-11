#!/bin/bash

# Restaurant Week Map Editor Launcher
echo "🍴 Starting Restaurant Week Map Editor..."
echo ""
echo "Opening map editor in your default browser..."
echo "If it doesn't open automatically, navigate to:"
echo "file://$(pwd)/index.html"
echo ""

# Try to open in the default browser
if command -v open &> /dev/null; then
    # macOS
    open index.html
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open index.html
elif command -v start &> /dev/null; then
    # Windows
    start index.html
else
    echo "Please manually open index.html in your web browser"
fi

echo ""
echo "📋 Quick Instructions:"
echo "1. Upload your restaurant Excel file"
echo "2. Drag markers to fix locations"
echo "3. Click restaurants to edit details"
echo "4. Export when finished"
echo ""
echo "📖 See README.md for detailed instructions"