import base64
import datetime
import json
import os

import pandas as pd
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import logging

from sentence_transformers import SentenceTransformer, losses, InputExample, models
from torch.nn.utils.rnn import pad_sequence
from torch.utils.data import DataLoader

from sqlalchemy import MetaData, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, DeclarativeMeta
from sqlalchemy.orm.attributes import flag_modified

from openai_clip_web_finetune import ImageSearchAppFineTune
from openai_clip_web import ImageSearchApp, ImageVector
from query_from_web import handle_query  # query.py에서 handle_query 함수를 임포트합니다.
from PyPDF2 import PdfReader
from langchain.text_splitter import CharacterTextSplitter
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.chat_models import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationalRetrievalChain
from torch.utils.data import DataLoader
from PIL import Image

app = Flask(__name__)

CORS(app)  # CORS 설정을 통해 모든 도메인에서의 요청을 허용

# 설정
DB_CONNECTION = "postgresql://postgres:santape1@localhost:5432/db_vector"
directory_path = os.path.join(os.getcwd(), 'image/nature_photos')
supported_extensions = ['jpg', 'png', 'gif', 'jpeg']
VECTOR_DIMENSION = 1024

# SQLAlchemy 설정
Base = declarative_base()
engine = create_engine(DB_CONNECTION)
metadata = MetaData(schema="db_vector")
SessionLocal = sessionmaker(bind=engine)


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/api/gmn-message', methods=['POST'])
def post_user():
    app.logger.debug("POST request received")
    data = request.get_json()
    if not data:
        app.logger.error("No JSON data received")
        return jsonify({'error': 'No JSON data provided'}), 400
    query_text = data['q']
    app.logger.debug("Query text received {}".format(query_text))
    response_message = handle_query(query_text)
    return jsonify(response_message), 200


def get_pdf_text(pdf_path):
    text = ""
    pdf_reader = PdfReader(pdf_path)
    for page in pdf_reader.pages:
        text += page.extract_text() if page.extract_text() else ""
    return text


def get_text_chunks(text):
    text_splitter = CharacterTextSplitter(
        separator="\n",
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    return text_splitter.split_text(text)


def get_vectorstore(text_chunks):
    embeddings = OpenAIEmbeddings()
    vectorstore = FAISS.from_texts(texts=text_chunks, embedding=embeddings)
    return vectorstore


@app.route('/load')
def load_pdf():
    file_type = request.args.get('ft')
    doc_path = request.args.get('d')

    if file_type != 'pdf' or not doc_path:
        return jsonify({"error": "Invalid file type or path"}), 400

    try:
        # Processing the PDF
        raw_text = get_pdf_text(doc_path)
        text_chunks = get_text_chunks(raw_text)
        vectorstore = get_vectorstore(text_chunks)

        # Assuming you have some method to summarize this information
        return jsonify({"status": "success", "message": "PDF processed successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


image_search_app = ImageSearchApp()  # 인스턴스 생성
#image_search_app = ImageSearchAppFineTune()  # 인스턴스 생성


@app.route('/ai/image_search', methods=['POST'])
def image_search_endpoint():
    directory_path = os.path.join(os.getcwd(), 'image/nature_photos')
    data = request.get_json()
    if not data or 'query' not in data:
        return jsonify({"error": "No query provided"}), 400

    query_text = data['query']
    try:
        matches, others = image_search_app.searchImages(query_text)
        result_images = []
        others_images = []

        for match in matches:
            identifier = match["identifier"]
            similarity = match["similarity"]
            creation_date = match["creation_date"]
            update_date = match["update_date"]
            meta_data = match["meta_data"]
            description = match["meta_data"]  # Get description if available

            img_path = os.path.join(directory_path, identifier)
            with open(img_path, "rb") as img_file:
                img_data = base64.b64encode(img_file.read()).decode('utf-8')
                result_images.append({
                    "filename": identifier,
                    "similarity": similarity,
                    "creation_date": creation_date,
                    "update_date": update_date,
                    "data": img_data,
                    "meta_data": meta_data,
                    "description": description,
                    "identifier": identifier
                })

        for match in others:
            identifier = match["identifier"]
            similarity = match["similarity"]
            creation_date = match["creation_date"]
            meta_data = match["meta_data"]
            update_date = match["update_date"]
            description = match["meta_data"]  # Get description if available

            img_path = os.path.join(directory_path, identifier)
            with open(img_path, "rb") as img_file:
                img_data = base64.b64encode(img_file.read()).decode('utf-8')
                others_images.append({
                    "filename": identifier,
                    "similarity": similarity,
                    "creation_date": creation_date,
                    "update_date": update_date,
                    "data": img_data,
                    "meta_data": meta_data,
                    "description": description,
                    "identifier": identifier
                })

        return jsonify({"matches": result_images, "others": others_images}), 200
    except Exception as e:
        app.logger.error("Error during image search: {}".format(e))
        return jsonify({"error": str(e)}), 500


@app.route('/ai/update_description', methods=['POST'])
def update_description():
    data = request.get_json()
    print("update_description.", data)
    if not data or 'identifier' not in data or 'description' not in data:
        return jsonify({"error": "No identifier or description provided"}), 400

    identifier = data['identifier']
    description = data['description']

    print(identifier, description)

    try:
        session = SessionLocal()
        img_vector = session.query(ImageVector).filter_by(identifier=identifier).first()
        if img_vector:
            meta_data = img_vector.meta_data
            meta_data['description'] = description
            img_vector.meta_data = meta_data
            img_vector.update_date = datetime.datetime.utcnow()  # update_date를 현재 시간으로 설정
            flag_modified(img_vector, 'meta_data')
            print("Updated meta_data before commit:", meta_data)

            session.merge(img_vector)  # Use session.add instead of session.merge
            session.commit()

            # Verify that the update is successful
            updated_img_vector = session.query(ImageVector).filter_by(identifier=identifier).first()
            print("Updated meta_data after commit:", updated_img_vector.meta_data)
            return jsonify({"message": "Description updated successfully"}), 200
        else:
            return jsonify({"error": "Image not found"}), 404
    except Exception as e:
        app.logger.error("Error updating description: {}".format(e))
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()  # 세션 닫기


# 모델 로드

from datasets import Dataset
from torch.utils.data import Dataset, DataLoader
import torch
import torch.nn as nn
from tqdm import tqdm
from torchvision import transforms
from transformers import CLIPModel, CLIPProcessor

# CLIP 모델 로드
hf_token = os.environ.get('HF_TOKEN')

#model = SentenceTransformer('clip-ViT-B-32')
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32", use_auth_token=hf_token)
processor = CLIPProcessor.from_pretrained('openai/clip-vit-base-patch32', use_auth_token=hf_token)

# CLIP 모델과 프로세서 로드
# model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32", use_auth_token=hf_token)
# processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32", use_auth_token=hf_token)

#device = "cuda" if torch.cuda.is_available() else "cpu"
device = "mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)

# 데이터셋 클래스
class ImageTextDataset(Dataset):
    def __init__(self, image_paths, texts, processor):
        self.image_paths = image_paths
        self.texts = texts
        self.processor = processor

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        image = Image.open(self.image_paths[idx]).convert("RGB")
        text = self.texts[idx]
        inputs = self.processor(text=[text], images=image, return_tensors="pt", padding=True)
        return inputs["pixel_values"].squeeze(0), inputs["input_ids"].squeeze(0)

def collate_fn(batch):
    images, texts = zip(*batch)
    images = torch.stack(images)
    texts = pad_sequence(texts, batch_first=True, padding_value=0)  # 패딩하여 동일한 길이로 맞춤
    return images, texts

@app.route('/ai/retrain', methods=['POST'])
def retrain_model():
    data = request.get_json()
    if not data or 'start_date' not in data or 'end_date' not in data:
        return jsonify({"error": "No date range provided"}), 400

    start_date = data['start_date']
    end_date = data['end_date']

    try:

        session = SessionLocal()
        all_vectors = session.query(ImageVector).filter(
            ImageVector.update_date.between(start_date, end_date)
        ).all()

        if not all_vectors:
            return jsonify({"error": "No records found for the given date range"}), 404

        image_paths = []
        texts = []

        for vector in all_vectors:
            description = vector.meta_data.get('description', '')
            identifier = vector.identifier
            if description:
                img_path = os.path.join('image/nature_photos', identifier)
                if os.path.exists(img_path):
                    image_paths.append(img_path)
                    texts.append(description)

        if not image_paths or not texts:
            return jsonify({"error": "No valid image paths or texts found"}), 400

        dataset = ImageTextDataset(image_paths, texts, processor)
        dataloader = DataLoader(dataset, batch_size=16, shuffle=True, collate_fn=collate_fn)

        # 학습 설정
        learning_rate = 1e-5
        num_epochs = 5
        optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)
        loss_img = nn.CrossEntropyLoss()
        loss_txt = nn.CrossEntropyLoss()

        # 모델 학습
        for epoch in range(num_epochs):
            model.train()
            pbar = tqdm(dataloader, total=len(dataloader))
            for batch in pbar:
                optimizer.zero_grad()
                images, texts = batch
                images = images.to(device)
                texts = texts.to(device)

                outputs = model(pixel_values=images, input_ids=texts)
                logits_per_image = outputs.logits_per_image
                logits_per_text = outputs.logits_per_text

                ground_truth = torch.arange(len(images), dtype=torch.long, device=device)
                total_loss = (loss_img(logits_per_image, ground_truth) + loss_txt(logits_per_text, ground_truth)) / 2

                total_loss.backward()
                optimizer.step()

                pbar.set_description(f"Epoch {epoch + 1}/{num_epochs}, Loss: {total_loss.item():.4f}")

        model.save_pretrained('output/clip-vit-base-patch32-finetuned')
        processor.save_pretrained('output/clip-vit-base-patch32-finetuned')

        for vector in all_vectors:
            description = vector.meta_data.get('description', '')
            identifier = vector.identifier
            if description:
                img_path = os.path.join('image/nature_photos', identifier)
                if os.path.exists(img_path):
                    image = Image.open(img_path).convert("RGB")
                    inputs = processor(images=image, return_tensors="pt")
                    with torch.no_grad():
                        outputs = model.get_image_features(**inputs)

                    # 텍스트 벡터화
                    description = f"Description of {description}"  # 실제 설명이 있는 경우 대체
                    text_inputs = processor(text=[description], return_tensors="pt", padding=True)
                    with torch.no_grad():
                        text_outputs = model.get_text_features(**text_inputs)

                    text_emb = text_outputs.cpu().numpy().flatten().tolist()  # Convert to list

                    img_emb = outputs.cpu().numpy().flatten().tolist()  # Convert to list
                    text_emb = outputs.cpu().numpy().flatten().tolist()  # Convert to list
                    creation_date = datetime.datetime.fromtimestamp(os.path.getctime(img_path))

                    img_vector = ImageVector(
                        identifier=vector.identifier,
                        vector=img_emb,
                        text_vector=text_emb
                    )

                    session.merge(img_vector)  # Use merge instead of add
                    print(f"Processed file: {vector.identifier}")

                    session.commit()
        session.close()
        return jsonify({"message": "Model retrained and vectors updated successfully"}), 200
    except Exception as e:
        app.logger.error("Error during retraining: {}".format(e))
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

# Model and processor initialization
hf_token = os.environ.get('HF_TOKEN')
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32", use_auth_token=hf_token)
processor = CLIPProcessor.from_pretrained('openai/clip-vit-base-patch32', use_auth_token=hf_token)
device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)

def vectorize_image(image_path):
    image = Image.open(image_path).convert("RGB")
    inputs = processor(images=image, return_tensors="pt")
    inputs = {k: v.to(device) for k, v in inputs.items()}
    with torch.no_grad():
        outputs = model.get_image_features(**inputs)
    return outputs

def vectorize_text(text):
    inputs = processor(text=[text], return_tensors="pt", padding=True)
    inputs = {k: v.to(device) for k, v in inputs.items()}
    with torch.no_grad():
        outputs = model.get_text_features(**inputs)
    return outputs

#################################
# main_script.py
from sentence_transformers_csv_search import search_sales2, translate_text_korean_to_english

# SQLAlchemy 모델을 JSON으로 변환하는 도우미 함수
class AlchemyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj.__class__, DeclarativeMeta):
            # SQLAlchemy 모델 객체를 딕셔너리로 변환
            fields = {}
            for field in [x for x in dir(obj) if not x.startswith('_') and x != 'metadata']:
                data = obj.__getattribute__(field)
                try:
                    json.dumps(data)  # JSON 직렬화 가능 여부 테스트
                    fields[field] = data
                except TypeError:
                    fields[field] = str(data)
            return fields
        return json.JSONEncoder.default(self, obj)

@app.route('/ai/text_search', methods=['POST'])
def text_search_endpoint():
    data = request.get_json()
    if not data or 'query' not in data:
        return jsonify({"error": "No query provided"}), 400

    search_date = '2014-12-16'
    search_type = 'sales'
    query = data['query']
    translate_query = translate_text_korean_to_english(query)
    print(translate_query)
    try:
        matches = search_sales2(search_date, search_type, translate_query)

        # 매칭 결과를 JSON으로 변환
        matches_json = [
            {
                "identifier": match[0].identifier,
                "similarity": match[1],
                "meta_data": match[0].meta_data
            }
            for match in matches
        ]

        return jsonify({"matches": matches_json}), 200
    except Exception as e:
        app.logger.error("Error during Text search: {}".format(e))
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9999, debug=True)
