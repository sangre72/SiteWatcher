# 모델, 토크나이저 로드
#model_path = "/Users/bumsuklee/.ollama/models/manifests/registry.ollama.ai/library/gemma/7b-instruct"
import os

import torch
from langchain_community.chat_models import ChatOllama
from transformers import AutoTokenizer, TrainingArguments, Trainer
from datasets import load_dataset
import pandas as pd

def load_and_prepare_data(filename):
    df = pd.read_csv(filename)
    dataset = load_dataset('csv', data_files={'train': filename})
    return dataset['train']

def train_model(train_dataset):
    # 모델 식별자나 로컬 경로를 직접 사용

    # ChatOllama 인스턴스 생성
    model = ChatOllama(model="gemma:latest", temperature=0)

    trainer = Trainer(
        model=model,
        train_dataset=train_dataset
    )

    trainer.train()

if __name__ == '__main__':
    input_filename = os.getcwd()+'/AAPL100.csv'
    train_dataset = load_and_prepare_data(input_filename)
    train_model(train_dataset)
