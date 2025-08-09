#!/bin/bash

# RAGMon Cloud Foundry Deployment Script
# Builds locally and pushes JAR to CF (compatible with java_buildpack_offline)

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="ragmon"
MANIFEST_FILE="manifest.yml"

echo -e "${BLUE}🚀 RAGMon Cloud Foundry Deployment${NC}"
echo "=================================="

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check if cf CLI is installed
if ! command -v cf &> /dev/null; then
    echo -e "${RED}❌ Cloud Foundry CLI not found. Please install cf CLI first.${NC}"
    echo "   Download from: https://docs.cloudfoundry.org/cf-cli/install-go-cli.html"
    exit 1
fi

# Check if logged into CF
if ! cf target &> /dev/null; then
    echo -e "${RED}❌ Not logged into Cloud Foundry. Please run 'cf login' first.${NC}"
    exit 1
fi

# Check if manifest exists
if [ ! -f "$MANIFEST_FILE" ]; then
    echo -e "${RED}❌ Manifest file '$MANIFEST_FILE' not found.${NC}"
    echo "   Please copy manifest.yml.template to manifest.yml and configure it."
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Build locally to ensure a valid JVM artifact exists
echo -e "${YELLOW}Building project (backend + web)...${NC}"
echo "Running: ./mvnw -DskipTests -pl ragmon-api -am package"
./mvnw -DskipTests -pl ragmon-api -am package

echo -e "${GREEN}✅ Build completed successfully${NC}"

# Find the JAR
JAR_FILE=$(find ragmon-api/target -maxdepth 1 -type f -name "ragmon-api-*.jar" | head -1)
if [ -z "$JAR_FILE" ]; then
    echo -e "${RED}❌ Could not find built JAR in ragmon-api/target${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Using JAR: $JAR_FILE${NC}"

# Push the built JAR; manifest supplies env/services
echo -e "${YELLOW}Deploying JAR to Cloud Foundry...${NC}"
echo "Running: cf push $APP_NAME -f $MANIFEST_FILE -p $JAR_FILE"

if ! cf push "$APP_NAME" -f "$MANIFEST_FILE" -p "$JAR_FILE"; then
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Deployment completed successfully${NC}"

# Get app URL
APP_URL=$(cf app "$APP_NAME" --guid 2>/dev/null | xargs -I {} cf curl /v2/apps/{}/summary 2>/dev/null | grep -o '"urls":\[[^]]*\]' | grep -o '"[^"]*"' | head -1 | tr -d '"')

if [ -n "$APP_URL" ]; then
    echo -e "${GREEN}🌐 Application URL: https://$APP_URL${NC}"
    echo -e "${BLUE}📊 Dashboard: https://$APP_URL${NC}"
    echo -e "${BLUE}📚 Swagger UI: https://$APP_URL/swagger-ui.html${NC}"
    echo -e "${BLUE}🔍 Health Check: https://$APP_URL/actuator/health${NC}"
else
    echo -e "${YELLOW}⚠️  Could not determine app URL. Check with 'cf apps'${NC}"
fi

# Show app status
echo -e "${YELLOW}Checking app status...${NC}"
cf app "$APP_NAME"

echo -e "${GREEN}🎉 Deployment script completed!${NC}"
