import datetime
import os
import traceback
import sys

import pandas as pd
import torch
from transformers import CLIPProcessor, CLIPModel
from sqlalchemy import create_engine, Column, String, ARRAY, JSON, Float, DateTime, MetaData
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import declarative_base, sessionmaker

DB_CONNECTION = "postgresql://postgres:santape1@localhost:5432/db_vector"
VECTOR_DIMENSION = 512  # CLIP model output dimension
COMMIT_SIZE = 1000  # 커밋 크기를 1000으로 설정

# SQLAlchemy 설정
Base = declarative_base()
engine = create_engine(DB_CONNECTION)
metadata = MetaData(schema="public")
Session = sessionmaker(bind=engine)

# CSV 파일 읽기 (10만 건만 읽기)
file_path = 'doc_data/csv/car_prices.csv'
data = pd.read_csv(file_path, nrows=5000)

# saledate 변환
data['saledate'] = pd.to_datetime(data['saledate'], errors='coerce', utc=True)

class SaleVector(Base):
    __tablename__ = 'sales_vectors'
    identifier = Column(String, primary_key=True)
    vector = Column(ARRAY(Float), nullable=False)
    meta_data = Column(JSONB)
    creation_date = Column(DateTime, default=datetime.datetime.utcnow)
    data_type = Column(String, nullable=False)  # 데이터 타입을 구분하는 필드 추가

def convert_timestamps(row):
    for key, value in row.items():
        if isinstance(value, pd.Timestamp):
            row[key] = value.to_pydatetime().isoformat()
        if pd.isna(value):
            row[key] = None
    return row

def seed():
    session = Session()

    # 테이블이 존재하지 않을 경우 생성
    Base.metadata.create_all(engine)

    # Load CLIP model and processor
    model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
    processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

    # Process and encode data
    vectors = []
    for idx, row in data.iterrows():
        try:
            print(f"Processing row: {idx}")

            # Convert row to text description
            description = (
                f"Year: {row['year']}, Make: {row['make']}, Model: {row['model']}, "
                f"Trim: {row['trim']}, Body: {row['body']}, Transmission: {row['transmission']}, "
                f"VIN: {row['vin']}, State: {row['state']}, Condition: {row['condition']}, "
                f"Odometer: {row['odometer']} miles, Color: {row['color']}, Interior: {row['interior']}, "
                f"Seller: {row['seller']}, MMR: {row['mmr']}, Selling Price: {row['sellingprice']}, "
                f"Sale Date: {row['saledate']}."
            )

            # 입력 텍스트를 최대 시퀀스 길이에 맞게 자르기
            max_length = 77
            inputs = processor(text=[description], return_tensors="pt", padding=True, truncation=True, max_length=max_length)

            with torch.no_grad():
                outputs = model.get_text_features(**inputs)

            vector = outputs.cpu().numpy().flatten().tolist()  # Convert to list
            vectors.append(vector)

            # Convert timestamps to datetime
            meta_data = convert_timestamps(row.to_dict())
            meta_data['data_type'] = "sales"  # 매출 데이터 타입 추가

            sale_vector = SaleVector(
                identifier=f"sale_{idx}",
                vector=vector,
                meta_data=meta_data,
                creation_date=row['saledate'].to_pydatetime(),
                data_type="sales"  # 매출 데이터 타입 지정
            )

            session.merge(sale_vector)  # Use merge instead of add
            print(f"Processed row: {idx}")

            # Commit every COMMIT_SIZE records
            if len(vectors) % COMMIT_SIZE == 0:
                session.commit()
                print(f"Committed {COMMIT_SIZE} rows")
        except Exception as e:
            print(f"Error processing row {idx}: {e}")
            traceback.print_exc()
            session.rollback()  # 롤백하여 트랜잭션 상태 복구
            sys.exit(1)  # 프로그램 종료

    session.commit()
    print("Inserted or updated all rows")

if __name__ == '__main__':
    seed()
