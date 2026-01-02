import os
import subprocess
import numpy as np
import pandas as pd
import plotly.graph_objects as go
from langchain_core.messages import HumanMessage
from sentence_transformers import SentenceTransformer
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer
from langchain.storage import LocalFileStore
from langchain.embeddings import CacheBackedEmbeddings
from langchain_openai import OpenAIEmbeddings
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain.schema import Document
from PyPDF2 import PdfReader
from transformers import AutoModel

from TextVectorTool import TextVectorTool


class VectorVisualizer:
    def __init__(self, api_key, model="text-embedding-ada-002", cache_dir="./cache/"):
        self.api_key = api_key
        self.model_name = model
        self.cache_dir = os.path.join(cache_dir, self.model_name.replace('/', '_'))
        self.models_dir = os.path.join(cache_dir, "models")

        os.makedirs(self.cache_dir, exist_ok=True)

        if "sentence-transformers" in model:
            self.embeddings = SentenceTransformer(model)
        elif "nomic-ai" in model:
            self.model_path = os.path.join(self.models_dir, "nomic-embed-text-v1.5.f16.gguf")
            if not os.path.exists(self.model_path):
                self.download_model()
            self.matryoshka_dim = 512
            # 사용자 정의 코드를 실행하도록 명시적으로 승인
            self.model = AutoModel.from_pretrained(model, trust_remote_code=True)
            self.embeddings = SentenceTransformer(model, trust_remote_code=True)
        else:
            self.embeddings = OpenAIEmbeddings(api_key=api_key, model=model)

        self.store = LocalFileStore(self.cache_dir)
        self.cached_embeddings = CacheBackedEmbeddings.from_bytes_store(
            self.embeddings, self.store, namespace=self.model_name
        )
        self.vectorizer = TfidfVectorizer()
        self.reducer = None

    def download_model(self):
        # 모델 다운로드 함수
        model_dir = os.path.dirname(self.model_path)
        if not os.path.exists(model_dir):
            os.makedirs(model_dir)
        # llama.cpp 를 이용 할 경우
        url = "https://huggingface.co/nomic-ai/nomic-embed-text-v1.5-GGUF/resolve/main/nomic-embed-text-v1.5.f16.gguf"
        cmd = f"wget -O {self.model_path} {url}"
        subprocess.run(cmd, shell=True, check=True)

    def read_pdf_files(self, directory_path):
        text = ""
        for filename in os.listdir(directory_path):
            if filename.endswith('.pdf'):
                file_path = os.path.join(directory_path, filename)
                with open(file_path, 'rb') as file:
                    reader = PdfReader(file)
                    for page in reader.pages:
                        text += page.extract_text() or ""
        return text

    def read_text_files(self, directory_path):
        text = ""
        for filename in os.listdir(directory_path):
            if filename.endswith('.txt'):
                file_path = os.path.join(directory_path, filename)
                with open(file_path, 'r', encoding='utf-8') as file:
                    text += file.read() + "\n"
        return text

    def get_text_chunks(self, text):
        text_splitter = CharacterTextSplitter(
            separator="\n",
            chunk_size=1000,
            chunk_overlap=50,
            length_function=len
        )
        return text_splitter.split_text(text)

    def get_vectorstore(self, text_chunks):
        documents = [Document(page_content=text, metadata={"source": "local"}) for text in text_chunks]
        vectorstore = FAISS.from_documents(documents=documents, embedding=self.cached_embeddings)
        return vectorstore

    def load_vectorstore(self, vector_store_path):
        if os.path.exists(vector_store_path):
            vector_store = FAISS.load_local(
                vector_store_path,
                OpenAIEmbeddings(api_key=self.api_key, model=self.model_name),
                allow_dangerous_deserialization=True  # 안전한 데이터 파일을 로드하는 경우에만 설정
            )
            self.retriever = vector_store.as_retriever(
                search_kwargs={'k': 50},
                retrieve_kwargs={'retrieve_all': True}
            )
            return vector_store

    def get_vectors_from_store(self, vector_store):
        # FAISS index에서 벡터를 추출합니다.
        return vector_store.index.reconstruct_n(0, vector_store.index.ntotal)

    def embed_documents(self, text_chunks):
        # 입력된 모델에 따라 문장 임베딩 생성
        if isinstance(self.embeddings, SentenceTransformer):
            return np.array(self.embeddings.encode(text_chunks, show_progress_bar=True))
        else:
            return np.array(self.cached_embeddings.embed_documents(text_chunks))

    def reduce_dimensions(self, vectors, method='pca', n_components=3):
        n_samples = vectors.shape[0]
        perplexity = min(30, n_samples - 1)  # perplexity 값을 데이터 포인트 수보다 작게 설정
        if self.reducer is None or self.reducer.n_components != n_components:
            if method == 'pca':
                self.reducer = PCA(n_components=n_components)
            elif method == 'tsne':
                self.reducer = TSNE(n_components=n_components, perplexity=perplexity, n_iter=300)
            else:
                raise ValueError("method should be either 'pca' or 'tsne'")
        reduced_vectors = self.reducer.fit_transform(vectors)
        return reduced_vectors

    def cluster_data(self, embeddings, num_clusters=11):
        kmeans = KMeans(n_clusters=num_clusters, random_state=0).fit(embeddings)
        labels = kmeans.labels_
        return labels, kmeans

    def get_top_keywords(self, X, clusters, n_terms=5):
        df = pd.DataFrame(X.todense()).groupby(clusters).mean()  # 각 클러스터의 평균 tf-idf 값 계산
        terms = self.vectorizer.get_feature_names_out()
        keywords = []
        for i, row in df.iterrows():
            keywords.append([terms[t] for t in np.argsort(row)[-n_terms:]])
        return keywords

    def plot_embeddings_3d(self, vectors, labels, keywords):
        df = pd.DataFrame(vectors, columns=['x', 'y', 'z'])
        df['label'] = labels
        df['text'] = keywords

        fig = go.Figure()
        fig.add_trace(go.Scatter3d(
            x=df['x'], y=df['y'], z=df['z'],
            mode='markers+text',
            text=df['text'],
            marker=dict(size=4, color=df['label'], colorscale='Viridis'),
            textposition='top center'
        ))

        fig.update_traces(textposition='top center')

        # 클러스터 중심점 계산
        cluster_centers = df.groupby('label')[['x', 'y', 'z']].mean().reset_index()

        # 클러스터 중심점 간의 연결선 추가
        for i in range(len(cluster_centers) - 1):
            for j in range(i + 1, len(cluster_centers)):
                fig.add_trace(go.Scatter3d(
                    x=[cluster_centers.loc[i, 'x'], cluster_centers.loc[j, 'x']],
                    y=[cluster_centers.loc[i, 'y'], cluster_centers.loc[j, 'y']],
                    z=[cluster_centers.loc[i, 'z']],
                    mode='lines',
                    line=dict(color='gray', width=1)
                ))

        fig.update_layout(legend_title_text='Clusters')
        fig.show()

    def process_and_visualize(self, text_chunks, query_text, embeddings_list, method='tsne'):
        # 쿼리 임베딩 추가
        query_embedding = self.embed_documents([query_text])

        # Check if dimensions match before stacking
        if query_embedding.shape[1] != embeddings_list.shape[1]:
            raise ValueError("Query embedding dimensions do not match embeddings list dimensions.")

        all_embeddings = np.vstack([embeddings_list, query_embedding])

        reduced_embeddings = self.reduce_dimensions(all_embeddings, method=method)

        # 클러스터링 및 키워드 추출
        labels, _ = self.cluster_data(embeddings_list)
        labels = np.append(labels, -1)  # -1을 사용하여 쿼리 포인트를 표시

        if text_chunks is not None:
            X = self.vectorizer.fit_transform(text_chunks)
            top_keywords = self.get_top_keywords(X, labels[:-1], 5)

            keywords_per_point = [' '.join(top_keywords[label]) for label in labels if label != -1]
            keywords_per_point.append(query_text)
        else:
            keywords_per_point = [query_text] * len(labels)

        self.plot_embeddings_3d(reduced_embeddings, labels, keywords_per_point)

    def visualize_from_pdfs(self, pdf_file_paths, query_text, method='tsne'):
        raw_text = self.read_pdf_files(pdf_file_paths)
        text_chunks = self.get_text_chunks(raw_text)
        embeddings_list = self.embed_documents(text_chunks)

        self.process_and_visualize(text_chunks, query_text, embeddings_list, method)

    def visualize_from_faiss(self, faiss_file_path, query_text, method='tsne'):
        vectorstore = self.load_vectorstore(faiss_file_path)
        embeddings_list = self.get_vectors_from_store(vectorstore)

        self.process_and_visualize(None, query_text, embeddings_list, method)

    def visualize_from_csv(self, directory_path, query_text, method='tsne'):
        combined_df = self.load_csv_data(directory_path)

        # 텍스트 데이터를 생성합니다.
        text_chunks = combined_df.apply(lambda
                                            row: f"{row['date']} {row['time']} {row['team1']} vs {row['team2']} - {row['score1']}:{row['score2']} ({row['venue']}) {row['game_status']} {row['result']}",
                                        axis=1).tolist()
        # 텍스트 데이터를 기반으로 임베딩을 생성합니다.
        embeddings_list = self.embed_documents(text_chunks)
        self.process_and_visualize(text_chunks, query_text, embeddings_list, method)

    def visualize_from_text_files(self, text_file_directory, query_text, method='tsne'):
        raw_text = self.read_text_files(text_file_directory)
        text_chunks = self.get_text_chunks(raw_text)
        embeddings_list = self.embed_documents(text_chunks)
        self.process_and_visualize(text_chunks, query_text, embeddings_list, method)

    def load_csv_data(self, directory_path):
        data = []
        # 디렉토리 내의 모든 파일 확인
        for filename in os.listdir(directory_path):
            if filename.endswith('.csv'):
                file_path = os.path.join(directory_path, filename)
                df = pd.read_csv(file_path)

                # 필요한 컬럼이 모두 있는지 확인
                required_columns = ['date', 'time', 'team1', 'team2', 'score1', 'score2', 'venue', 'game_status',
                                    'result']
                if all(col in df.columns for col in required_columns):
                    data.append(df)
                else:
                    raise ValueError(f"The file {filename} does not contain the required columns")

        # 모든 데이터를 하나의 DataFrame으로 병합
        combined_df = pd.concat(data, ignore_index=True)
        return combined_df


    def search_vectorstore(self, query_text, vector_store_path, k=3):
        vector_store = self.load_vectorstore(vector_store_path)
        retriever = vector_store.as_retriever(search_kwargs={'k': k}, retrieve_kwargs={'retrieve_all': True})
        query_embedding = self.embed_documents([query_text])
        results = retriever.get_relevant_documents(query_text)

        return [(result.page_content, result.metadata) for result in results[:1]]

# 사용 예시
api_key = os.environ['OPENAI_API_KEY']
# "text-embedding-ada-002"
# sentence-transformers/all-MiniLM-L6-v2
# nomic-ai/nomic-embed-text-v1.5
# 1. llama.cpp 설치 및 설정 모델에 따라 huggingface 가 아일 수도 있다. 검색해서 설치 및 다운로드 진행 해야함.
visualizer = VectorVisualizer(api_key, model="text-embedding-ada-002")
# visualizer = VectorVisualizer(api_key, model="sentence-transformers/all-MiniLM-L6-v2")
# visualizer = VectorVisualizer(api_key, model="nomic-ai/nomic-embed-text-v1.5")

# PDF 파일에서 시각화
# pdf_file_paths = ["llm_server/doc_data/pdf/1.pdf", "llm_server/doc_data/pdf/2.pdf"]
pdf_file_path = "llm_server/doc_data/pdf"
query_text = "PDF 데이터"
# visualizer.visualize_from_pdfs(pdf_file_path, query_text)

query_text = "KBO 경기 데이터"
csv_file_path = "llm_server/kbo/csv"  # 실제 FAISS 파일 경로로 대체
visualizer.visualize_from_csv(csv_file_path, query_text, method='tsne')

query_text = "TXT 데이터"
txt_file_path = "llm_server/doc_data/txt"  # 실제 FAISS 파일 경로로 대체
# visualizer.visualize_from_text_files(txt_file_path, query_text, method='tsne')

query_text = "React 데이터"
faiss_file_path = "database/middle/vector_store.faiss"  # 실제 FAISS 파일 경로로 대체
#visualizer.visualize_from_faiss(faiss_file_path, query_text, method='tsne')

# 검색 예시
db_tool = TextVectorTool(vector_store_path=faiss_file_path)

# 파일 내용을 벡터 데이터베이스로 로드
query_text = {"messages": [HumanMessage(content="const MyComponent")]}
results = db_tool.run(query_text, faiss_file_path)
print(results.content)


# 검색 예시
search_query = "const MyComponent"
search_results = visualizer.search_vectorstore(search_query, faiss_file_path)
print("검색 결과:", search_results)