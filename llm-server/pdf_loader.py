import os
from langchain.text_splitter import RecursiveCharacterTextSplitter, CharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings, OpenAI
from PyPDF2 import PdfReader


api_key = os.environ['OPENAI_API_KEY']

def read_pdf_files(file_paths):
    text = ""
    for file_path in file_paths:
        with open(file_path, 'rb') as file:
            reader = PdfReader(file)
            for page in reader.pages:
                text += page.extract_text() or ""
    return text

def get_text_chunks(text):
    text_splitter = CharacterTextSplitter(
        separator="\n",
        chunk_size=1000,
        chunk_overlap=100,
        length_function=len
    )
    return text_splitter.split_text(text)

embeddings = OpenAIEmbeddings(api_key=api_key)

def get_vectorstore(text_chunks):
    vectorstore = FAISS.from_texts(texts=text_chunks, embedding=embeddings)
    return vectorstore

# PDF 파일 로드. 파일의 경로 입력
pdf_file_paths = ["llm_server/doc_data/pdf/1.pdf","llm_server/doc_data/pdf/2.pdf"]  # Replace with actual file paths
raw_text = read_pdf_files(pdf_file_paths)
text_chunks = get_text_chunks(raw_text)
vector = get_vectorstore(text_chunks)
pdf_retriever = vector.as_retriever()