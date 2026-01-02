import os
import sys
import time
from openai import OpenAI


def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')


def print_header():
    print("=" * 50)
    print("        Interactive AI Assistant Dashboard")
    print("=" * 50)
    print("\nType your message below. Press Ctrl+C to exit.\n")


def print_history(history):
    for message in history[1:]:  # Skip the system message
        role = message["role"]
        content = message["content"]
        if role == "user":
            print(f"\n👤 You: {content}")
        elif role == "assistant":
            print(f"\n🤖 AI: {content}")


client = OpenAI(base_url="http://localhost:1234/v1", api_key="lm-studio")

history = [
    {"role": "system",
     "content": "You are an intelligent assistant. You always provide well-reasoned answers that are both correct and helpful."},
    {"role": "user",
     "content": "Hello, introduce yourself to someone opening this program for the first time. Be concise."},
]

try:
    while True:
        clear_screen()
        print_header()
        print_history(history)

        if len(history) == 2:  # Only system message and initial user message
            print("\n🤖 AI is thinking...", end="", flush=True)
            completion = client.chat.completions.create(
                model="MLP-KTLim/llama-3-Korean-Bllossom-8B-gguf-Q4_K_M",
                messages=history,
                temperature=0.7,
                stream=True,
            )
            new_message = {"role": "assistant", "content": ""}
            for chunk in completion:
                if chunk.choices[0].delta.content:
                    print(chunk.choices[0].delta.content, end="", flush=True)
                    new_message["content"] += chunk.choices[0].delta.content
            history.append(new_message)
            time.sleep(1)
            continue

        user_input = input("\n👤 You: ")
        history.append({"role": "user", "content": user_input})

        print("\n🤖 AI: ", end="", flush=True)
        completion = client.chat.completions.create(
            model="MLP-KTLim/llama-3-Korean-Bllossom-8B-gguf-Q4_K_M",
            messages=history,
            temperature=0.7,
            stream=True,
        )
        new_message = {"role": "assistant", "content": ""}
        for chunk in completion:
            if chunk.choices[0].delta.content:
                print(chunk.choices[0].delta.content, end="", flush=True)
                new_message["content"] += chunk.choices[0].delta.content
        history.append(new_message)

        print("\n\nPress Enter to continue...")
        input()

except KeyboardInterrupt:
    print("\n\nThank you for using the AI Assistant. Goodbye!")
    sys.exit(0)