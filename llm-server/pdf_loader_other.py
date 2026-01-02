import os
import numpy as np
import pandas as pd
import plotly.express as px
from langchain.storage import LocalFileStore
from langchain.embeddings import CacheBackedEmbeddings
from langchain_openai import OpenAIEmbeddings
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.vectorstores import FAISS
from PyPDF2 import PdfReader

# OpenAI API 키 설정
api_key = os.environ['OPENAI_API_KEY']

# PDF 파일에서 텍스트를 읽는 함수
def read_pdf_files(file_paths):
    text = ""
    for file_path in file_paths:
        with open(file_path, 'rb') as file:
            reader = PdfReader(file)
            for page in reader.pages:
                text += page.extract_text() or ""
    return text

# 텍스트를 일정 크기의 조각으로 나누는 함수
def get_text_chunks(text):
    text_splitter = CharacterTextSplitter(
        separator="\n",
        chunk_size=1000,
        chunk_overlap=50,
        length_function=len
    )
    return text_splitter.split_text(text)

# OpenAI 임베딩 생성 및 캐시 설정
embeddings = OpenAIEmbeddings(api_key=api_key, model="text-embedding-ada-002")

# 캐시 설정
store = LocalFileStore("./cache/")
cached_embeddings = CacheBackedEmbeddings.from_bytes_store(
    embeddings, store, namespace=embeddings.model
)

# 텍스트 조각을 벡터 스토어에 저장하는 함수
def get_vectorstore(text_chunks):
    vectorstore = FAISS.from_texts(texts=text_chunks, embedding=cached_embeddings)
    return vectorstore

# PDF 파일 로드 및 텍스트 조각 생성
pdf_file_paths = ["llm_server/doc_data/pdf/1.pdf", "llm_server/doc_data/pdf/2.pdf"]  # 실제 파일 경로로 대체
raw_text = read_pdf_files(pdf_file_paths)
text_chunks = get_text_chunks(raw_text)
vector = get_vectorstore(text_chunks)
pdf_retriever_other = vector.as_retriever()

# 벡터 데이터 추출
embeddings_list = cached_embeddings.embed_documents(text_chunks)

# 검색 쿼리 임베딩
query = "소프트웨어 프레임워크의 정의"
query_embedding = cached_embeddings.embed_documents([query])

# 원본 임베딩 공간에서 쿼리 포인트를 추가
all_embeddings = np.vstack([embeddings_list, query_embedding])

# 리스트를 numpy array로 변환
embeddings_array = np.array(all_embeddings)

# 차원 축소 (PCA 또는 t-SNE)
def reduce_dimensions(vectors, method='pca'):
    if method == 'pca':
        reducer = PCA(n_components=3)  # 3D 시각화를 위해 3차원으로 축소
    elif method == 'tsne':
        reducer = TSNE(n_components=3, perplexity=30, n_iter=300)  # 3D 시각화를 위해 3차원으로 축소
    else:
        raise ValueError("method should be either 'pca' or 'tsne'")

    reduced_vectors = reducer.fit_transform(vectors)
    return reduced_vectors

# 벡터 데이터 차원 축소
reduced_embeddings = reduce_dimensions(embeddings_array, method='tsne')

# 클러스터링 (K-means)
num_clusters = 5  # 클러스터 개수 설정
kmeans = KMeans(n_clusters=num_clusters, random_state=0).fit(embeddings_list)
labels = kmeans.labels_

# 클러스터 레이블에 쿼리 레이블 추가
labels = np.append(labels, -1)  # -1을 사용하여 쿼리 포인트를 표시

# 대표 문장 추출을 위한 TF-IDF 벡터화
vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(text_chunks)

def get_top_keywords(X, clusters, n_terms):
    df = pd.DataFrame(X.todense()).groupby(clusters).mean()  # 각 클러스터의 평균 tf-idf 값 계산
    terms = vectorizer.get_feature_names_out()
    keywords = []
    for i, row in df.iterrows():
        keywords.append([terms[t] for t in np.argsort(row)[-n_terms:]])
    return keywords

top_keywords = get_top_keywords(X, labels[:-1], 5)  # 각 클러스터의 상위 5개 키워드 추출

# 각 데이터 포인트에 해당하는 키워드 할당
keywords_per_point = [' '.join(top_keywords[label]) for label in labels if label != -1]

# 쿼리 포인트에 대한 키워드 추가
keywords_per_point.append("소프트웨어 프레임워크의 정의")

# 차원 축소된 벡터를 이미지로 시각화
def plot_embeddings_3d(vectors, labels, keywords):
    df = pd.DataFrame(vectors, columns=['x', 'y', 'z'])
    df['label'] = labels
    df['text'] = keywords

    fig = px.scatter_3d(df, x='x', y='y', z='z', color='label', text='text', title="3D 시각화 텍스트 임베딩 클러스터링",
                        labels={'x': 'Dimension 1', 'y': 'Dimension 2', 'z': 'Dimension 3'})

    # 각 포인트에 텍스트 추가
    fig.update_traces(textposition='top center')
    fig.update_layout(legend_title_text='Clusters')
    fig.show()

# 시각화 실행
plot_embeddings_3d(reduced_embeddings, labels, keywords_per_point)
