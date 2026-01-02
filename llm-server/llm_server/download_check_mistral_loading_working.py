from transformers import AutoTokenizer, AutoModel

#huggingface-cli login
#    huggingface-cli download MaziyarPanahi/Mistral-7B-Instruct-v0.3-GGUF Mistral-7B-Instruct-v0.3.IQ2_XS.gguf --local-dir /Users/bumsuklee/PhpstormProjects/20240418-git-test-prototype-cms/llm-server/llm_server/output/MaziyarPanahi_Mistral-7B-Instruct-v0.3-GGUF --local-dir-use-symlinks False
# 3. huggingface-cli download TheBloke/CodeLlama-7B-Python-GGUF           codellama-7b-python.Q2_K.gguf        --local-dir . --local-dir-use-symlinks False
model_id = "MaziyarPanahi/Mistral-7B-Instruct-v0.3-GGUF"
cache_dir = "/Users/bumsuklee/.cache"

from ctransformers import AutoModelForCausalLM

# 모델 파일의 경로를 정확히 지정합니다.
model_file_path = "/Users/bumsuklee/PhpstormProjects/20240418-git-test-prototype-cms/llm-server/llm_server/output/MaziyarPanahi_Mistral-7B-Instruct-v0.3-GGUF/Mistral-7B-Instruct-v0.3.IQ2_XS.gguf"

# 모델 로드
llm = AutoModelForCausalLM.from_pretrained(
    model_id,
    model_file=model_file_path,
    model_type="llama",
    gpu_layers=50
)

print("모델이 성공적으로 로드되었습니다.")
