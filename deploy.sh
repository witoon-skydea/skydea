#!/bin/bash

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment process for Skydea...${NC}"

# Check if oc.txt exists
if [ ! -f "/Users/witoonpongsilathong/MCP_folder/mm_dev_mode/oc.txt" ]; then
    echo -e "${RED}Error: oc.txt not found in the specified path.${NC}"
    exit 1
fi

# Read Oracle Cloud information from oc.txt
echo -e "${YELLOW}Reading Oracle Cloud information...${NC}"
source "/Users/witoonpongsilathong/MCP_folder/mm_dev_mode/oc.txt"

# Check if GitHub repository exists
echo -e "${YELLOW}Checking GitHub repository...${NC}"
if [ -z "$(git remote -v 2>/dev/null)" ]; then
    echo -e "${YELLOW}No remote repository found. Setting up GitHub repository...${NC}"
    
    # Create GitHub repository using GitHub CLI if installed
    if command -v gh &> /dev/null; then
        echo -e "${YELLOW}Creating GitHub repository using GitHub CLI...${NC}"
        gh repo create skydea --public --source=. || {
            echo -e "${RED}Failed to create GitHub repository using GitHub CLI.${NC}"
            exit 1
        }
    else
        echo -e "${RED}GitHub CLI not found. Please manually create and set up a repository.${NC}"
        exit 1
    fi
fi

# Push code to GitHub
echo -e "${YELLOW}Pushing code to GitHub...${NC}"
git add .
git commit -m "Deployment update $(date '+%Y-%m-%d %H:%M:%S')"
git push -u origin main || {
    echo -e "${RED}Failed to push code to GitHub.${NC}"
    exit 1
}

# Deploy to Oracle Cloud
echo -e "${YELLOW}Deploying to Oracle Cloud...${NC}"
echo -e "${YELLOW}Please follow the deployment procedures in oc.txt manually.${NC}"
echo -e "${GREEN}Deployment preparation completed!${NC}"

exit 0