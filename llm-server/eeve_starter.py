# 위 코드와 동일
# client = OpenAI()
from langchain import hub
from langchain.agents import create_react_agent, AgentExecutor
from langchain_community.llms.ollama import Ollama
from langchain_core import tools
from langchain_core.prompts import PromptTemplate
from langchain_core.tools import create_retriever_tool
from openai import OpenAI

from db_note import db_note_engine
from db_vector_loader import db_retriever
from note import note_engine
from print_out import note_print_engine

llm = Ollama(model="eeve-korean", temperature=0)

db_retriever_tool = create_retriever_tool(
    db_retriever,
    name="database table information and data search",
    description="lettccmmndetailcode 테이블과 데이터!",
)

tools = [db_retriever_tool, note_engine, db_note_engine]
client = OpenAI(
    base_url = 'http://localhost:11434/v1', # Ollama 로컬 주소
    api_key='ollama', # 필수이지만 실제 사용되진 않음
)

response = client.chat.completions.create(
  model="eeve-korean",
  messages=[
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Who won the world series in 2020?"},
    {"role": "assistant", "content": "The Los Angeles Dodgers won the World Series in 2020."},
    {"role": "user", "content": "Where was it played?"}
  ]
)

prompt = hub.pull("hwchase17/react")

template = '''Answer the following questions as best you can. You have access to the following tools:

{tools}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Begin!

Question: {input}
Thought:{agent_scratchpad}'''

#prompt = PromptTemplate.from_template(template)

agent = create_react_agent(llm, tools, prompt)
agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,
    handle_parsing_errors=True,
    max_iterations=5,
    max_execution_time=100000,
)
# 대화 실행 루프
while True:
    user_question = input("질문하세요 : ")
    if user_question.lower() == 'q':
        break

    try :
        response = agent_executor.invoke({"input": user_question})
        print("[ 결과 ] : ", response)

        # 검색 결과 출력
        if 'Action Input:' in response:
            print("검색 결과:")
            print(response)
    except Exception as e:
        # 에러 처리
        print(f"while : {str(e)}")