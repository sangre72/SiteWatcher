import datetime
import traceback
import sys

import pandas as pd
import torch
from transformers import AutoTokenizer, AutoModel
from sqlalchemy import create_engine, Column, String, ARRAY, JSON, Float, DateTime, MetaData
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import declarative_base, sessionmaker

DB_CONNECTION = "postgresql://postgres:santape1@localhost:5432/db_vector"
VECTOR_DIMENSION = 512  # 모델 출력 차원
COMMIT_SIZE = 1000  # 커밋 크기 설정

# Hugging Face 인증 토큰
hf_token = os.environ.get('HF_TOKEN')

# SQLAlchemy 설정
Base = declarative_base()
engine = create_engine(DB_CONNECTION)
metadata = MetaData(schema="public")
Session = sessionmaker(bind=engine)

# CSV 파일 읽기 (5000건 제한)
file_path = 'doc_data/csv/car_prices.csv'
cache_dir ='/Users/bumsuklee/PhpstormProjects/20240418-git-test-prototype-cms/llm-server/llm_server/output'
data = pd.read_csv(file_path, nrows=5000)

# saledate 변환
data['saledate'] = pd.to_datetime(data['saledate'], errors='coerce', utc=True)

class SaleVector(Base):
    __tablename__ = 'sales_vectors'
    identifier = Column(String, primary_key=True)
    vector = Column(ARRAY(Float), nullable=False)
    meta_data = Column(JSONB)
    creation_date = Column(DateTime, default=datetime.datetime.utcnow)
    data_type = Column(String, nullable=False)  # 데이터 타입 필드 추가

def convert_timestamps(row):
    for key, value in row.items():
        if isinstance(value, pd.Timestamp):
            row[key] = value.to_pydatetime().isoformat()
        if pd.isna(value):
            row[key] = None
    return row

def seed():
    session = Session()

    # 테이블 생성 (없을 경우)
    Base.metadata.create_all(engine)

    # 파인 튜닝된 모델과 토크나이저 로드
    # clip-vit-base-patch32-finetuned
    model_path = "/Users/bumsuklee/PhpstormProjects/20240418-git-test-prototype-cms/llm-server/llm_server/output/sentence-transformers-all-MiniLM-L6-v2-finetuned"

    try:
        tokenizer = AutoTokenizer.from_pretrained(model_path)
        tokenizer.add_special_tokens({'pad_token': '[PAD]'})
        model = AutoModel.from_pretrained(model_path)

        # GPU 사용 설정
        device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
        model.to(device)
    except Exception as e:
        print(f"모델 또는 토크나이저 로드 오류: {e}")
        traceback.print_exc()
        sys.exit(1)

    # 데이터 처리 및 인코딩
    vectors = []
    for idx, row in data.iterrows():
        try:
            print(f"Processing row: {idx}")

            # 텍스트 설명으로 변환
            description = (
                f"Year: {row['year']}, Make: {row['make']}, Model: {row['model']}, "
                f"Trim: {row['trim']}, Body: {row['body']}, Transmission: {row['transmission']}, "
                f"VIN: {row['vin']}, State: {row['state']}, Condition: {row['condition']}, "
                f"Odometer: {row['odometer']} miles, Color: {row['color']}, Interior: {row['interior']}, "
                f"Seller: {row['seller']}, MMR: {row['mmr']}, Selling Price: {row['sellingprice']}, "
                f"Sale Date: {row['saledate']}."
            )

            # 모델을 사용하여 설명 인코딩
            inputs = tokenizer(description, return_tensors="pt", padding=True, truncation=True, max_length=512)
            inputs = {k: v.to(device) for k, v in inputs.items()}  # 입력도 GPU로 이동
            with torch.no_grad():
                outputs = model(**inputs)

            vector = outputs.last_hidden_state.mean(dim=1).cpu().numpy().flatten().tolist()  # 평균 풀링 및 리스트로 변환
            vectors.append(vector)

            # 타임스탬프를 datetime으로 변환
            meta_data = convert_timestamps(row.to_dict())
            meta_data['data_type'] = "sales"  # 매출 데이터 타입 추가

            sale_vector = SaleVector(
                identifier=f"sale_{idx}",
                vector=vector,
                meta_data=meta_data,
                creation_date=row['saledate'].to_pydatetime(),
                data_type="sales"  # 매출 데이터 타입 지정
            )

            session.merge(sale_vector)  # merge 사용
            print(f"Processed row: {idx}")

            # COMMIT_SIZE마다 커밋
            if len(vectors) % COMMIT_SIZE == 0:
                session.commit()
                print(f"Committed {COMMIT_SIZE} rows")
        except Exception as e:
            print(f"Error processing row {idx}: {e}")
            traceback.print_exc()
            session.rollback()  # 트랜잭션 상태 복구
            sys.exit(1)  # 프로그램 종료

    session.commit()
    print("Inserted or updated all rows")

if __name__ == '__main__':
    seed()
