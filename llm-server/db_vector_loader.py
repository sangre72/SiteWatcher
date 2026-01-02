import json

import mysql.connector
import os

from langchain_core.tools import create_retriever_tool
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS

# 환경 변수에서 OpenAI API 키를 불러옵니다.
api_key = os.environ['OPENAI_API_KEY']

# 데이터베이스 연결 설정
connection = mysql.connector.connect(
    host='localhost',
    user='dbuser',
    password='dbuser',
    database='egov'
)

# 처리하고 싶은 테이블 목록을 배열로 지정
tables_to_process = ['lettccmmndetailcode', 'lettnmenuinfo']

def fetch_data_with_metadata(table_name):
    cursor = connection.cursor(dictionary=True)
    cursor.execute(f"SHOW FULL COLUMNS FROM {table_name}")
    columns_info = cursor.fetchall()

    # 테이블의 전체 레코드 수 가져오기
    cursor.execute(f"SELECT count(*) FROM {table_name}")
    count_row = cursor.fetchone()  # 첫 번째 행의 결과를 가져옴
    print("Total rows count:", count_row['count(*)'])

    # 테이블의 전체 데이터 가져오기
    cursor.execute(f"SELECT * FROM {table_name}")
    data_rows = cursor.fetchall()

    return columns_info, data_rows

def process_data_for_vectorization(columns_info, data_rows):
    combined_texts = []
    for row in data_rows:
        text_pieces = [
            f"{col['Field']} ({col['Type']}, {col['Comment']}) : {row[col['Field']]}"
            for col in columns_info if col['Field'] in row
        ]
        combined_text = " | ".join(text_pieces)
        combined_texts.append(combined_text)
    return combined_texts

#https://wikidocs.net/234016
#https://wikidocs.net/231600 : MMR(Maximal Marginal Relevance) 검색 (1)
def create_vector_store(texts):
    embeddings = OpenAIEmbeddings(api_key=api_key)
    vector_store = FAISS.from_texts(texts=texts, embedding=embeddings)

    # 검색기능을 제공하는 객체 반환
    retriever = vector_store.as_retriever(
        search_kwargs={'k': 200},  # 예: 200개의 가장 관련성 높은 항목 검색
        retrieve_kwargs={'retrieve_all': True}
    )
    return retriever

def search_and_retrieve_all(retriever, query_text):
    # 검색 쿼리 실행
    results = retriever.retrieve(query_text)
    return results

# 각 테이블에 대해 데이터 추출, 처리 및 벡터 저장소 생성
for table in tables_to_process:
    columns_info, data_rows = fetch_data_with_metadata(table)
    processed_texts = process_data_for_vectorization(columns_info, data_rows)
   # print(data_rows)
    db_retriever = create_vector_store(processed_texts)

    print(f"벡터 저장소 for {table} 생성 완료")

connection.close()
print("Database vector store created successfully")

