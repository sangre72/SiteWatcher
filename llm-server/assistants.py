import asyncio
import logging
import os
from typing import List

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import openai
from PyPDF2 import PdfReader
from langchain.agents.openai_assistant import OpenAIAssistantRunnable
from langchain.text_splitter import CharacterTextSplitter
from langchain_core.callbacks import CallbackManagerForRetrieverRun
from langchain_core.documents import Document
from langchain_core.vectorstores import VectorStoreRetriever
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationalRetrievalChain
from langchain_openai import ChatOpenAI
from openai import OpenAI
from openai.types.beta.threads import TextContentBlock
from pydantic import BaseModel

# FAISS에서 AVX2 최적화를 사용하지 않으려면 다음 줄의 주석을 해제하세요.
# import os
#
# os.environ['FAISS_NO_AVX2'] = '1'

# 환경변수 로드 및 API 키 설정
load_dotenv()
api_key = os.getenv('OPENAI_API_KEY')
client = OpenAI(api_key=api_key)

urls = [
    "https://news.naver.com/section/100",
    "https://news.naver.com/section/101",
    "https://news.naver.com/section/102",
    "https://news.naver.com/section/103",
    "https://news.naver.com/section/104"
]


tools_config = [
    {"name": "code_interpreter", "type": "code_interpreter"},  # 코드 해석 및 실행
    {"name": "text_search", "type": "text_search", "config": {"index_name": "your_index"}}  # 텍스트 검색
]

def read_pdf_files(file_paths):
    text = ""
    for file_path in file_paths:
        with open(file_path, 'rb') as file:
            reader = PdfReader(file)
            for page in reader.pages:
                text += page.extract_text() or ""
    return text

def get_text_chunks(text):
    text_splitter = CharacterTextSplitter(
        separator="\n",
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    return text_splitter.split_text(text)


embeddings = OpenAIEmbeddings(api_key=api_key)

def get_vectorstore(text_chunks):
    vectorstore = FAISS.from_texts(texts=text_chunks, embedding=embeddings)
    return vectorstore

def get_conversation_chain(vectorstore):
    llm = ChatOpenAI(api_key=api_key)
    memory = ConversationBufferMemory(memory_key='chat_history', return_messages=True)
    #retriever = MyVectorStoreRetriever(vectorstore=vectorstore)

    return ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=vectorstore.as_retriever(),
        memory=memory,
    )


# Assistant를 조회
agent = client.beta.assistants.retrieve(assistant_id=os.getenv("ASSISTANT_ID4"))
print("Retrieved Assistant:", agent)


thread = client.beta.threads.create()


def ask_openai(question):
    client = OpenAI(api_key=api_key)
    message = client.beta.threads.messages.create(
        thread_id=thread.id,
        role="user",
        content=question
    )

    run = client.beta.threads.runs.create(
        thread_id=thread.id,
        assistant_id=agent.id,
        instructions="사용자를 Jane Doe라고 부르세요. 사용자는 프리미엄 계정을 가지고 있습니다."
    )

    # 실행 상태 확인
    while True:
        # 실행 상태를 업데이트하거나 확인하기 위한 올바른 메서드 사용
        updated_run = client.beta.threads.runs.retrieve(run_id=run.id,thread_id=thread.id)
        if updated_run.status in ["completed", "failed"]:
            break

    # 완료된 스레드에서 메시지들을 가져옴
    messages = client.beta.threads.messages.list(
        thread_id=thread.id
    )

    s = extract_and_print_messages(messages)
    return s

async def ask_openai_study(question, langchain_response):
    message = client.beta.threads.messages.create(
        thread_id=thread.id,
        role="user",
        content = "질문은 : [[" + question + "]], 응답은 이거야 :[[" + langchain_response +"]]"
    )

    run = client.beta.threads.runs.create(
        thread_id=thread.id,
        assistant_id=agent.id,
        instructions="사용자를 Jane Doe라고 부르세요. 사용자는 프리미엄 계정을 가지고 있습니다."
    )

    # 실행 상태 확인
    while True:
        # 실행 상태를 업데이트하거나 확인하기 위한 올바른 메서드 사용
        updated_run = client.beta.threads.runs.retrieve(run_id=run.id, thread_id=thread.id)
        if updated_run.status in ["completed", "failed"]:
            break


def extract_and_print_messages(messages):
    for message in messages.data:
        if message.role == "assistant" and message.content:
            for content_block in message.content:
                if isinstance(content_block, TextContentBlock):
                    # 답변 메시지에서 텍스트 콘텐츠 추출
                    print("Open AI Answer:", content_block.text.value)
                    return content_block.text.value
    print("No valid answer found in the messages.")
    return None


def extract_text_from_url(url):
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')

    # 스크립트와 스타일 시트 제거
    for script in soup(["script", "style"]):
        script.decompose()

    # 페이지 전체에서 텍스트 추출
    text = soup.get_text(separator=' ')

    # 줄바꿈 및 공백 정리
    lines = (line.strip() for line in text.splitlines())
    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
    text = ' '.join(chunk for chunk in chunks if chunk)

    return text

class MyVectorStoreRetriever(VectorStoreRetriever):
    # See https://github.com/langchain-ai/langchain/blob/61dd92f8215daef3d9cf1734b0d1f8c70c1571c3/libs/langchain/langchain/vectorstores/base.py#L500
    def _get_relevant_documents(self, query: str, *, run_manager: CallbackManagerForRetrieverRun) -> List[Document]:
        # 유사성 검색을 실행하고 결과를 가져옴
        docs_and_similarities = self.vectorstore.similarity_search_with_relevance_scores(
            query=query,  # 검색할 쿼리
            k=10,  # 상위 10개 문서를 가져옴
            score_threshold=0.66  # 유사성 점수가 0.5 이상인 문서만 반환
        )

        # 문서 메타데이터에 유사성 점수를 저장
        for doc, similarity in docs_and_similarities:
            doc.metadata["score"] = similarity  # 각 문서의 메타데이터에 점수 추가

        # 단순히 문서 객체 리스트를 반환
        docs = [doc for doc, _ in docs_and_similarities]
        return docs


async def main():
    pdf_file_paths = ["llm_server/doc_data/pdf/1.pdf"]  # Replace with actual file paths
    raw_text = read_pdf_files(pdf_file_paths)
    text_chunks = get_text_chunks(raw_text)
    vectorstore = get_vectorstore(text_chunks)
    conversation_chain = get_conversation_chain(vectorstore)

    while True:
        user_question = input("Ask a question about your documents: ")
        if user_question.lower() == 'exit':
            break

        last_message = conversation_chain({'question': user_question})['chat_history'][-1]
        # Retrieve information using LangChain's retrieval chain
        langchain_response = last_message.content
        print("last_message:", last_message)
        score = last_message.score if hasattr(last_message, 'score') else "No score available"  # 메시지 스코어

        print("conversation_chain : " + langchain_response)
        if "죄송" in langchain_response or "할 수 없습니다." in langchain_response or "I'm sorry for" in langchain_response:
            print("여기는 gpt 질문 한 것 : " + user_question)
            final_answer = ask_openai(user_question)
        else:
            print("여기는 자체 문의답")
            # 비동기적으로 실행하고 결과를 기다리지 않음
            #asyncio.create_task(ask_openai_study(user_question, langchain_response))
            final_answer = langchain_response
        print("최종 응답:", score, final_answer)

if __name__ == '__main__':
    asyncio.run(main())
