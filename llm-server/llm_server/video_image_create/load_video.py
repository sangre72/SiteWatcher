import os

import cv2
import numpy as np
import torch
from sklearn.manifold import TSNE
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

# 비디오 로드 및 프레임 추출 함수
def load_video_and_detect_edges(video_path, max_frames=16):
    cap = cv2.VideoCapture(video_path)
    frames = []
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    duration = frame_count / fps
    print(f"Total frames: {frame_count}, Duration: {duration:.2f} seconds")

    frame_interval = max(1, frame_count // max_frames)  # 프레임 간격 조정
    for i in range(0, frame_count, frame_interval):
        cap.set(cv2.CAP_PROP_POS_FRAMES, i)
        ret, frame = cap.read()
        if not ret:
            break
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frame = cv2.resize(frame, (224, 224))
        edges = cv2.Canny(frame, 100, 200)  # Canny 엣지 검출
        frames.append(edges.flatten())  # 엣지를 1차원 벡터로 변환하여 추가
        if len(frames) >= max_frames:
            break
    cap.release()
    frames = np.array(frames)
    return frames

# 비디오 파일 절대 경로 설정
video_path = os.path.abspath('/Users/bumsuklee/PhpstormProjects/20240418-git-test-prototype-cms/llm-server/llm_server/video_image_create/tiny.mp4')

# 비디오 로드 및 엣지 검출
video_edge_vectors = load_video_and_detect_edges(video_path, max_frames=16)
print(f"Extracted {len(video_edge_vectors)} frame edge vectors.")

# t-SNE를 사용하여 3D 공간으로 축소
tsne = TSNE(n_components=3, random_state=42, perplexity=5)
edge_vectors_3d = tsne.fit_transform(video_edge_vectors)

# 시각화
fig = plt.figure(figsize=(10, 8))
ax = fig.add_subplot(111, projection='3d')

# 시간의 흐름에 따라 색상을 변화시킴
colors = plt.cm.viridis(np.linspace(0, 1, len(edge_vectors_3d)))

# 시간 순서대로 점을 연결하여 시각화
for i in range(len(edge_vectors_3d) - 1):
    ax.plot(edge_vectors_3d[i:i+2, 0], edge_vectors_3d[i:i+2, 1], edge_vectors_3d[i:i+2, 2], color=colors[i])

# 시작점과 끝점을 강조 표시
ax.scatter(edge_vectors_3d[0, 0], edge_vectors_3d[0, 1], edge_vectors_3d[0, 2], color='red', s=100, label='Start')
ax.scatter(edge_vectors_3d[-1, 0], edge_vectors_3d[-1, 1], edge_vectors_3d[-1, 2], color='blue', s=100, label='End')

ax.set_title("3D t-SNE Visualization of Video Frame Edge Vectors (Time Ordered)")
ax.set_xlabel('t-SNE Component 1')
ax.set_ylabel('t-SNE Component 2')
ax.set_zlabel('t-SNE Component 3')
ax.legend()
plt.show()
