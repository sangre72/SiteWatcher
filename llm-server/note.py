import os

from langchain_core.tools import StructuredTool

note_file = os.path.join("llm_server/doc_data", 'note.txt')

def note_to_file(note: str) -> str:
    """Saves a note to a file."""
    if not os.path.exists(note_file):
        open(note_file, 'w')

    try:
        with open(note_file, 'a') as f:
            print("--------------------------------------------------------------------", note)
            f.write(note + "\n")
    except Exception as e:
        print("파일 쓰기 중 오류가 발생했습니다:", e)

    return "Note saved."

# Create a FunctionTool for the save_note function
note_engine = StructuredTool.from_function(
    func=note_to_file,
    name="write article",
    description="Insert a note to the note.txt file",
    # coroutine= ... <- you can specify an async method if desired as well
)
