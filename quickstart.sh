#!/usr/bin/env bash
# ============================================
# TRON FUSION PRIVATE CHAIN STARTUP SCRIPT
# Kryptoken Technology Inc. - KryptoFusion MainNet
# ============================================

ROOT_DIR="/home/kryptoken/tron-fusion-quickstart"
CONF_DIR="$ROOT_DIR/conf"
FULLNODE_JAR="$CONF_DIR/FullNode.jar"
BLOCKPARSER_JAR="$CONF_DIR/BlockParser.jar"
EVENTRON_DIR="$CONF_DIR/eventron"
FULL_CONF="$CONF_DIR/full.conf"
LOG_DIR="$ROOT_DIR/logs"

# -------------------------------
# Fail-safe Setup
# -------------------------------
echo "Initializing directories and environment..."

mkdir -p "$LOG_DIR" "$CONF_DIR/database" "$CONF_DIR/index" >/dev/null 2>&1

# Check for required files
[[ ! -f "$FULLNODE_JAR" ]] && echo "Error: Missing FullNode.jar in $CONF_DIR" && exit 1
[[ ! -f "$BLOCKPARSER_JAR" ]] && echo "Error: Missing BlockParser.jar in $CONF_DIR" && exit 1
[[ ! -f "$FULL_CONF" ]] && echo "Error: Missing full.conf in $CONF_DIR" && exit 1
[[ ! -d "$EVENTRON_DIR" ]] && echo "Warning: eventron directory not found, skipping eventron startup."

# -------------------------------
# Pre-Approval Script
# -------------------------------
if [[ -f "$ROOT_DIR/pre-approve.sh" ]]; then
  echo "Running pre-approve.sh..."
  bash "$ROOT_DIR/pre-approve.sh"
else
  echo "Warning: pre-approve.sh not found at $ROOT_DIR, skipping..."
fi

# -------------------------------
# Redis Startup
# -------------------------------
echo "Starting Redis server..."
nohup redis-server > "$LOG_DIR/redis.log" 2>&1 &
sleep 2

# -------------------------------
# FullNode Startup
# -------------------------------
echo "Starting FullNode..."
cd "$CONF_DIR" || exit
nohup java -jar "$FULLNODE_JAR" -c "$FULL_CONF" --witness > "$LOG_DIR/fullnode.log" 2>&1 &
sleep 5

# -------------------------------
# Eventron Startup
# -------------------------------
if [[ -d "$EVENTRON_DIR" ]]; then
  echo "Starting eventron..."
  cd "$EVENTRON_DIR" || exit
  SECRET="TMCTYG7EQkUkrrTy1fso47YKpnkPbuawMW" \
  REDISDBID=0 \
  REDISHOSTM=127.0.0.1 \
  REDISHOST=127.0.0.1 \
  REDISPORT=6379 \
  NODE_ENV=production \
  ONLY_REDIS=yes \
  SHASTAURL=http://127.0.0.1:18190 \
  PRIVATE_NETWORK=yes pm2 start process.json
else
  echo "Skipping eventron (not found)..."
fi

# -------------------------------
# BlockParser Startup
# -------------------------------
if [[ -f "$BLOCKPARSER_JAR" ]]; then
  echo "Starting BlockParser..."
  cd "$CONF_DIR" || exit
  nohup java -jar "$BLOCKPARSER_JAR" > "$LOG_DIR/blockparser.log" 2>&1 &
else
  echo "Skipping BlockParser (not found)..."
fi

# -------------------------------
# DApp HTTP Proxy
# -------------------------------
echo "Starting HTTP proxy for dApps..."
if [[ -f "$ROOT_DIR/scripts/accounts-generation.sh" ]]; then
  nohup "$ROOT_DIR/scripts/accounts-generation.sh" > "$LOG_DIR/accounts.log" 2>&1 &
else
  echo "Warning: accounts-generation.sh not found. Skipping..."
fi

# -------------------------------
# Final Node App (Optional)
# -------------------------------
if [[ -f "$ROOT_DIR/app/version" ]]; then
  echo "Running app/version..."
  node "$ROOT_DIR/app/version"
fi

echo "============================================"
echo " Tron Fusion Private Chain - Startup Complete"
echo " Logs: $LOG_DIR"
echo "============================================"

