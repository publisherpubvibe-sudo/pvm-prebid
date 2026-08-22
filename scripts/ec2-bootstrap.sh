#!/usr/bin/env bash
# ============================================================
#  EC2 Bootstrap Script – Run ONCE on fresh Ubuntu 22.04 EC2
#  
#  Usage:
#    chmod +x ec2-bootstrap.sh
#    sudo bash ec2-bootstrap.sh
# ============================================================
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  PubVibe EC2 Bootstrap"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. Update system ──────────────────────────────────────────
apt-get update -y
apt-get upgrade -y

# ── 2. Install Docker ─────────────────────────────────────────
apt-get install -y ca-certificates curl gnupg lsb-release

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# ── 3. Add ubuntu user to docker group ───────────────────────
usermod -aG docker ubuntu

# ── 4. Enable & start Docker ─────────────────────────────────
systemctl enable docker
systemctl start docker

# ── 5. Install git, wget ──────────────────────────────────────
apt-get install -y git wget

# ── 6. Create app directory ───────────────────────────────────
mkdir -p /home/ubuntu/pubvibe/nginx/certs
chown -R ubuntu:ubuntu /home/ubuntu/pubvibe

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ EC2 Bootstrap complete!"
echo ""
echo "  Docker version: $(docker --version)"
echo "  Docker Compose: $(docker compose version)"
echo ""
echo "  NEXT STEPS:"
echo "  1. Add GitHub Secrets (see README)"
echo "  2. Push to main branch → auto deploy triggers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
