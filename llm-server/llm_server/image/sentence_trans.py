import os
import numpy as np
import faiss
import clip
import torch
from PIL import Image, ImageTk
import tkinter as tk

# CLIP 모델 및 변환기 로드
device = "mps" if not torch.backends.mps.is_available() else "cpu"
clip_model, preprocess_clip = clip.load("ViT-B/32", device=device)

# 텍스트 임베딩 생성 함수
def get_text_embedding(text):
    text_tokens = clip.tokenize([text]).to(device)
    with torch.no_grad():
        text_embedding = clip_model.encode_text(text_tokens)
    return text_embedding.cpu().numpy().flatten().astype('float32')

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
    combined_embedding = np.concatenate((text_embedding, text_embedding), axis=None)
    combined_embedding_sub = combined_embedding[:1024]

    # 텍스트 임베딩의 차원 확인 및 맞춤
    if combined_embedding_sub.shape[0] != index.d:
        raise ValueError(f"Dimension mismatch: text embedding dimension is {text_embedding.shape[0]}, but index dimension is {index.d}")

    # 검색
    distances, indices = index.search(np.array([combined_embedding_sub]), k)

    # 결과 파일 이름 및 이미지 경로
    result_filenames = [filenames[idx] for idx in indices[0]]
    result_images = [os.path.join(directory_path, filename) for filename in result_filenames]

    return result_filenames, result_images

def display_images(images):
    root = tk.Tk()
    root.title("Search Results")

    for img_path in images:
        img = Image.open(img_path)
        img.thumbnail((300, 300))  # 이미지 크기를 윈도우에 맞게 조절

        img = ImageTk.PhotoImage(img)
        panel = tk.Label(root, image=img)
        panel.image = img
        panel.pack(side="left", padx=10, pady=10)

    root.mainloop()

# 예시 텍스트 검색 및 결과 출력
query = "winter mountain"
result_filenames, result_images = search_images_by_text(query)

print("Search Results:")
for filename in result_filenames:
    print(filename)

display_images(result_images)
