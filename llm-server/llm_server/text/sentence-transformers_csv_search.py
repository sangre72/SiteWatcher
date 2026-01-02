import datetime
import torch
from langchain.chains.llm import LLMChain
from langchain_community.chat_models import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine, Column, String, ARRAY, JSON, Float, DateTime, MetaData, and_
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
from transformers import AutoTokenizer, AutoModel

DB_CONNECTION = "postgresql://postgres:santape1@localhost:5432/db_vector"

Base = declarative_base()
engine = create_engine(DB_CONNECTION)
metadata = MetaData(schema="public")
Session = sessionmaker(bind=engine)

import os
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
hf_token = os.environ.get('HF_TOKEN')
llm = ChatOpenAI(api_key=OPENAI_API_KEY, model="gpt-4o")


class SaleVector(Base):
    __tablename__ = 'sales_vectors'
    identifier = Column(String, primary_key=True)
    vector = Column(ARRAY(Float), nullable=False)
    meta_data = Column(JSONB)
    creation_date = Column(DateTime, default=datetime.datetime.utcnow)
    data_type = Column(String, nullable=False)

#model_id = "sentence-transformers/all-MiniLM-L6-v2"
model_id = "sentence-transformers/paraphrase-mpnet-base-v2"
def load_model():
    tokenizer = AutoTokenizer.from_pretrained(model_id, use_auth_token=hf_token)
    model = AutoModel.from_pretrained(model_id, use_auth_token=hf_token)
    return model, tokenizer

def vectorize_query(query, tokenizer, model):
    inputs = tokenizer(query, return_tensors="pt", padding=True, truncation=True, max_length=77)
    with torch.no_grad():
        outputs = model(**inputs)
    query_vector = outputs.last_hidden_state.mean(dim=1).cpu().numpy().flatten()
    return query_vector

def adjust_vector_weights(query_vector, query, keyword_weights):
    words = query.lower().split()
    weights = [keyword_weights.get(word, 1.0) for word in words]
    max_weight = max(weights)

    weighted_vector = query_vector * weights[0]  # 기본 가중치를 첫 번째 단어의 가중치로 설정

    # 각 단어의 가중치를 적용
    for i in range(1, len(weights)):
        weighted_vector += query_vector * weights[i]

    return weighted_vector / max_weight  # 최대 가중치로 나눔

def search_sales2(date, data_type, query=None):
    session = Session()
    try:
        base_query = session.query(SaleVector).filter(
            and_(
                SaleVector.creation_date >= datetime.datetime.strptime(date, '%Y-%m-%d'),
                SaleVector.creation_date < datetime.datetime.strptime(date, '%Y-%m-%d') + datetime.timedelta(days=1),
                SaleVector.data_type == data_type
            )
        )

        if query:
            model, tokenizer = load_model()
            query_vector = vectorize_query(query, tokenizer, model)

            # 예를 들어, 특정 키워드에 가중치를 부여하여 벡터를 조정
            keyword_weights = {
                query: 100.0
                # 추가 키워드 및 가중치 설정
            }

            adjusted_query_vector = adjust_vector_weights(query_vector, query, keyword_weights)

            results = base_query.all()

            similar_results = []
            for result in results:
                vector = torch.tensor(result.vector)
                query_vector_tensor = torch.tensor(adjusted_query_vector)
                similarity = torch.nn.functional.cosine_similarity(
                    query_vector_tensor, vector, dim=0
                ).item()
                if similarity >= 0.65:  # 0.5 이상의 유사도만 추가
                    similar_results.append((result, similarity))

            similar_results = sorted(similar_results, key=lambda x: x[1], reverse=True)

            for result, similarity in similar_results:
                print(f"Identifier: {result.identifier}, Similarity: {similarity:.4f}, Meta Data: {result.meta_data}")
        else:
            results = base_query.all()
            for result in results:
                print(f"Identifier: {result.identifier}, Meta Data: {result.meta_data}")

    except Exception as e:
        print(f"Error searching sales: {e}")
    finally:
        session.close()

def translate_text_korean_to_english(text):
    # LangChain을 사용하여 번역 수행
    prompt = PromptTemplate(
        template="Translate the following Korean text to English and put the translated sentence in [ ]:\n\n[ {text} ]",
        input_variables=["text"]
    )
    chain = LLMChain(llm=llm, prompt=prompt)
    response = chain.run({"text": text})
    print("Translated Korean to English: {}".format(response))

    # 대괄호 안의 번역된 문장을 추출
    start = response.find('[')
    end = response.find(']', start)
    if start != -1 and end != -1:
        return response[start + 1:end].strip()
    else:
        return response.strip()


if __name__ == '__main__':
    search_date = '2014-12-16'
    search_type = 'sales'
    search_query = '캠리' # SUV 토요타 Limited Highlander Hybrid'  # Chevrolet 1500 LS white'
    translate_query = translate_text_korean_to_english(search_query)
    print(search_query, translate_query)

    if search_query.strip():
        search_sales2(search_date, search_type, translate_query)
    else:
        search_sales2(search_date, search_type)
