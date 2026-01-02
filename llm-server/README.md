1. 현재 디렉토리에서 가상환경을 만픔
python3 -m venv venv 

2. 가상환경 activation

2.1. linux
source venv/bin/activate 
2.2  windows
.\venv\Scripts\activate

3. 필수 항목 설치
pip3 install -r requirements.txt



기타 : Mac

pdfinfo 명령어를 찾을 수 없다는 것을 나타내고 있습니다. pdfinfo는 PDF 파일의 메타데이터를 추출하는 데 사용되는 명령행 도구이며, pdf2image 라이브러리가 PDF 파일을 처리할 때 내부적으로 사용합니다.



brew install poppler

conda install --file requirements.txt

pip install flask-core


brew install protobuf
brew install cmake
export PATH="/usr/local/bin:$PATH"  # Protobuf 경로 추가
