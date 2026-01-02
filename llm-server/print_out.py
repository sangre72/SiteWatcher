import os

from langchain_core.tools import StructuredTool

note_file = os.path.join("llm_server/doc_data", 'note.txt')

def note_to_screen(note: str) -> str:
    """Saves a note to a file."""
    print(note)

    return "Note printed."

# Create a FunctionTool for the save_note function
note_print_engine = StructuredTool.from_function(
    func=note_to_screen,
    name="write article to screen",
    description="write article to screen",
    # coroutine= ... <- you can specify an async method if desired as well
)
