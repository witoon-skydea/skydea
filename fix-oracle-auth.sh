#!/bin/bash

# Fix Oracle Auth Deployment Script
echo "Starting fix deployment to Oracle Cloud..."

# SSH command with proper configuration
SSH_KEY="/Users/witoonpongsilathong/MCP_folder/oracle_mm_config/ssh-key-2025-04-03.key"
SSH_USER="ubuntu"
SERVER_IP="140.245.58.185"

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
  echo "Error: SSH key not found at $SSH_KEY"
  exit 1
fi

# Deploy the fix
echo "Pulling latest changes from GitHub..."
ssh -i "$SSH_KEY" "$SSH_USER@$SERVER_IP" "cd /home/ubuntu/skydea && git pull"

# Restart the service
echo "Restarting the Skydea service..."
ssh -i "$SSH_KEY" "$SSH_USER@$SERVER_IP" "sudo systemctl restart skydea"

echo "Fix deployment completed!"
echo "You can now test the shared trip view at http://$SERVER_IP/trips/1/planner?share=xVWyzF5r2i"