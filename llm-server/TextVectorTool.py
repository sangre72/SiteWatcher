import os
import glob
from typing import Any, List
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.schema import Document
from langchain_core.messages import HumanMessage
from langchain_core.tools import Tool


class TextVectorTool(Tool):
    retriever: Any  # 'Any'는 적절한 타입 힌트로 교체하세요.
    api_key: Any
    model_name: Any
    vector_store_path: Any

    def __init__(self, vector_store_path: str):
        super().__init__(name="search", func=self.process_data, description="search")
        self.api_key = os.environ.get('OPENAI_API_KEY')
        if not self.api_key:
            raise ValueError("API key for OpenAI is not set in environment variables.")
        self.model_name = "text-embedding-ada-002"  # OpenAI Embeddings 모델 이름
        self.vector_store_path = vector_store_path
        self.retriever = None
        self.load_vector_store()

    def process_data(self, x):
        return x

    def run(self, query_text: dict, vector_store_path:str, **kwargs) -> HumanMessage:
        if self.retriever is None:
            return HumanMessage(content="Vector store is not initialized.")

        if 'messages' in query_text:
            self.vector_store_path = vector_store_path
            self.load_vectorstore(self.vector_store_path)
            message_content = query_text['messages'][0].content  # 첫 메시지의 내용을 추출
            query_text = str(message_content)

            results = self.retriever.invoke(query_text) # .get_relevant_documents
            if results:
                return HumanMessage(content="\n\n".join([result.page_content for result in results]))
            else:
                return HumanMessage(content="No results found.")
        return HumanMessage(content="No results found.")

    def load_vectorstore(self, vector_store_path):
        if os.path.exists(vector_store_path):
            vector_store = FAISS.load_local(
                vector_store_path,
                OpenAIEmbeddings(api_key=self.api_key, model=self.model_name),
                allow_dangerous_deserialization=True  # 안전한 데이터 파일을 로드하는 경우에만 설정
            )
            self.retriever = vector_store.as_retriever(
                search_kwargs={'k': 50},
                retrieve_kwargs={'retrieve_all': True}
            )
            return vector_store

    def setup_vector_store(self, texts: List[str]):
        if os.path.exists(self.vector_store_path):
            self.load_vector_store()
            return
        embeddings = OpenAIEmbeddings(api_key=self.api_key, model=self.model_name, disallowed_special=())
        documents = [Document(page_content=text, metadata={"source": "local"}) for text in texts]
        vector_store = FAISS.from_documents(documents=documents, embedding=embeddings)
        self.retriever = vector_store.as_retriever(
            search_kwargs={'k': 50},
            retrieve_kwargs={'retrieve_all': True}
        )
        vector_store.save_local(self.vector_store_path)

    def load_vector_store(self):
        if os.path.exists(self.vector_store_path):
            vector_store = FAISS.load_local(
                self.vector_store_path,
                OpenAIEmbeddings(api_key=self.api_key, model=self.model_name),
                allow_dangerous_deserialization=True  # 안전한 데이터 파일을 로드하는 경우에만 설정
            )
            self.retriever = vector_store.as_retriever(
                search_kwargs={'k': 50},
                retrieve_kwargs={'retrieve_all': True}
            )

    def fetch_and_process(self, file_path: str) -> str:
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()


def read_files_from_directory(directory: str) -> List[str]:
    excluded_dirs = {'.git', 'node_modules', 'temp'}
    file_list = []

    for root, dirs, files in os.walk(directory):
        # 제외할 디렉토리를 제거
        dirs[:] = [d for d in dirs if d not in excluded_dirs]
        for file in files:
            if file.endswith(('.js', '.tsx', '.ts', '.css', '.html')):
                #print(root, file)
                file_list.append(os.path.join(root, file))

    file_contents = []
    for file_path in file_list:
        if os.path.isfile(file_path):  # 파일인지 확인
            with open(file_path, 'r', encoding='utf-8') as file:
                file_contents.append(file.read())
    return file_contents


def load_files_to_db(directory: str, db_tool: TextVectorTool):
    file_contents = read_files_from_directory(directory)
    db_tool.setup_vector_store(file_contents)


# 지정된 디렉토리의 파일을 데이터베이스로 로드
directory_to_read = '/Users/bumsuklee/PhpstormProjects/20240418-git-test-prototype-cms/frontend/src'  # 여기에 지정된 디렉토리 경로를 입력하세요
db_directory = './database/middle'  # 벡터화된 파일을 저장할 디렉토리
os.makedirs(db_directory, exist_ok=True)  # 디렉토리 존재 여부 확인 및 생성
vector_store_path = os.path.join(db_directory, "vector_store.faiss")  # 벡터 데이터베이스 파일 경로
db_tool = TextVectorTool(vector_store_path=vector_store_path)

# 파일 내용을 벡터 데이터베이스로 로드
load_files_to_db(directory_to_read, db_tool)

# 예제 검색 질의 실행
#query_text = {"messages": [HumanMessage(content="RecoilRoot 검색")]}
#results = db_tool.run(query_text)
#print(results.content)
