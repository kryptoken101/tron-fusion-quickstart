# Tron Fusion Quickstart

A lightweight and configurable **Tron private network** environment with **fullnode**, **soliditynode**, and **RPC endpoint** setup — designed for the **Tron Fusion Project** by **Kryptoken Technology Inc.**

---

## 🚀 Overview

**Tron Fusion Quickstart** provides a pre-configured environment for deploying and testing Tron-based decentralized applications (DApps).  
It simplifies local blockchain setup, enables node synchronization, and allows seamless integration with external RPC endpoints such as **GetBlock** or cloud proxies like **Render**.

This project serves as the core runtime for **Tron Fusion**, the decentralized node layer bridging Kryptoken’s ecosystem with the Tron blockchain.

---

## 🧩 Features

- 🔗 Private Tron network setup (Fullnode + Soliditynode)
- ⚙️ Configurable network settings via `/conf/full.conf`
- 📡 RPC and Event Server support
- 🧰 Docker-ready for quick deployment
- ☁️ Integrates with **Render Web Service** to expose or proxy the RPC endpoint publicly
- 🧠 Compatible with **GetBlock RPC**, **TronGrid**, and other API services
- 🧩 Designed for the **KryptoUnited Ecosystem**

---

## 🐳 Quickstart with Docker

```bash
docker run -it \
  -p 9090:50051 \
  -v /home/kryptoken/tron-fusion-quickstart/conf:/tron/app/conf \
  --rm \
  --name tron-fusion \
  -e accounts=3 \
  -e NETWORK_TYPE=private \
  trontools/quickstart

