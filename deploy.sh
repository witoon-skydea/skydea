#!/bin/bash

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment process for Skydea...${NC}"

# Check if oc.txt exists for reference
if [ ! -f "/Users/witoonpongsilathong/MCP_folder/mm_dev_mode/oc.txt" ]; then
    echo -e "${RED}Error: oc.txt not found in the specified path.${NC}"
    exit 1
fi

# Instead of sourcing oc.txt, just display deployment info
echo -e "${YELLOW}Oracle Cloud information is available in:${NC}"
echo -e "${YELLOW}/Users/witoonpongsilathong/MCP_folder/mm_dev_mode/oc.txt${NC}"

# Extract IP address from oc.txt (assuming it's in the format http://140.245.58.185)
SERVER_IP=$(grep -oE 'http://[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' "/Users/witoonpongsilathong/MCP_folder/mm_dev_mode/oc.txt" | head -1 | cut -d'/' -f3)
if [ -n "$SERVER_IP" ]; then
    echo -e "${GREEN}Found server IP: $SERVER_IP${NC}"
else
    echo -e "${YELLOW}Could not extract server IP from oc.txt${NC}"
    echo -e "${YELLOW}Please review the file manually for deployment information.${NC}"
fi

# Check if GitHub repository exists
echo -e "${YELLOW}Checking GitHub repository...${NC}"
if [ -z "$(git remote -v 2>/dev/null)" ]; then
    echo -e "${YELLOW}No remote repository found. Setting up GitHub repository...${NC}"
    
    # Prompt user for GitHub repository name
    echo -e "${YELLOW}Please enter GitHub repository name (default: skydea):${NC}"
    read -r REPO_NAME
    REPO_NAME=${REPO_NAME:-skydea}
    
    # Create GitHub repository using GitHub CLI if installed
    if command -v gh &> /dev/null; then
        echo -e "${YELLOW}Creating GitHub repository using GitHub CLI...${NC}"
        gh repo create "$REPO_NAME" --public --source=. || {
            echo -e "${RED}Failed to create GitHub repository using GitHub CLI.${NC}"
            echo -e "${YELLOW}Please manually create a repository and set it as remote.${NC}"
            echo -e "${YELLOW}Example: git remote add origin https://github.com/yourusername/$REPO_NAME.git${NC}"
            exit 1
        }
    else
        echo -e "${RED}GitHub CLI not found.${NC}"
        echo -e "${YELLOW}Please manually create a repository and set it as remote.${NC}"
        echo -e "${YELLOW}Example: git remote add origin https://github.com/yourusername/$REPO_NAME.git${NC}"
        exit 1
    fi
fi

# Push code to GitHub
echo -e "${YELLOW}Pushing code to GitHub...${NC}"
git add .
git commit -m "Deployment update $(date '+%Y-%m-%d %H:%M:%S')" || echo -e "${YELLOW}No changes to commit${NC}"
git push -u origin main || {
    echo -e "${RED}Failed to push code to GitHub.${NC}"
    echo -e "${YELLOW}Please check remote repository settings and try again.${NC}"
    exit 1
}

# Display deployment instructions
echo -e "\n${GREEN}===== DEPLOYMENT INSTRUCTIONS =====${NC}"
echo -e "${YELLOW}1. SSH into your Oracle Cloud instance:${NC}"
if [ -n "$SERVER_IP" ]; then
    echo -e "   ssh ubuntu@$SERVER_IP"
else
    echo -e "   See oc.txt for SSH connection details"
fi
echo -e "${YELLOW}2. Clone your GitHub repository:${NC}"
echo -e "   git clone https://github.com/yourusername/$(git remote get-url origin 2>/dev/null | sed 's/.*\/\([^/]*\)\.git/\1/')"
echo -e "${YELLOW}3. Navigate to the project directory and install dependencies:${NC}"
echo -e "   cd skydea && npm install"
echo -e "${YELLOW}4. Set up environment variables and start the application:${NC}"
echo -e "   export PORT=3000"
echo -e "   export APP_BASE_PATH=/skydea  # If using with sub-path"
echo -e "   export NODE_ENV=production"
echo -e "   npm start"
echo -e "${YELLOW}5. Consider using PM2 for production deployment:${NC}"
echo -e "   npm install -g pm2"
echo -e "   pm2 start src/server.js --name skydea"
echo -e "\n${GREEN}Deployment preparation completed!${NC}"

exit 0