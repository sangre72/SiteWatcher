import os

from langchain.tools.retriever import create_retriever_tool

# TAVILY API KEY를 기입합니다.
# os.environ["TAVILY_API_KEY"] = "TAVILY API KEY 입력"
# 디버깅을 위한 프로젝트명을 기입합니다.
os.environ["LANGCHAIN_PROJECT"] = "AGENT TUTORIAL"
# API KEY를 환경변수로 관리하기 위한 설정 파일
# TavilySearchResults 클래스를 langchain_community.tools.tavily_search 모듈에서 가져옵니다.
# TavilySearchResults 클래스의 인스턴스를 생성합니다
from langchain_community.tools.tavily_search import TavilySearchResults
# k=5은 검색 결과를 5개까지 가져오겠다는 의미입니다
TAVILY_API_KEY = os.environ["TAVILY_API_KEY"]

search = TavilySearchResults(k=10)

search_retriever = create_retriever_tool(
    search,
    name="TavilySearch",
    description="전자정부 프레임워크 문서!",
)


# 검색 결과를 가져옵니다.
#search_result  = search.invoke("판교 카카오 프렌즈샵 아지트점의 전화번호는 무엇인가요?")
#print( search_result )