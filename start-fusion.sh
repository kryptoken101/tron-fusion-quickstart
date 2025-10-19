#!/bin/bash

# start-fusion.sh
# -----------------
# Starts Tron Fusion node in Docker with correct volume mounts
# Exposes only RPC port and ensures accounts.json / fullnode.conf are loaded
# Provides JSON-RPC endpoint for GetBlock or local RPC clients

# Paths
HOST_CONF_DIR="/home/kryptoken/tron-fusion-quickstart/conf"
CONTAINER_CONF_DIR="/tron/app/conf"

# Check if config directory exists
if [ ! -d "$HOST_CONF_DIR" ]; then
  echo "Config folder not found: $HOST_CONF_DIR"
  exit 1
fi

# Check if accounts.json exists, warn if missing
if [ ! -f "$HOST_CONF_DIR/accounts.json" ]; then
  echo "Warning: accounts.json not found in $HOST_CONF_DIR. Node.js backend will generate dynamically."
fi

# Check if fullnode.conf exists, warn if missing
if [ ! -f "$HOST_CONF_DIR/fullnode.conf" ]; then
  echo "Warning: fullnode.conf not found in $HOST_CONF_DIR. FullNode will use default settings."
fi

# Run Docker container & mount config
docker run -it \
  -p 9090:9090 \
  -v /home/kryptoken/tron-fusion-quickstart/conf:/tron/app/conf \
  --rm \
  --name tron \
  -e accounts=3 \
  -e NETWORK_TYPE=private \
  trontools/quickstart

