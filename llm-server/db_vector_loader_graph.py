import os
from typing import Any

import mysql.connector
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage
from langchain_core.tools import Tool

class DatabaseVectorTool(Tool):
    retriever: Any  # 'Any'는 적절한 타입 힌트로 교체하세요.
    api_key: Any
    model_name: Any
    tables_to_process: Any

    def process_data(x):
        return x

    def __init__(self):
        super().__init__(name="search", func=self.process_data, description="search")
        self.api_key = os.environ['OPENAI_API_KEY']
        self.model_name = "text-embedding-3-small"
        self.tables_to_process = ['lettccmmndetailcode']
        self.retriever = self.setup_vector_store()


    def run(self, query_text, **kwargs):
        if isinstance(query_text, dict) and 'messages' in query_text:
            message_content = query_text['messages'][0].content  # 첫 메시지의 내용을 추출
            query_text = str(message_content)
            result = self.retriever.invoke(query_text)
            return HumanMessage(content=str(result[0].page_content))
        return HumanMessage(content="No results found.")


    def setup_vector_store(self):
        api_key = os.environ['OPENAI_API_KEY']
        model_name = "text-embedding-3-small"
        tables_to_process = ['lettccmmndetailcode']
        embeddings = OpenAIEmbeddings(api_key=api_key, model=model_name)
        combined_texts = []
        for table in tables_to_process:
            combined_texts.extend(self.fetch_and_process(table))

        vector_store = FAISS.from_texts(texts=combined_texts, embedding=embeddings)
        ret = vector_store.as_retriever(
            search_kwargs={'k': 50},
            retrieve_kwargs={'retrieve_all': True}
        )
        return ret


    def fetch_and_process(self, table):
        connection = mysql.connector.connect(
            host='localhost',
            user='dbuser',
            password='dbuser',
            database='egov'
        )

        cursor = connection.cursor(dictionary=True)
        cursor.execute(f"SHOW FULL COLUMNS FROM {table}")
        columns_info = cursor.fetchall()

        cursor.execute(f"SELECT * FROM {table}")
        data_rows = cursor.fetchall()

        combined_texts = [
            " | ".join(
                f"{col['Field']} ({col['Type']}, {col['Comment']}) : {row[col['Field']]}"
                for col in columns_info if col['Field'] in row
            ) for row in data_rows
        ]
        return combined_texts



# 예제 검색 질의 실행
#api_key = os.environ['OPENAI_API_KEY']
#db_tool = DatabaseVectorTool()
#query_text = {"messages": [HumanMessage(content="lettccmmndetailcode 테이블 데이터 조회")]}
#results = db_tool.run(query_text)
#print(results)