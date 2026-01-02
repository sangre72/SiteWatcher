import os
import glob
import json
import time

from langchain_community.tools.tavily_search import TavilySearchResults
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_core.messages import HumanMessage, SystemMessage

from TextVectorTool import read_files_from_directory
from chrome.chrome_login import naver_blog
from db_vector_loader_graph import DatabaseVectorTool
from langchain_openai import ChatOpenAI
from typing import TypedDict, Annotated
import re
from typing import Literal

db_tool = DatabaseVectorTool()
tavily_tool = TavilySearchResults()
tools = [db_tool, tavily_tool]
tool_node = ToolNode(tools)
model = ChatOpenAI(model="gpt-3.5-turbo", temperature=0, streaming=True)
model = model.bind_tools(tools)

def add_messages(left: list, right: list):
    """Add-don't-overwrite."""
    return left + right

class AgentState(TypedDict):
    messages: Annotated[list, add_messages]

def should_continue(state: AgentState) -> Literal["action", "__end__"]:
    messages = state['messages']
    last_message = messages[-1]
    if last_message.tool_calls:
        return "action"
    return "__end__"

def call_model(state: AgentState):
    messages = state['messages']
    response = model.invoke(messages)
    return {"messages": [response]}

def run_db_search(state: AgentState):
    print("run_db_search==================", state['messages'])
    query = state['messages'][0].content
    print(f"------------------- query: {query}")
    results = db_tool.run({"messages": [HumanMessage(content=str(query))]})
    return {"messages": [SystemMessage(content=str(results))]}

def run_tavily_search(state: AgentState):
    query = state['messages'][0].content
    results = tavily_tool.run(query)
    return {"messages": [SystemMessage(content=str(results))]}

def end_workflow(state: AgentState):
    return {"messages": [SystemMessage(content="Workflow completed.")]}

def decide_tool_based_on_input(query_text):
    input_content = query_text['messages'][0].content
    if "검색" in input_content:
        print("tavily")
        return "tavily_search"
    elif "조회" in input_content:
        print("db")
        return "db_search"
    return "agent"

def display_results(state: AgentState):
    print("[[[[ 최종 결과 ]]]]")
    last_message = state['messages'][-1]
    print(state)
    print(":::" + str(last_message.content))

    raw_string = str(last_message.content)
    print(">>" + raw_string)
    match = re.search(r"content='(.+)'", raw_string)
    if match:
        final_content = match.group(1)
        print(final_content)
    naver_blog(query, final_content)
    return {"messages": [SystemMessage(content=f"Result: {last_message.content}")]}

def load_files_to_db(directory: str, db_dir: str):
    file_details = read_files_from_directory(directory)
    db_files = os.listdir(db_dir)
    db_files_paths = [os.path.join(db_dir, file) for file in db_files]

    for file_detail in file_details:
        file_path = file_detail['path']
        file_content = file_detail['content']
        file_modified_time = file_detail['modified_time']
        vectorized_content = db_tool.vectorize(file_content)  # 파일 내용을 벡터화

        existing_vector_file = None
        for db_file_path in db_files_paths:
            db_file_stats = os.stat(db_file_path)
            db_file_modified_time = db_file_stats.st_mtime

            if db_file_modified_time < file_modified_time:
                existing_vector_file = db_file_path
                break

        if existing_vector_file:
            os.remove(existing_vector_file)  # 기존 벡터 파일 삭제

        output_path = os.path.join(db_dir, f'vectorized_{os.path.basename(file_path)}.json')
        with open(output_path, 'w', encoding='utf-8') as output_file:
            json.dump(vectorized_content, output_file, ensure_ascii=False, indent=4)  # 벡터화된 내용을 JSON으로 저장

workflow = StateGraph(AgentState)

workflow.add_node("display_results", display_results)
workflow.add_node("agent", call_model)
workflow.add_node("action", tool_node)

workflow.set_entry_point("agent")
workflow.add_edge('action', 'agent')

workflow.add_conditional_edges("agent", decide_tool_based_on_input)
workflow.add_node("db_search", run_db_search)
workflow.add_node("tavily_search", run_tavily_search)
workflow.add_node("end", lambda state: {"messages": [SystemMessage(content="Workflow completed.")]})

workflow.add_edge("db_search", "display_results")
workflow.add_edge("tavily_search", "display_results")
workflow.add_edge('display_results', 'end')
workflow.add_edge("end", END)

app = workflow.compile()

# 지정된 디렉토리의 파일을 데이터베이스로 로드
directory_to_read = '/Users/bumsuklee/PhpstormProjects/20240418-git-test-prototype-cms/middleware/node'  # 여기에 지정된 디렉토리 경로를 입력하세요
db_directory = './database/middle'  # 벡터화된 파일을 저장할 디렉토리
os.makedirs(db_directory, exist_ok=True)  # 디렉토리 존재 여부 확인 및 생성
load_files_to_db(directory_to_read, db_directory)

query = "lettccmmndetailcode 테이블 데이터 조회, 조회된 데이터는 json 으로 만들어."
inputs = {"messages": [HumanMessage(content=query)]}
results = app.invoke(inputs)

