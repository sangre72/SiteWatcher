import torch
from datasets import Dataset, load_dataset
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig, pipeline, TrainingArguments
from peft import LoraConfig, PeftModel
from trl import SFTTrainer

from huggingface_hub import notebook_login

from datasets import load_dataset
dataset = load_dataset("daekeun-ml/naver-news-summarization-ko")

print(dataset['train'][0])