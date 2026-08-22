#!/usr/bin/env bash
# ============================================================
#  PubVibe Stack – First-time setup script
#  Run: bash scripts/setup.sh
# ============================================================
set -e

BOLD="\033[1m"
GREEN="\033[0;32m"
CYAN="\033[0;36m"
YELLOW="\033[1;33m"
RESET="\033[0m"

echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${CYAN}║   PubVibe Prebid Stack – Setup           ║${RESET}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════╝${RESET}"

# 1. Check .env
if [ ! -f .env ]; then
  cp .env .env.bak 2>/dev/null || true
  echo -e "${YELLOW}⚠  .env not found. Creating from template…${RESET}"
  cat > .env <<EOF
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
ADMIN_DOMAIN=admin.pubvibe.com
PUBLISHER_DOMAIN=pub.pubvibe.com
EOF
  echo -e "${GREEN}✓  .env created with random JWT secrets${RESET}"
else
  echo -e "${GREEN}✓  .env already exists${RESET}"
fi

# 2. Create nginx certs directory
mkdir -p nginx/certs
echo -e "${GREEN}✓  nginx/certs directory ready${RESET}"

# 3. Build & start containers
echo -e "\n${BOLD}Building and starting containers…${RESET}"
docker-compose pull --ignore-pull-failures 2>/dev/null || true
docker-compose build --parallel
docker-compose up -d

# 4. Wait for backend to be healthy
echo -e "\n${BOLD}Waiting for backend API to be ready…${RESET}"
for i in $(seq 1 30); do
  if curl -sf http://localhost:4000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓  Backend is healthy${RESET}"
    break
  fi
  echo -n "."
  sleep 3
done

# 5. Seed superadmin
echo -e "\n${BOLD}Seeding superadmin account…${RESET}"
docker-compose exec backend node src/services/seedAdmin.js

echo -e "\n${BOLD}${GREEN}══════════════════════════════════════════${RESET}"
echo -e "${BOLD}${GREEN}  Setup complete!${RESET}"
echo -e "${BOLD}${GREEN}══════════════════════════════════════════${RESET}"
echo -e ""
echo -e "  ${BOLD}Admin Panel:${RESET}        http://localhost:80  (or http://admin.pubvibe.com)"
echo -e "  ${BOLD}Publisher Portal:${RESET}   http://pub.pubvibe.com"
echo -e "  ${BOLD}Prebid Server:${RESET}      http://localhost:8000"
echo -e "  ${BOLD}API:${RESET}                http://localhost:4000"
echo -e ""
echo -e "  ${BOLD}Default admin login:${RESET}"
echo -e "    Email:    admin@pubvibe.com"
echo -e "    Password: Admin@12345"
echo -e ""
echo -e "  ${YELLOW}⚠  Change the admin password immediately after first login!${RESET}"
echo -e ""
