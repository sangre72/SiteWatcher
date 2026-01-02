#!/bin/bash
#
# LLM Server 시작 스크립트
# Python Flask/FastAPI ML 서버 (PORT: 5000)
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  LLM Server 시작${NC}"
echo -e "${GREEN}========================================${NC}"

# Python 버전 체크
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python3가 설치되어 있지 않습니다.${NC}"
    echo "pyenv install 3.11.9 으로 설치해주세요."
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo -e "${GREEN}Python 버전:${NC} $PYTHON_VERSION"

# 가상환경 확인 및 활성화
VENV_DIR="venv"
if [ ! -d "$VENV_DIR" ]; then
    echo -e "${YELLOW}가상환경이 없습니다. 생성 중...${NC}"
    python3 -m venv $VENV_DIR
fi

# 가상환경 활성화
echo -e "${GREEN}가상환경 활성화...${NC}"
source $VENV_DIR/bin/activate

# pip 업그레이드
pip install --upgrade pip -q

# 의존성 설치 확인
if [ ! -f "$VENV_DIR/.installed" ] || [ "requirements.txt" -nt "$VENV_DIR/.installed" ]; then
    echo -e "${YELLOW}의존성 설치 중... (시간이 걸릴 수 있습니다)${NC}"
    pip install -r requirements.txt
    touch "$VENV_DIR/.installed"
else
    echo -e "${GREEN}의존성이 이미 설치되어 있습니다.${NC}"
fi

# 환경 변수 파일 확인
if [ -f "../.env.local" ]; then
    echo -e "${GREEN}.env.local 파일 로드됨${NC}"
    export $(grep -v '^#' ../.env.local | xargs)
fi

# 필수 환경 변수 확인
if [ -z "$OPENAI_API_KEY" ]; then
    echo -e "${YELLOW}Warning: OPENAI_API_KEY가 설정되지 않았습니다.${NC}"
fi

if [ -z "$HF_TOKEN" ]; then
    echo -e "${YELLOW}Warning: HF_TOKEN이 설정되지 않았습니다.${NC}"
    echo "Hugging Face 모델 다운로드가 제한될 수 있습니다."
fi

# GPU 확인
echo ""
echo -e "${BLUE}GPU 상태 확인...${NC}"
python3 -c "import torch; print(f'CUDA 사용 가능: {torch.cuda.is_available()}'); print(f'MPS 사용 가능: {torch.backends.mps.is_available()}') if hasattr(torch.backends, 'mps') else None" 2>/dev/null || echo "PyTorch GPU 정보를 확인할 수 없습니다."

echo ""
echo -e "${GREEN}서버 시작 중...${NC}"
echo -e "메인 서버 URL: ${GREEN}http://localhost:5000${NC}"
echo ""

# 서버 선택
case "$1" in
    --pdf)
        echo -e "${YELLOW}PDF 분석 서버를 시작합니다...${NC}"
        cd llm_server/pdf_analysis
        python3 server.py
        ;;
    --all)
        echo -e "${YELLOW}모든 서버를 시작합니다 (백그라운드)...${NC}"
        python3 llm_server/server.py &
        PID1=$!
        echo "메인 서버 PID: $PID1"

        cd llm_server/pdf_analysis
        python3 server.py &
        PID2=$!
        echo "PDF 서버 PID: $PID2"

        echo ""
        echo -e "${GREEN}서버가 시작되었습니다. 종료하려면 Ctrl+C${NC}"
        wait
        ;;
    *)
        python3 llm_server/server.py
        ;;
esac
