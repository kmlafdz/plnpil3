#!/bin/bash
# =====================================================================
# Launcher Strix AI Penetration Testing untuk Proyek PLN Corpu Level 3
# =====================================================================

export PATH="$HOME/.strix/bin:$PATH"

# Cek apakah LLM API Key sudah diset
if [ -z "$LLM_API_KEY" ] && [ -z "$GEMINI_API_KEY" ] && [ -z "$OPENAI_API_KEY" ] && [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "================================================================="
  echo "⚠️  PERINGATAN: Kunci API LLM belum ditemukan di Environment!"
  echo ""
  echo "Silakan export API key Anda terlebih dahulu, contoh:"
  echo "  export STRIX_LLM='google/gemini-2.5-pro'"
  echo "  export GEMINI_API_KEY='kunci_api_gemini_anda'"
  echo ""
  echo "Atau untuk OpenAI / Claude / OpenRouter:"
  echo "  export STRIX_LLM='openrouter/anthropic/claude-3.5-sonnet'"
  echo "  export LLM_API_KEY='sk-or-v1-...'"
  echo "================================================================="
  exit 1
fi

MODE=${1:-quick}
TARGET_DIR="/home/kemal/pln-corpu"

echo "🦉 Menjalankan Strix AI Pentesting Agent..."
echo "🎯 Target: $TARGET_DIR"
echo "⚙️ Mode: $MODE"
echo "📜 Panduan Instruksi: $TARGET_DIR/strix_instructions.md"
echo ""

strix --target "$TARGET_DIR" \
      --instruction-file "$TARGET_DIR/strix_instructions.md" \
      --scan-mode "$MODE"

