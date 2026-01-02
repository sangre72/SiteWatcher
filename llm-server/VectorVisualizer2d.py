import os
import numpy as np
import pandas as pd
import plotly.graph_objects as go
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer
from scipy.spatial import distance_matrix
from langchain.storage import LocalFileStore
from langchain.embeddings import CacheBackedEmbeddings
from langchain_openai import OpenAIEmbeddings
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.vectorstores import FAISS
from PyPDF2 import PdfReader

class VectorVisualizer:
    def __init__(self, api_key, model="text-embedding-ada-002", cache_dir="./cache/"):
        self.api_key = api_key
        self.embeddings = OpenAIEmbeddings(api_key=api_key, model=model)
        self.store = LocalFileStore(cache_dir)
        self.cached_embeddings = CacheBackedEmbeddings.from_bytes_store(
            self.embeddings, self.store, namespace=self.embeddings.model
        )
        self.vectorizer = TfidfVectorizer()
        self.reducer = None

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
        vectorstore = FAISS.from_texts(texts=text_chunks, embedding=self.cached_embeddings)
        return vectorstore

    def load_vectorstore(self, faiss_file_path):
        vectorstore = FAISS.load(faiss_file_path, embedding=self.cached_embeddings)
        return vectorstore

    def embed_documents(self, text_chunks):
        return self.cached_embeddings.embed_documents(text_chunks)

    def reduce_dimensions(self, vectors, method='pca', n_components=2):
        n_samples = vectors.shape[0]
        perplexity = min(30, n_samples - 1)
        if self.reducer is None or self.reducer.n_components != n_components:
            if method == 'pca':
                self.reducer = PCA(n_components=n_components)
            elif method == 'tsne':
                self.reducer = TSNE(n_components=n_components, perplexity=perplexity, n_iter=300)
            else:
                raise ValueError("method should be either 'pca' or 'tsne'")
        reduced_vectors = self.reducer.fit_transform(vectors)
        return reduced_vectors

    def cluster_data(self, embeddings, num_clusters=10):
        kmeans = KMeans(n_clusters=num_clusters, random_state=0).fit(embeddings)
        labels = kmeans.labels_
        return labels, kmeans

    def get_top_keywords(self, X, clusters, n_terms=5):
        df = pd.DataFrame(X.todense()).groupby(clusters).mean()
        terms = self.vectorizer.get_feature_names_out()
        keywords = []
        for i, row in df.iterrows():
            keywords.append([terms[t] for t in np.argsort(row)[-n_terms:]])
        return keywords

    def plot_embeddings_2d(self, vectors, labels, keywords):
        df = pd.DataFrame(vectors, columns=['x', 'y'])
        df['label'] = labels
        df['text'] = keywords

        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=df['x'], y=df['y'],
            mode='markers+text',
            text=df['text'],
            marker=dict(size=4, color=df['label'], colorscale='Viridis'),
            textposition='top center'
        ))

        # 각 포인트에 텍스트 추가
        fig.update_traces(textposition='top center')

        # 클러스터 중심점 계산
        cluster_centers = df.groupby('label')[['x', 'y']].mean().reset_index()

        # 클러스터 중심점 간의 연결선 추가
        for i in range(len(cluster_centers) - 1):
            for j in range(i + 1, len(cluster_centers)):
                fig.add_trace(go.Scatter(
                    x=[cluster_centers.loc[i, 'x'], cluster_centers.loc[j, 'x']],
                    y=[cluster_centers.loc[i, 'y'], cluster_centers.loc[j, 'y']],
                    mode='lines',
                    line=dict(color='gray', width=1)
                ))

        fig.update_layout(legend_title_text='Clusters')
        fig.show()

    def process_and_visualize(self, text_chunks, query_text, embeddings_list, method='tsne'):
        query_embedding = self.embed_documents([query_text])
        all_embeddings = np.vstack([embeddings_list, query_embedding])

        reduced_embeddings = self.reduce_dimensions(all_embeddings, method=method)

        labels, _ = self.cluster_data(embeddings_list)
        labels = np.append(labels, -1)

        X = self.vectorizer.fit_transform(text_chunks)
        top_keywords = self.get_top_keywords(X, labels[:-1], 5)

        keywords_per_point = [' '.join(top_keywords[label]) for label in labels if label != -1]
        keywords_per_point.append(query_text)

        self.plot_embeddings_2d(reduced_embeddings, labels, keywords_per_point)

    def visualize_from_pdfs(self, pdf_directory_path, query_text, method='tsne'):
        raw_text = self.read_pdf_files(pdf_directory_path)
        text_chunks = self.get_text_chunks(raw_text)
        embeddings_list = self.embed_documents(text_chunks)

        self.process_and_visualize(text_chunks, query_text, embeddings_list, method)

    def visualize_from_text_files(self, text_directory_path, query_text, method='tsne'):
        raw_text = self.read_text_files(text_directory_path)
        text_chunks = self.get_text_chunks(raw_text)
        embeddings_list = self.embed_documents(text_chunks)

        self.process_and_visualize(text_chunks, query_text, embeddings_list, method)

    def visualize_from_faiss(self, faiss_file_path, query_text, method='tsne'):
        vectorstore = self.load_vectorstore(faiss_file_path)
        text_chunks = vectorstore.get_texts()
        embeddings_list = vectorstore.get_vectors()

        self.process_and_visualize(text_chunks, query_text, embeddings_list, method)

    def visualize_from_csv(self, directory_path, query_text, method='tsne'):
        combined_df = self.load_csv_data(directory_path)

        text_chunks = combined_df.apply(lambda row: f"{row['date']} {row['time']} {row['team1']} vs {row['team2']} - {row['score1']}:{row['score2']} ({row['venue']}) {row['game_status']} {row['result']}", axis=1).tolist()

        embeddings_list = self.embed_documents(text_chunks)

        self.process_and_visualize(text_chunks, query_text, embeddings_list, method)

    def load_csv_data(self, directory_path):
        data = []
        for filename in os.listdir(directory_path):
            if filename.endswith('.csv'):
                file_path = os.path.join(directory_path, filename)
                df = pd.read_csv(file_path)

                required_columns = ['date', 'time', 'team1', 'team2', 'score1', 'score2', 'venue', 'game_status', 'result']
                if all(col in df.columns for col in required_columns):
                    data.append(df)
                else:
                    raise ValueError(f"The file {filename} does not contain the required columns")

        combined_df = pd.concat(data, ignore_index=True)
        return combined_df

# 사용 예시
api_key = os.environ['OPENAI_API_KEY']
visualizer = VectorVisualizer(api_key)

# PDF 파일에서 시각화
pdf_directory_path = "llm_server/doc_data/pdf"
query_text = "PDF 데이터"
#visualizer.visualize_from_pdfs(pdf_directory_path, query_text)

# 텍스트 파일에서 시각화
text_directory_path = "llm_server/doc_data/txt"
query_text = "TXT 데이터"
#visualizer.visualize_from_text_files(text_directory_path, query_text)

# CSV 파일에서 시각화
csv_directory_path = "llm_server/kbo/csv"
query_text = "KBO 경기 데이터"
visualizer.visualize_from_csv(csv_directory_path, query_text, method='tsne')
