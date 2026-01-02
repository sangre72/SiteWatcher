import datetime
import os

from PIL import Image
from sentence_transformers import SentenceTransformer
from sqlalchemy import create_engine, Column, String, ARRAY, JSON, insert, select, Float, cast, func, DateTime, MetaData
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DB_CONNECTION = "postgresql://postgres:santape1@localhost:5432/db_vector" #"postgresql://postgres:wc3191353@wnc243.nisus.kr:5432/openai_test"
directory_path = os.path.join(os.getcwd(), 'image/nature_photos')
supported_extensions = ['jpg', 'png', 'gif', 'jpeg']
VECTOR_DIMENSION = 1024
COMMIT_SIZE = 100

# SQLAlchemy 설정
Base = declarative_base()
engine = create_engine(DB_CONNECTION)
MetaData(schema="public")
Session = sessionmaker(bind=engine)

class ImageVector(Base):
    __tablename__ = 'image_vectors_1024' #'image_vectors_' + str(VECTOR_DIMENSION)
    identifier = Column(String, primary_key=True)
    vector = Column(ARRAY(Float), nullable=False)
    meta_data = Column(JSONB)
    creation_date = Column(DateTime, default=datetime.datetime.utcnow)

def seed():
    session = Session()

    # Load CLIP model
    model = SentenceTransformer('clip-ViT-B-32')

    # Encode images
    img_files = [f for f in os.listdir(directory_path) if f.split('.')[-1].lower() in supported_extensions]
    img_embs = []

    for img_file in img_files:
        print(f"Processing file: {img_file}")
        img_emb = model.encode(Image.open(os.path.join(directory_path, img_file))).tolist()  # Convert to list
        img_embs.append(img_emb)
        img_path = os.path.join(directory_path, img_file)
        creation_date = datetime.datetime.fromtimestamp(os.path.getctime(img_path))

        img_vector = ImageVector(
            identifier=img_file,
            vector=img_emb,
            meta_data={"type": img_file.split('.')[-1].lower()},
            creation_date=creation_date
        )

        session.merge(img_vector)  # Use merge instead of add
        print(f"Processed file: {img_file}")

        # Commit every 10 records
        if len(img_embs) % COMMIT_SIZE == 0:
            session.commit()
            print("Committed 10 files")

    session.commit()
    print("Inserted or updated all images")

#api_key = os.environ['OPENAI_API_KEY']
seed()


#search()
