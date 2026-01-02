import datetime
import torch
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine, Column, String, ARRAY, JSON, Float, DateTime, MetaData, and_
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
from transformers import CLIPProcessor, CLIPModel

DB_CONNECTION = "postgresql://postgres:santape1@localhost:5432/db_vector"

Base = declarative_base()
engine = create_engine(DB_CONNECTION)
metadata = MetaData(schema="public")
Session = sessionmaker(bind=engine)

hf_token = os.environ.get('HF_TOKEN')

class SaleVector(Base):
    __tablename__ = 'sales_vectors'
    identifier = Column(String, primary_key=True)
    vector = Column(ARRAY(Float), nullable=False)
    meta_data = Column(JSONB)
    creation_date = Column(DateTime, default=datetime.datetime.utcnow)
    data_type = Column(String, nullable=False)

def load_model():
    model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32", use_auth_token=hf_token)
    processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32", use_auth_token=hf_token)
    return model, processor

def vectorize_query(query, processor, model):
    inputs = processor(text=[query], return_tensors="pt", padding=True, truncation=True, max_length=77)
    with torch.no_grad():
        outputs = model.get_text_features(**inputs)
    query_vector = outputs.cpu().numpy().flatten()
    print(f"Query vector: {query_vector}")  # 벡터화된 쿼리 출력
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

def search_sales(date, data_type, query=None):
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
            model, processor = load_model()
            query_vector = vectorize_query(query, processor, model)

            # 예를 들어, 특정 키워드에 가중치를 부여하여 벡터를 조정
            keyword_weights = {
                "suv": 100.0
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

if __name__ == '__main__':
#    while True:
 #       search_date = input("Enter the date (YYYY-MM-DD) to search or 'exit' to quit: ")
 #       if search_date.lower() == 'exit':
 #           break
 #       search_type = input("Enter the data type to search (e.g., 'sales'): ")
 #       search_query = input("Enter a search query (optional): ")
    search_date='2014-12-16'
    search_type='sales'
    search_query='SUV Chevrolet 1500 LS white'

    if search_query.strip():
        search_sales(search_date, search_type, search_query)
    else:
        search_sales(search_date, search_type)
