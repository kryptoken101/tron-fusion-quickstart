#!/usr/bin/env bash
set -e

# ---------------------------------------------------
# Kryptoken Tron Fusion - Pre-Approval Preparation
# ---------------------------------------------------

ROOT_DIR="/home/kryptoken/tron-fusion-quickstart"
CONF_DIR="$ROOT_DIR/conf"
LOG_DIR="$ROOT_DIR/logs"

FULL_CONF="$CONF_DIR/full.conf"
FULLNODE_JAR="$CONF_DIR/FullNode.jar"
BLOCKPARSER_JAR="$CONF_DIR/BlockParser.jar"
EVENTRON_DIR="$CONF_DIR/eventron"

mkdir -p "$LOG_DIR" "$CONF_DIR/database" "$CONF_DIR/index" >/dev/null 2>&1

echo "---------------------------------------------------"
echo "[🔍] Tron Fusion Pre-Approval Script Started..."
echo "---------------------------------------------------"

# --- Verify core files ---
if [[ ! -f "$FULL_CONF" ]]; then
  echo "[✗] Missing: $FULL_CONF"
  echo "    → Please place your full.conf in $CONF_DIR"
  exit 1
else
  echo "[✓] Found configuration file: full.conf"
fi

if [[ ! -f "$FULLNODE_JAR" ]]; then
  echo "[✗] Missing: FullNode.jar"
  echo "    → Ensure FullNode.jar is located in $CONF_DIR"
  exit 1
else
  echo "[✓] Found: FullNode.jar"
fi

if [[ ! -f "$BLOCKPARSER_JAR" ]]; then
  echo "[⚠️] Warning: BlockParser.jar not found — skipping..."
else
  echo "[✓] Found: BlockParser.jar"
fi

if [[ ! -d "$EVENTRON_DIR" ]]; then
  echo "[⚠️] Warning: Eventron directory not found — skipping..."
else
  echo "[✓] Found Eventron directory"
fi

# --- Ensure redis is installed ---
if ! command -v redis-server >/dev/null 2>&1; then
  echo "[!] Redis not found, installing..."
  sudo apt-get update -y && sudo apt-get install redis-server -y
else
  echo "[✓] Redis already installed"
fi

# --- Verify Java runtime ---
if ! command -v java >/dev/null 2>&1; then
  echo "[!] Java not found, installing OpenJDK 17..."
  sudo apt-get update -y && sudo apt-get install openjdk-17-jre -y
else
  echo "[✓] Java runtime detected: $(java -version 2>&1 | head -n 1)"
fi

# --- Create placeholder logs ---
touch "$LOG_DIR/fullnode.log" "$LOG_DIR/blockparser.log" "$LOG_DIR/redis.log" >/dev/null 2>&1

# --- Create genesis seed if not present ---
GENESIS_FILE="$CONF_DIR/genesis.json"
if [[ ! -f "$GENESIS_FILE" ]]; then
  echo "[⚙️] No genesis.json found. Creating default genesis file..."
  cat <<EOF > "$GENESIS_FILE"
{
  "genesisTimestamp": "$(date +%s)",
  "chainId": "f

