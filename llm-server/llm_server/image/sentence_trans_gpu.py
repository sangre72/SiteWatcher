import os
import numpy as np
import faiss
import torch
import clip
from PIL import Image, ImageTk
import tkinter as tk
import coremltools as ct

# CLIP 모델 로드 (텍스트 임베딩을 위해)
device = "mps" if torch.backends.mps.is_available() else "cpu" #torch.cuda.is_available()
clip_model, preprocess = clip.load("ViT-L/14@336px", device=device)

# Core ML 모델 로드 (이미지 임베딩을 위해)
coreml_model = ct.models.MLModel("CLIP_ViT_L_14_336.mlpackage")

# 텍스트 임베딩 생성 함수
def get_text_embedding(text):
    text_tokens = clip.tokenize([text]).to(device)
    with torch.no_grad():
        text_features = clip_model.encode_text(text_tokens)
    return text_features.cpu().numpy().flatten().astype('float32')

# 이미지 전처리 함수
def preprocess_image(img_path):
    image = Image.open(img_path).convert("RGB")
    image = image.resize((336, 336))
    return image

# 이미지 임베딩 생성 함수
def get_image_embedding(img_path):
    image = preprocess_image(img_path)
    input_data = {"input_1": image}
    output = coreml_model.predict(input_data)
    embedding = output['var_2615'].flatten()  # Output 변수명은 Core ML 모델에 따라 다를 수 있음
    return embedding.astype('float32')

# 디렉토리 설정
directory_path = os.path.join(os.getcwd(), 'nature_photos_small')
index_path = 'vector_database2/faiss_index'
filenames_path = 'vector_database2/filenames.txt'

# FAISS 인덱스 로드
index = faiss.read_index(index_path)

# 파일 이름 로드
with open(filenames_path, 'r') as f:
    filenames = [line.strip() for line in f.readlines()]

def search_images_by_text(query, k=5):
    # 텍스트 임베딩 생성
    text_embedding = get_text_embedding(query)

    # 텍스트 임베딩의 차원 확인 및 맞춤
    if text_embedding.shape[0] != index.d:
        raise ValueError(f"Dimension mismatch: text embedding dimension is {text_embedding.shape[0]}, but index dimension is {index.d}")

    # 검색
    distances, indices = index.search(np.array([text_embedding]), k)

    # 결과 파일 이름 및 이미지 경로
    result_filenames = [filenames[idx] for idx in indices[0]]
    result_images = [os.path.join(directory_path, filename) for filename in result_filenames]

    return result_filenames, result_images, distances

def display_images(images, distances):
    root = tk.Tk()
    root.title("Search Results")

    for img_path, distance in zip(images, distances):
        img = Image.open(img_path)
        img.thumbnail((300, 300))  # 이미지 크기를 윈도우에 맞게 조절

        img = ImageTk.PhotoImage(img)
        panel = tk.Label(root, image=img, text=f"Distance: {distance:.2f}", compound="top")
        panel.image = img
        panel.pack(side="left", padx=10, pady=10)

    root.mainloop()

# 예시 텍스트 검색 및 결과 출력
query = "green mountain landscape"
result_filenames, result_images, distances = search_images_by_text(query)

print("Search Results:")
for filename, distance in zip(result_filenames, distances[0]):
    print(f"{filename} - Distance: {distance:.4f}")

display_images(result_images, distances[0])
