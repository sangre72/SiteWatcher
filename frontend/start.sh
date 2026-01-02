#!/bin/bash
#
# Frontend 개발 서버 시작 스크립트
# React 애플리케이션 (PORT: 4000)
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Frontend 서버 시작${NC}"
echo -e "${GREEN}========================================${NC}"

# Node.js 버전 체크
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js가 설치되어 있지 않습니다.${NC}"
    echo "nvm install 18 으로 설치해주세요."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}Warning: Node.js 18+ 권장 (현재: v$NODE_VERSION)${NC}"
fi

echo -e "${GREEN}Node.js 버전:${NC} $(node -v)"
echo -e "${GREEN}npm 버전:${NC} $(npm -v)"

# node_modules 확인 및 설치
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}node_modules가 없습니다. npm install 실행 중...${NC}"
    npm install
elif [ "package.json" -nt "node_modules" ]; then
    echo -e "${YELLOW}package.json이 변경되었습니다. npm install 실행 중...${NC}"
    npm install
fi

# 환경 변수 파일 확인
if [ -f "../.env.local" ]; then
    echo -e "${GREEN}.env.local 파일 로드됨${NC}"
    export $(grep -v '^#' ../.env.local | xargs)
fi

echo ""
echo -e "${GREEN}서버 시작 중...${NC}"
echo -e "URL: ${GREEN}http://localhost:4000${NC}"
echo ""

# 개발 서버 시작
npm start
