#!/bin/bash

# Fix Oracle Auth Deployment Script
echo "Starting fix deployment to Oracle Cloud..."

# SSH command with proper configuration
ssh_cmd="ssh -i ~/.ssh/id_rsa opc@140.245.58.185"

# Deploy the fix
echo "Pulling latest changes from GitHub..."
$ssh_cmd "cd /home/opc/skydea && git pull"

# Restart the service
echo "Restarting the Skydea service..."
$ssh_cmd "sudo systemctl restart skydea"

echo "Fix deployment completed!"
echo "You can now test the shared trip view at http://140.245.58.185/trips/1/planner?share=xVWyzF5r2i"
