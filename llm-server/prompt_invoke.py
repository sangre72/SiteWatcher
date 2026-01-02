import os
from dotenv import load_dotenv
from PyPDF2 import PdfReader
from langchain.text_splitter import CharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_openai import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationalRetrievalChain

api_key = os.getenv('OPENAI_API_KEY')


def read_pdf_files(file_paths):
    text = ""
    for file_path in file_paths:
        with open(file_path, 'rb') as file:
            reader = PdfReader(file)
            for page in reader.pages:
                text += page.extract_text()
    return text


def get_text_chunks(text):
    text_splitter = CharacterTextSplitter(
        separator="\n",
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    chunks = text_splitter.split_text(text)
    return chunks


def get_vectorstore(text_chunks):
    embeddings = OpenAIEmbeddings(api_key=api_key)
    vectorstore = FAISS.from_texts(texts=text_chunks, embedding=embeddings)
    return vectorstore


def get_conversation_chain(vectorstore):
    llm = ChatOpenAI(api_key=api_key)
    memory = ConversationBufferMemory(memory_key='chat_history', return_messages=True)
    conversation_chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=vectorstore.as_retriever(),
        memory=memory
    )
    return conversation_chain


def ask_question(question, conversation_chain):
    response = conversation_chain({'question': question})
    return response['chat_history'][-1].content


def main():
    load_dotenv()

    # Get PDF documents
    pdf_file_paths = ["llm_server/doc_data/pdf/1.pdf","llm_server/doc_data/pdf/2.pdf"]  # Replace with actual file paths

    # Read PDF files
    raw_text = read_pdf_files(pdf_file_paths)
    text_chunks = get_text_chunks(raw_text)
    vectorstore = get_vectorstore(text_chunks)
    conversation_chain = get_conversation_chain(vectorstore)

    while True:
        user_question = input("Ask a question about your documents (type 'exit' to quit): ")
        if user_question.lower() == 'exit':
            break
        response = ask_question(user_question, conversation_chain)
        print(response)


if __name__ == '__main__':
    main()
