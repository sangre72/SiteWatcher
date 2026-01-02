import os
from typing import Optional, Any

import toolz
from langchain import hub
from langchain.agents import create_openai_functions_agent, AgentExecutor, create_json_chat_agent, create_react_agent
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain_community.chat_models import ChatOpenAI
from langchain.tools.retriever import create_retriever_tool
from openai import OpenAI

from db_vector_loader import db_retriever
from db_note import db_note_engine
from note import note_engine
from pdf_loader import pdf_retriever
from search_tavily_api import search, search_retriever

api_key = os.environ['OPENAI_API_KEY']
assistant_id = os.environ['ASSISTANT_ID4']
client = OpenAI(api_key=api_key)
agent = client.beta.assistants.retrieve(assistant_id=os.getenv("ASSISTANT_ID4"))
memory = ConversationBufferMemory()

n_gpu_layers = -1
n_batch = 32  # Should be between 1 and n_ctx, consider the amount of VRAM in your GPU.


pdf_retriever_tool = create_retriever_tool(
    pdf_retriever,
    name="pdf_search",
    description="전자정부 프레임워크 문서!",
)

db_retriever_tool = create_retriever_tool(
    db_retriever,
    name="database table information and data search",
    description="lettccmmndetailcode 테이블과 데이터!",
)

# tools 리스트에 search와 retriever_tool을 추가합니다.
tools = [search, db_retriever_tool, pdf_retriever_tool, note_engine, db_note_engine]
# LLM 모델을 생성합니다.
llm = ChatOpenAI(api_key=api_key, model="gpt-3.5-turbo", temperature=0)
# hub에서 prompt를 가져옵니다 - 이 부분을 수정할 수 있습니다!
#https://api.python.langchain.com/en/latest/agents/langchain.agents.json_chat.base.create_json_chat_agent.html
#prompt = hub.pull("hwchase17/openai-functions-agent") #: create_openai_functions_agent
#prompt = hub.pull("hwchase17/react-chat-json") #|,.;ㅣㅇㄴㅇㄹ호ㅓ어: create_react_agent
prompt = hub.pull("hwchase17/react")

agent = create_react_agent(llm, tools, prompt)

#openai 일때
#agent = create_openai_functions_agent(llm, tools, prompt)
#agent = create_react_agent(llm, tools, prompt)

# 메모리 객체 생성
memory = ConversationBufferMemory(memory_key='chat_history', return_messages=True)

# 에이전트 및 커스텀 실행기 생성
#custom_executor = CustomAgentExecutor(agent=agent, tools=tools, memory=memory)

#가타 상태에 따라 다름.
#agent = create_json_chat_agent(llm, tools, prompt)

# AgentExecutor 클래스를 사용하여 agent와 tools를 설정하고, 상세한 로그를 출력하도록 verbose를 True로 설정합니다.
agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,
    handle_parsing_errors=True,
    max_iterations=2,
)
#    handle_parsing_errors=True,
#    return_intermediate=True,

from langchain_core.messages import AIMessage, HumanMessage

while True:
    user_question = input("질문하세요 : ")
    if user_question.lower() == 'q':
        break

    # 커스텀 실행기를 통해 질문 처리
    #response = custom_executor.invoke({"input": user_question})

    response = agent_executor.invoke({"input": user_question,})

    print("[ 결과 ] : " , response)
