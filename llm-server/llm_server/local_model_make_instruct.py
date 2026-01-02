import datetime
import sys
import torch
import pandas as pd
from langchain_community.llms.ctransformers import CTransformers
from sqlalchemy import create_engine, Column, String, ARRAY, JSON, Float, DateTime, MetaData, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import declarative_base, sessionmaker
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate

# 데이터베이스 설정
DB_CONNECTION = "postgresql://postgres:santape1@localhost:5432/db_vector"
Base = declarative_base()
engine = create_engine(DB_CONNECTION)
metadata = MetaData(schema="public")
Session = sessionmaker(bind=engine)
session = Session()


# SQLAlchemy 모델 정의
class SaleVector(Base):
    __tablename__ = 'sales_vectors'
    identifier = Column(String, primary_key=True)
    vector = Column(ARRAY(Float), nullable=False)
    meta_data = Column(JSONB)
    creation_date = Column(DateTime, default=datetime.datetime.utcnow)
    data_type = Column(String, nullable=False)


# 사전 정의된 쿼리 템플릿
query_templates = {
    "most_sold_car_by_region": """
        SELECT meta_data->>'region' AS region, meta_data->>'make' AS make, meta_data->>'model' AS model, COUNT(*) AS count
        FROM sales_vectors
        GROUP BY region, make, model
        ORDER BY count DESC
        LIMIT 1
    """,
    "total_sales_by_city": """
        SELECT meta_data->>'city' AS city, SUM((meta_data->>'price')::FLOAT) AS total_sales
        FROM sales_vectors
        GROUP BY city
        ORDER BY total_sales DESC
        LIMIT 12
    """
}


# 질문을 처리하고 적절한 쿼리를 선택하여 데이터베이스를 조회하는 함수
def process_question(question, llm_chain):
    try:
        # 질문에 맞는 쿼리 템플릿 선택
        prompt = f"Select the appropriate query template for the following question: {question}. Available templates: {list(query_templates.keys())}"
        selected_template_key = llm_chain.run({"question": prompt}).strip()

        if selected_template_key not in query_templates:
            raise ValueError(f"Selected query template '{selected_template_key}' is not valid.")

        sql_query = query_templates[selected_template_key]

        # 쿼리 결과 확인 및 출력
        print("Selected Query Template:", selected_template_key)
        print("Generated SQL Query:", sql_query)

        # 데이터베이스 조회
        result = session.execute(text(sql_query)).fetchall()
        result_df = pd.DataFrame(result)
        return result_df
    except Exception as e:
        print(f"Error processing question: {e}")
        sys.exit(1)


# 메인 함수
def main():
    #2. huggingface-cli download TheBloke/CodeLlama-7B-Python-GGUF codellama-7b-python.Q2_K.gguf --local-dir . --local-dir-use-symlinks False
    model_path = "/Users/bumsuklee/PhpstormProjects/20240418-git-test-prototype-cms/llm-server/llm_server/output/TheBloke_CodeLlama-7B-Python-GGUF/codellama-7b-python.Q2_K.gguf"

    device = torch.device(
        "cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu"
    )

    llm = CTransformers(model=model_path, model_type="llama", gpu_layers=50, device=device)
    prompt_template = PromptTemplate(
        template="Given the following question, provide a detailed analysis and generate a valid SQL query. Make sure the query uses the 'sales_vectors' table which has the columns: identifier, vector, meta_data, creation_date, and data_type. The question is: {question}",
        input_variables=["question"]
    )
    llm_chain = LLMChain(llm=llm, prompt=prompt_template)

    while True:
        question = input("Enter your question: ")
        if question.lower() in ['exit', 'quit']:
            break

        answer_df = process_question(question, llm_chain)
        if not answer_df.empty:
            print("ANSWER:\n", answer_df)
        else:
            print("No results found.")


if __name__ == '__main__':
    main()
