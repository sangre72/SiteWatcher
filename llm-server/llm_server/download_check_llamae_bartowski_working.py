from transformers import AutoTokenizer, AutoModel

#huggingface-cli login
#    huggingface-cli download MaziyarPanahi/Mistral-7B-Instruct-v0.3-GGUF Mistral-7B-Instruct-v0.3.IQ2_XS.gguf --local-dir /Users/bumsuklee/PhpstormProjects/20240418-git-test-prototype-cms/llm-server/llm_server/output/MaziyarPanahi_Mistral-7B-Instruct-v0.3-GGUF --local-dir-use-symlinks False
# 3. huggingface-cli download TheBloke/CodeLlama-7B-Python-GGUF           codellama-7b-python.Q2_K.gguf        --local-dir . --local-dir-use-symlinks False

# huggingface-cli login
# cd /Users/bumsuklee/PhpstormProjects/20240418-git-test-prototype-cms/llm-server/llm_server/output/bartowski_Meta-Llama-3-8B-Instruct-GGUF/
# huggingface-cli download bartowski/Meta-Llama-3-8B-Instruct-GGUF Meta-Llama-3-8B-Instruct-Q4_K_M.gguf --local-dir . --local-dir-use-symlinks False
#cache_dir = "/Users/bumsuklee/.cache"

from ctransformers import AutoModelForCausalLM # 여러가지 형태로 오픈을 할 수 있다. 여기서는 Llama 로 성공
from llama_cpp import Llama

# 모델 파일의 경로를 정확히 지정합니다.
# 모델 파일 경로 설정
model_file_path = "/Users/bumsuklee/PhpstormProjects/20240418-git-test-prototype-cms/llm-server/llm_server/output/bartowski_Meta-Llama-3-8B-Instruct-GGUF/Meta-Llama-3-8B-Instruct-Q4_K_M.gguf"

# 모델 로드
# Llama 클래스를 사용하여 모델 로드
llm = Llama(model_path=model_file_path, use_gpu=True)

# 입력 문장
input_text = "Hello, how are you?"

# 모델 예측 수행
output = llm(input_text, max_tokens=50)

# 출력 문장
print(output)
