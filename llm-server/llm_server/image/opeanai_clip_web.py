import datetime
import os
import sys

import openai
import vecs
from PIL import Image, ImageTk
from langchain.chains.llm import LLMChain
from langchain_community.chat_models import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_openai import OpenAI
from sentence_transformers import SentenceTransformer
from sqlalchemy import create_engine, Column, String, ARRAY, JSON, insert, select, Float, cast, func, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import tkinter as tk
from matplotlib import pyplot as plt
from matplotlib import image as mpimg

DB_CONNECTION = "postgresql://postgres@localhost:5432/postgres"
directory_path = os.path.join(os.getcwd(), 'nature_photos')
supported_extensions = ['jpg', 'png', 'gif']
VECTOR_DIMENSION = 1024

# SQLAlchemy 설정
Base = declarative_base()
engine = create_engine(DB_CONNECTION)
Session = sessionmaker(bind=engine)

class ImageVector(Base):
    __tablename__ = 'image_vectors_' + str(VECTOR_DIMENSION)
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
        img_emb = model.encode(Image.open(os.path.join(directory_path, img_file)))
        img_embs.append(img_emb)

        # Create or update the record in the session
        img_vector = ImageVector(
            identifier=img_file,
            vector=img_emb.tolist(),
            meta_data={"type": img_file.split('.')[-1].lower()}
        )
        session.merge(img_vector)  # Use merge instead of add
        print(f"Processed file: {img_file}")

        # Commit every 10 records
        if len(img_embs) % 10 == 0:
            session.commit()
            print("Committed 10 files")

    session.commit()
    print("Inserted or updated all images")

#api_key = os.environ['OPENAI_API_KEY']
#seed()

OPENAI_API_KEY = os.environ['OPENAI_API_KEY']


def translate_text_korean_to_english(text):
    # LangChain을 사용하여 번역 수행
    llm = ChatOpenAI(api_key=OPENAI_API_KEY, model="gpt-4")
    prompt = PromptTemplate(
        template="Translate the following Korean text to English and put the translated sentence in [ ]:\n\n{text}",
        input_variables=["text"])
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
    #return response.strip()


def search():
    session = Session()

    # Load CLIP model
    model = SentenceTransformer('clip-ViT-B-32')

    while True:
        # Prompt the user for a search query
        query_string = input("Enter search query (or 'exit' to quit): ")
        if query_string.lower() == 'exit':
            break

        # Translate Korean to English if needed
        translated_query = translate_text_korean_to_english(query_string)
        print(f"Translated query: {translated_query}")

        # Encode text query
        text_emb = model.encode(translated_query).tolist()

        # Query the collection
        stmt = select(ImageVector).where(
            func.jsonb_extract_path_text(ImageVector.meta_data, 'type').in_(supported_extensions)
        )
        results = session.execute(stmt).scalars().all()

        # Calculate cosine similarity and find the best matches
        matches = []
        for result in results:
            similarity = cosine_similarity(text_emb, result.vector)
            matches.append((similarity, result.identifier))

        # 상위 5개의 유사한 결과를 찾습니다.
        matches = sorted(matches, reverse=True, key=lambda x: x[0])[:5]
        top_results = [(match[1], match[0]) for match in matches]  # (identifier, similarity)

        display_images(top_results)

def display_images(images_with_similarity):
    root = tk.Tk()
    root.title("Search Results")

    for img_path, similarity in images_with_similarity:
        img = Image.open(os.path.join(directory_path, img_path))
        img.thumbnail((400, 400))  # 이미지 크기를 윈도우에 맞게 조절

        img = ImageTk.PhotoImage(img)
        panel = tk.Label(root, image=img)
        panel.image = img
        panel.pack(side="left", padx=10, pady=10)

        label = tk.Label(root, text=f"Similarity: {similarity:.4f}")
        label.pack(side="left", padx=10, pady=10)

    root.mainloop()

def cosine_similarity(vec1, vec2):
    dot_product = sum(v1 * v2 for v1, v2 in zip(vec1, vec2))
    norm1 = sum(v1 * v1 for v1 in vec1) ** 0.5
    norm2 = sum(v2 * v2 for v2 in vec2) ** 0.5
    return dot_product / (norm1 * norm2)

#search()
