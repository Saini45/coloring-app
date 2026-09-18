#!/bin/bash
# Renames the brand from "Little Hands, Big Imagination" to "RangPankh"
# and switches every domain reference to rangpankh.co.in.
#
# Run from the project root:  bash rebrand.sh
# Safe to run twice — sed simply finds nothing the second time.

set -e

echo "Rebranding to RangPankh..."

# --- Hero heading on the homepage ---
sed -i 's|<h1 className="hero-title">Little Hands.<br/>Big Imagination.</h1>|<h1 className="hero-title">RangPankh</h1>|' app/page.tsx

# --- Story paragraph on the homepage ---
sed -i 's|That'"'"'s why we created Little Hands, Big Imagination—one simple place|That'"'"'s why we created RangPankh—one simple place|' app/page.tsx

# --- Page titles and social metadata ---
sed -i "s@title: 'Little Hands, Big Imagination @title: 'RangPankh @" app/layout.tsx
sed -i "s|siteName: 'Little Hands, Big Imagination'|siteName: 'RangPankh'|" app/layout.tsx

# --- Shop page title ---
sed -i "s|Little Hands, Big Imagination'|RangPankh'|" app/shop/page.tsx

# --- Header logo ---
sed -i 's|<span className="logo-text">Little Hands</span>|<span className="logo-text">RangPankh</span>|' components/Header.tsx

# --- Footer ---
sed -i 's|<h4>Little Hands, Big Imagination</h4>|<h4>RangPankh</h4>|' components/Footer.tsx
sed -i 's|© {currentYear} Little Hands, Big Imagination. All rights reserved.|© {currentYear} RangPankh. All rights reserved.|' components/Footer.tsx

# --- Email template ---
sed -i 's|<p>Little Hands, Big Imagination</p>|<p>RangPankh</p>|g' lib/email.js

# --- Package name ---
sed -i 's|"name": "little-hands-big-imagination"|"name": "rangpankh"|' package.json

# --- Every remaining domain reference, across all source files ---
# The old domain shows up in metadata URLs, email addresses and the env
# template. One pass catches them all, including any the lines above missed.
grep -rl "littlehandsbigimagination" \
  --include="*.tsx" --include="*.ts" --include="*.js" \
  --include="*.json" --include="*.md" --include="*.example" \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git \
  . 2>/dev/null | while read -r file; do
    sed -i 's|littlehandsbigimagination\.com|rangpankh.co.in|g' "$file"
    echo "  updated $file"
  done

echo ""
echo "Remaining references (should be none):"
grep -rn "Little Hands\|littlehandsbigimagination" \
  --include="*.tsx" --include="*.ts" --include="*.js" --include="*.json" \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git \
  . 2>/dev/null || echo "  (none)"

echo ""
echo "Done. Check the homepage and header before you commit."
