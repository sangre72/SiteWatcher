import datetime
import os
import torch
from PIL import Image
from transformers import CLIPProcessor, CLIPModel
from sqlalchemy import create_engine, Column, String, ARRAY, JSON, Float, DateTime, MetaData
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DB_CONNECTION = "postgresql://postgres:santape1@localhost:5432/db_vector"
directory_path = os.path.join(os.getcwd(), 'image/nature_photos')
supported_extensions = ['jpg', 'png', 'gif', 'jpeg']
VECTOR_DIMENSION = 1024  # Change vector dimension to match CLIP model
COMMIT_SIZE = 10

# SQLAlchemy 설정
Base = declarative_base()
engine = create_engine(DB_CONNECTION)
MetaData(schema="public")
Session = sessionmaker(bind=engine)


class ImageVector(Base):
    __tablename__ = 'image_vectors_openai_1024'  # Change table name to reflect new vector dimension
    __table_args__ = {'schema': 'db_vector'}

    identifier = Column(String, primary_key=True)
    vector = Column(ARRAY(Float), nullable=False)
    meta_data = Column(JSONB)
    creation_date = Column(DateTime, default=datetime.datetime.utcnow)


def seed():
    session = Session()

    # Load CLIP model and processor
    model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
    processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

    # Encode images
    img_files = [f for f in os.listdir(directory_path) if f.split('.')[-1].lower() in supported_extensions]
    img_embs = []

    for img_file in img_files:
        print(f"Processing file: {img_file}")
        img_path = os.path.join(directory_path, img_file)
        image = Image.open(img_path).convert("RGB")
        inputs = processor(images=image, return_tensors="pt")

        with torch.no_grad():
            outputs = model.get_image_features(**inputs)

        img_emb = outputs.cpu().numpy().flatten().tolist()  # Convert to list
        img_embs.append(img_emb)

        creation_date = datetime.datetime.fromtimestamp(os.path.getctime(img_path))

        img_vector = ImageVector(
            identifier=img_file,
            vector=img_emb,
            meta_data={"type": img_file.split('.')[-1].lower()},
            creation_date=creation_date
        )

        session.merge(img_vector)  # Use merge instead of add
        print(f"Processed file: {img_file}")

        # Commit every COMMIT_SIZE records
        if len(img_embs) % COMMIT_SIZE == 0:
            session.commit()
            print(f"Committed {COMMIT_SIZE} files")

    session.commit()
    print("Inserted or updated all images")


# api_key = os.environ['OPENAI_API_KEY']
seed()
