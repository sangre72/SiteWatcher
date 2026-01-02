from langchain_community.llms import Ollama

llm = Ollama(model="llama3")

result = llm.invoke("Tell me a joke")
print(result)