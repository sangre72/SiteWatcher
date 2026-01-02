import os
import datetime
import logging
import traceback

import torch
from PIL import Image, ImageTk
from langchain.chains.llm import LLMChain
from langchain_community.chat_models import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from sentence_transformers import SentenceTransformer
from sqlalchemy import create_engine, Column, String, ARRAY, JSON, select, Float, func, DateTime, MetaData
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import tkinter as tk

from transformers import CLIPModel, CLIPProcessor

# 설정
DB_CONNECTION = "postgresql://postgres:santape1@localhost:5432/db_vector"
directory_path = os.path.join(os.getcwd(), 'image/nature_photos')
supported_extensions = ['jpg', 'png', 'gif', 'jpeg']
VECTOR_DIMENSION = 1024

# SQLAlchemy 설정
Base = declarative_base()
engine = create_engine(DB_CONNECTION)
metadata = MetaData(schema="db_vector")
Session = sessionmaker(bind=engine)

class ImageVector(Base):
    __tablename__ = 'image_vectors_1024'
    __table_args__ = {'schema': 'db_vector'}
    identifier = Column(String, primary_key=True)
    vector = Column(ARRAY(Float), nullable=False)
    text_vector = Column(ARRAY(Float), nullable=False)
    meta_data = Column(JSONB)
    creation_date = Column(DateTime, default=datetime.datetime.utcnow)
    update_date = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
hf_token = os.environ.get('HF_TOKEN')
class ImageSearchApp:
    def __init__(self):
        self.session = Session()
        self.model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32", use_auth_token=hf_token)
        self.processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32", use_auth_token=hf_token)
        self.llm = ChatOpenAI(api_key=OPENAI_API_KEY, model="gpt-4o")

    def vectorize_image(self, image_path):
        image = Image.open(image_path).convert("RGB")
        inputs = self.processor(images=image, return_tensors="pt")
        with torch.no_grad():
            outputs = self.model.get_image_features(**inputs)
        return outputs.cpu().numpy().flatten().tolist()

    def vectorize_text(self, text):
        inputs = self.processor(text=[text], return_tensors="pt", padding=True)
        with torch.no_grad():
            outputs = self.model.get_text_features(**inputs)
        return outputs.cpu().numpy().flatten().tolist()

    def translate_text_korean_to_english(self, text):
        # LangChain을 사용하여 번역 수행
        prompt = PromptTemplate(
            template="Translate the following Korean text to English and put the translated sentence in [ ]:\n\n{text}",
            input_variables=["text"]
        )
        chain = LLMChain(llm=self.llm, prompt=prompt)
        response = chain.run({"text": text})
        print("Translated Korean to English: {}".format(response))

        # 대괄호 안의 번역된 문장을 추출
        start = response.find('[')
        end = response.find(']', start)
        if start != -1 and end != -1:
            return response[start + 1:end].strip()
        else:
            return response.strip()

    def searchImages(self, query):
        try:
            # Translate Korean to English if needed
            translated_query = self.translate_text_korean_to_english(query)
            print(f"Translated query: {translated_query}")

            # Encode text query
            text_emb = self.vectorize_text(translated_query)

            # Query the collection
            stmt = select(ImageVector).where(
                func.jsonb_extract_path_text(ImageVector.meta_data, 'type').in_(supported_extensions)
            )
            results = self.session.execute(stmt).scalars().all()

            matches = []
            others = []
            for result in results:
                similarity = self.cosine_similarity(text_emb, result.vector)
                if similarity >= 0.275:
                    matches.append({
                        "similarity": similarity,
                        "identifier": result.identifier,
                        "meta_data": result.meta_data,
                        "creation_date": result.creation_date.isoformat(),
                        "update_date": result.update_date.isoformat() if result.update_date else None
                    })
                elif similarity < 0.275 and similarity > 0.250:
                    others.append({
                        "similarity": similarity,
                        "identifier": result.identifier,
                        "meta_data": result.meta_data,
                        "creation_date": result.creation_date.isoformat(),
                        "update_date": result.update_date.isoformat() if result.update_date else None
                    })

            # 상위 5개의 유사한 결과를 찾습니다.
            matches = sorted(matches, reverse=True, key=lambda x: x["similarity"])[:len(matches)]
            others = sorted(others, reverse=True, key=lambda x: x["similarity"])[:10]

            return matches , others
        except Exception as e:
            logging.error("Error during image search: %s", e)
            logging.error(traceback.format_exc())
            self.session.rollback()  # Rollback the transaction
            raise
        finally:
            self.session.close()  # Ensure the session is closed

    def display_images(self, images_with_similarity):
        try:
            root = tk.Tk()
            root.title("Search Results")

            for img_data in images_with_similarity:
                img_path = img_data["identifier"]
                similarity = img_data["similarity"]
                creation_date = img_data["creation_date"]

                img = Image.open(os.path.join(directory_path, img_path))
                img.thumbnail((400, 400))  # 이미지 크기를 윈도우에 맞게 조절

                img = ImageTk.PhotoImage(img)
                panel = tk.Label(root, image=img)
                panel.image = img
                panel.pack(side="left", padx=10, pady=10)

                label = tk.Label(root, text=f"Similarity: {similarity:.4f}\nCreation Date: {creation_date}")
                label.pack(side="left", padx=10, pady=10)

            root.mainloop()
        except Exception as e:
            logging.error("Error during image display: %s", e)
            logging.error(traceback.format_exc())
            raise

    def cosine_similarity(self, vec1, vec2):
        dot_product = sum(v1 * v2 for v1, v2 in zip(vec1, vec2))
        norm1 = sum(v1 * v1 for v1 in vec1) ** 0.5
        norm2 = sum(v2 * v2 for v2 in vec2) ** 0.5
        return dot_product / (norm1 * norm2)
