import os

import torch
from langchain_community.chat_models import ChatOllama
from transformers import TrainingArguments, Trainer, AutoTokenizer
from datasets import Dataset
import pandas as pd
from langchain_community.chat_models import ChatOllama

# Ollama 모델 로드

# 데이터셋 로드 및 변환
def load_and_prepare_data(filename):
    df = pd.read_csv(filename)
    return Dataset.from_pandas(df)

def train_model(train_dataset):
    # 모델 식별자나 로컬 경로를 직접 사용
    model_path = "/Users/bumsuklee/.ollama/models/manifests/registry.ollama.ai/library/gemma/7b-instruct"

    # ChatOllama 인스턴스 생성
    model = ChatOllama(model="gemma:7b-instruct", temperature=0)

    # AutoTokenizer를 사용하여 토크나이저 초기화
    tokenizer = AutoTokenizer.from_pretrained(model_path)

    args = TrainingArguments(
        output_dir='./results',
        num_train_epochs=3,
        per_device_train_batch_size=4,
        warmup_steps=500,
        weight_decay=0.01,
        logging_dir='./logs',
        logging_steps=10,
    )

    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=train_dataset,
        tokenizer=tokenizer,
    )

    trainer.train()

if __name__ == '__main__':
    input_filename = os.path.join(os.getcwd(), 'AAPL100.csv')
    train_dataset = load_and_prepare_data(input_filename)
    train_model(train_dataset)
