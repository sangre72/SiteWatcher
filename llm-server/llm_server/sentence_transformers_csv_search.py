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
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

DB_CONNECTION = "postgresql://postgres:santape1@localhost:5432/db_vector"

Base = declarative_base()
engine = create_engine(DB_CONNECTION)
metadata = MetaData(schema="public")
Session = sessionmaker(bind=engine)
cache_dir = "/Users/bumsuklee/.cache"
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

def prepare_corpus(data_type, date):
    session = Session()
    try:
        results = session.query(SaleVector).filter(
            and_(
                SaleVector.creation_date >= datetime.datetime.strptime(date, '%Y-%m-%d'),
                SaleVector.creation_date < datetime.datetime.strptime(date, '%Y-%m-%d') + datetime.timedelta(days=1),
                SaleVector.data_type == data_type
            )
        ).all()
        corpus = [" ".join([f"{key}: {value}" for key, value in result.meta_data.items()]) for result in results]
        return corpus, results
    except Exception as e:
        print(f"Error preparing corpus: {e}")
        return [], []
    finally:
        session.close()

def search_sales2(date, data_type, query=None):
    session = Session()
    similar_results = []
    try:
        if query:
            corpus, results = prepare_corpus(data_type, date)
            vectorizer = TfidfVectorizer()
            tfidf_matrix = vectorizer.fit_transform(corpus)

            # 단일 키워드일 경우 가중치를 크게 주기
            if len(query.split()) == 1:
                query = " ".join([query] * 10)

            query_vector = vectorizer.transform([query])

            similarities = cosine_similarity(query_vector, tfidf_matrix).flatten()

            for idx, similarity in enumerate(similarities):
                if similarity >= 0.1:  # 유사도가 0.65 이상인 결과만 추가
                    similar_results.append((results[idx], similarity))

            similar_results = sorted(similar_results, key=lambda x: x[1], reverse=True)
            for result, similarity in similar_results:
                print(f"Identifier: {result.identifier}, Similarity: {similarity:.4f}, Meta Data: {result.meta_data}")
        return similar_results
    except Exception as e:
        print(f"Error searching sales: {e}")
        return similar_results
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
    search_query = '토요타 suv' # SUV 토요타 Limited Highlander Hybrid'  # Chevrolet 1500 LS white'
    translate_query = translate_text_korean_to_english(search_query)
    print(search_query, translate_query)

    if search_query.strip():
        search_sales2(search_date, search_type, translate_query)
    else:
        search_sales2(search_date, search_type)
