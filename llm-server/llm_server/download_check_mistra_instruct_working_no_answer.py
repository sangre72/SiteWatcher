import torch
from langchain_community.llms.ctransformers import CTransformers
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate

def process_question(question, llm_chain):
    try:
        print("Generating answer for question:", question)
        answer = llm_chain.run({"question": question}).strip()
        print("Generated Answer:", answer)
        return answer
    except Exception as e:
        print(f"Error processing question: {e}")
        return None

def main():

    model_path = "/Users/bumsuklee/PhpstormProjects/20240418-git-test-prototype-cms/llm-server/llm_server/output/MaziyarPanahi_Mistral-7B-Instruct-v0.3-GGUF/Mistral-7B-Instruct-v0.3.IQ2_XS.gguf"
    print("Setting device...")
    device = torch.device(
        "cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu"
    )
    print("Device set to:", device)

    print("Loading model...")
    try:
        llm = CTransformers(model=model_path, model_type="mistral", gpu_layers=50, device=device)
        print("Model loaded successfully.")
    except Exception as e:
        print(f"Error loading model: {e}")
        return

    prompt_template = PromptTemplate(
        template="Answer the following question in detail: {question}",
        input_variables=["question"]
    )
    llm_chain = LLMChain(llm=llm, prompt=prompt_template)

    while True:
        question = input("Enter your question: ")
        if question.lower() in ['exit', 'quit']:
            break

        print("Processing question...")
        answer = process_question(question, llm_chain)
        print("Answer processing complete.")

        if answer:
            print("ANSWER:\n", answer)
        else:
            print("No valid answer generated.")

if __name__ == '__main__':
    main()


