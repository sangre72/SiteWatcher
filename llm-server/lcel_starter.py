import os

from langchain_community.tools.tavily_search import TavilySearchResults
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_core.messages import HumanMessage, SystemMessage

from chrome.chrome_login import naver_blog
from db_vector_loader_graph import DatabaseVectorTool
from langchain_openai import ChatOpenAI
from typing import TypedDict, Annotated
import re
from typing import Literal

db_tool = DatabaseVectorTool()
tavily_tool= TavilySearchResults()
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
    # db_tool을 사용하여 데이터베이스 검색 실행
    query = state['messages'][0].content  # 사용자의 입력 내용
    print(f"------------------- query: {query}")
    results = db_tool.run({"messages": [HumanMessage(content=str(query))]})  # db_tool을 사용하여 쿼리 실행
    return {"messages": [SystemMessage(content=str(results))]}

def run_tavily_search(state: AgentState):
    # tavily_tool을 사용하여 검색 실행
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
    return "agent"  # 기본적으로 대화 응답을 반환

def display_results(state: AgentState):
    # 여기서는 단순히 결과 메시지를 출력합니다.
    print("[[[[ 최종 결과 ]]]]")
    last_message = state['messages'][-1]
    print(state)
    print(":::" +str(last_message.content))

    # 딕셔너리 데이터 예시
    raw_string = str(last_message.content)
    print(">>" + raw_string)
    match = re.search(r"content='(.+)'", raw_string)
    if match:
        final_content = match.group(1)
        print(final_content)
    naver_blog(query, final_content)
    return {"messages": [SystemMessage(content=f"Result: {last_message.content}")]}


workflow = StateGraph(AgentState)

# 상태 그래프에 결과 출력 노드 추가
workflow.add_node("display_results", display_results)


workflow.add_node("agent", call_model)
workflow.add_node("action", tool_node)

workflow.set_entry_point("agent")
workflow.add_edge('action', 'agent')

workflow.add_conditional_edges( "agent", decide_tool_based_on_input, )
workflow.add_node("db_search", run_db_search)
workflow.add_node("tavily_search", run_tavily_search)
workflow.add_node("end", lambda state: {"messages": [SystemMessage(content="Workflow completed.")]})

# 다른 노드에서 'end'로 이동하는 엣지 설정
workflow.add_edge("db_search", "display_results")
workflow.add_edge("tavily_search", "display_results")
workflow.add_edge('display_results', 'end')
workflow.add_edge("end", END)


app = workflow.compile()
#lettccmmndetailcode 테이블 데이터 조회
query = "lettccmmndetailcode 테이블 데이터 조회, 조회된 데이터는 json 으로 만들어."
#query = "lettccmmndetailcode 테이블 데이터 조회"
inputs = {"messages": [HumanMessage(content=query)]}
results = app.invoke(inputs)

