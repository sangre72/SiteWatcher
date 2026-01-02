from langchain.agents import create_react_agent, AgentExecutor
from langchain.chains import ConversationChain
from langchain.memory import ConversationSummaryBufferMemory
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder, HumanMessagePromptTemplate
from langchain.llms import Ollama

from agent_starter import db_retriever_tool, pdf_retriever_tool
from db_note import db_note_engine
from note import note_engine
from print_out import note_print_engine
from search_tavily_api import search

# 도구 및 모델 초기화
llm = Ollama(model="eeve-korean", temperature=0)
tools = [db_retriever_tool, note_engine]
#[search, db_retriever_tool, pdf_retriever_tool, note_engine, db_note_engine]

# 프롬프트 템플릿 설정
AI_NAME = "kiki"
USER_NAME = "Mr.B"
prompt = ChatPromptTemplate(
    messages=[
        MessagesPlaceholder(variable_name="chat_history"),
        HumanMessagePromptTemplate.from_template("\n{user_input}\n" + AI_NAME + ":"),
    ]
)

# 에이전트 및 메모리 설정
agent = create_react_agent(llm, tools, prompt)

memory = ConversationSummaryBufferMemory(
    human_prefix=USER_NAME,
    ai_prefix=AI_NAME,
    llm=llm,
    memory_key="chat_history",
    return_messages=True,
    max_token_limit=8000,
)

agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    memory=memory,
        verbose=True,
    handle_parsing_errors=True,
    max_iterations=2000,
    max_execution_time=100000,
)

# 대화 실행 루프
while True:
    user_question = input("질문하세요 : ")
    if user_question.lower() == 'q':
        break

    response = agent_executor.invoke({"input": user_question})
    print("[ 결과 ] : ", response)

    # 검색 결과 출력
    if 'Action Input:' in response:
        print("검색 결과:")
        print(response)
