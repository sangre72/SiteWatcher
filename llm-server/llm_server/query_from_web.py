import os

from langchain.vectorstores.chroma import Chroma
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.prompts import ChatPromptTemplate

CHROMA_PATH = "chroma"
PROMPT_TEMPLATE = """
Answer the question based only on the following context:

{context}

---

Answer the question based on the above context: {question}
"""


def handle_query(query_text):
    embedding_function = OpenAIEmbeddings()
    db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embedding_function)
    results = db.similarity_search_with_relevance_scores(query_text, k=3)

    if len(results) == 0 or results[0][1] < 0.7:
        return "Unable to find matching results."

    context_text = "\n\n---\n\n".join([doc.page_content for doc, _score in results])
    prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
    prompt = prompt_template.format(context=context_text, question=query_text)

    model = ChatOpenAI()
#    model_version = "gpt-4"
#    api_key = os.getenv('OPENAI_API_KEY')
#    model = ChatOpenAI(api_key=api_key, model=model_version)
    #최대 생성 토큰, 창의성 0이면 고정값
    #response = model.invoke("Your prompt here", max_tokens=150, temperature=0.7)

    response_text = model.invoke(prompt)
    sources = [doc.metadata.get("source", None) for doc, _score in results]
    formatted_response = f"{response_text}\nSources: {sources}"

    return formatted_response
