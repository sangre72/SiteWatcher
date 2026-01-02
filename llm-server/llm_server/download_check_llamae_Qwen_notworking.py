import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

# Hugging Face 토큰
import os
hf_token = os.environ.get('HF_TOKEN')

# 'mps' 디바이스 설정
device = torch.device("mps") if torch.backends.mps.is_available() else torch.device("cpu")

# 모델과 토크나이저 로드 (양자화 설정 사용 안 함)
model = AutoModelForCausalLM.from_pretrained(
    "codellama/CodeLlama-7b-Instruct-hf",
    torch_dtype=torch.float16 if device.type == "mps" else torch.float32,
    use_auth_token=hf_token
)
model.to(device)
tokenizer = AutoTokenizer.from_pretrained("codellama/CodeLlama-7b-Instruct-hf", use_auth_token=hf_token)

# 프롬프트 설정
prompt = "Write a quicksort algorithm in python."
messages = [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": prompt}
]

# 메시지를 단일 텍스트로 결합
text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in messages])

# 모델 입력 준비
model_inputs = tokenizer(text, return_tensors="pt").to(device)

# 모델 예측 수행
with torch.no_grad():  # 생성 과정에서의 메모리 사용을 줄이기 위해 no_grad() 사용
    generated_ids = model.generate(
        model_inputs.input_ids,
        max_new_tokens=512
    )

# 생성된 텍스트 디코딩
output_text = tokenizer.decode(generated_ids[0], skip_special_tokens=True)
print(output_text)
