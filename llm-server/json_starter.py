import os
from typing import Optional, Any

from flask import request, jsonify, app, Flask
from flask_cors import CORS
from langchain import hub
from langchain.agents import create_openai_functions_agent, AgentExecutor, create_json_chat_agent, create_react_agent
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain_community.chat_models import ChatOpenAI
from langchain.tools.retriever import create_retriever_tool
from openai import OpenAI

from note import note_engine
from pdf_loader import retriever
from search_tavily_api import search, search_retriever
app = Flask(__name__)

CORS(app)  # CORS 설정을 통해 모든 도메인에서의 요청을 허용

api_key = os.environ['OPENAI_API_KEY']
assistant_id = os.environ['ASSISTANT_ID4']
client = OpenAI(api_key=api_key)
agent = client.beta.assistants.retrieve(assistant_id=os.getenv("ASSISTANT_ID4"))
memory = ConversationBufferMemory()


## 시도 했으나 일단 싶패
class CustomAgentExecutor:
    def __init__(self, agent, tools, memory):
        self.agent = agent
        self.tools = tools
        self.memory = memory
        self.conversation_chain = None  # 초기화를 안전하게 수행하기 위해 None으로 시작

        # 도구 목록에서 'pdf_search' 도구를 찾아 리트리버를 설정
        pdf_search_tool = next((tool for tool in tools if tool.name == 'pdf_search'), None)
        retriever = pdf_search_tool.func.keywords['retriever']
        self.conversation_chain = ConversationalRetrievalChain.from_llm(
            llm=self.agent,
            retriever=retriever,
            memory=self.memory
        )

    def invoke(self, data):
        question = data['input']
        response = self.conversation_chain({'question': question})
        return response


retriever_tool = create_retriever_tool(
    retriever,
    name="pdf_search",
    description="전자정부 프레임워크 문서!",
)

tools = [search, retriever_tool, note_engine]
llm = ChatOpenAI(api_key=api_key, model="gpt-4-turbo-2024-04-09", temperature=0)
prompt = hub.pull("hwchase17/react")
agent = create_react_agent(llm, tools, prompt)
memory = ConversationBufferMemory(memory_key='chat_history', return_messages=True)

agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,
    handle_parsing_errors=True,
    return_intermediate=True,
)

@app.route('/react', methods=['GET'])
def react():
    question = request.args.get('q')
    if not question:
        return jsonify({"error": "No question provided"}), 400

    # Use the executor to process the question
    response = agent_executor.invoke({"input": question})

    # Save the response to a file
    # Return the response and file path
    return jsonify({"response": response})

if __name__ == '__main__':
    app.run(debug=True)
