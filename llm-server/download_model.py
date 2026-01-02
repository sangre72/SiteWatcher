import os
import subprocess

import requests
from transformers import AutoTokenizer, AutoModelForCausalLM


class HuggingFaceDownloader:
    def __init__(self, model_name, model_page_url, cache_dir="./cache/"):
        self.model_name = model_name
        self.model_page_url = model_page_url
        self.cache_dir = cache_dir
        self.model_dir = os.path.join(cache_dir, model_name.replace("/", "_"))

        os.makedirs(self.model_dir, exist_ok=True)
        self.file_list = [
            "config.json",
            "pytorch_model.bin",
            "tokenizer.json",
            "vocab.txt",  # 추가 파일 필요시 목록에 추가
            model_name
        ]

    def download_file(self, file_name):
        url = f"{self.model_page_url}/resolve/main/{file_name}"
        response = requests.get(url)
        if response.status_code == 200:
            file_path = os.path.join(self.model_dir, file_name)
            with open(file_path, 'wb') as f:
                f.write(response.content)
            print(f"Downloaded {file_name}")
            return True
        else:
            print(f"Failed to download {file_name}")
            return False

    def download_model(self):
        downloaded_files = []
        for file_name in self.file_list:
            if self.download_file(file_name):
                downloaded_files.append(file_name)
        return downloaded_files

    def download_model2(self):
        # 모델 다운로드 함수
        model_dir = os.path.dirname(self.model_path)
        if not os.path.exists(model_dir):
            os.makedirs(model_dir)
        # llama.cpp 를 이용 할 경우
        url = "https://huggingface.co/nomic-ai/nomic-embed-text-v1.5-GGUF/resolve/main/nomic-embed-text-v1.5.f16.gguf"
        cmd = f"wget -O {self.model_path} {url}"
        subprocess.run(cmd, shell=True, check=True)

    def load_model(self):
        downloaded_files = self.download_model()
        missing_files = [file for file in self.file_list if file not in downloaded_files]

        if missing_files:
            raise FileNotFoundError(f"Missing files: {', '.join(missing_files)}")

        self.tokenizer = AutoTokenizer.from_pretrained(self.model_dir)
        self.model = AutoModelForCausalLM.from_pretrained(self.model_dir)

    def query(self, prompt: str) -> str:
        inputs = self.tokenizer(prompt, return_tensors="pt")
        outputs = self.model.generate(**inputs, max_length=512, num_return_sequences=1)
        response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        return response


# 예제 사용
model_name = "Meta-Llama-3-8B-Instruct.Q2_K.gguf"
model_page_url = "https://huggingface.co/QuantFactory/Meta-Llama-3-8B-Instruct-GGUF"

hf_downloader = HuggingFaceDownloader(model_name=model_name, model_page_url=model_page_url)
try:
    hf_downloader.load_model()
    query_text = "Explain the significance of quantum computing."
    response = hf_downloader.query(query_text)
    print("Response from Llama:", response)
except FileNotFoundError as e:
    print(e)
