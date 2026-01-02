from ctransformers import AutoModelForCausalLM


# 3. huggingface-cli download TheBloke/CodeLlama-7B-Python-GGUF codellama-7b-python.Q2_K.gguf --local-dir . --local-dir-use-symlinks False
# 모델 파일의 경로를 정확히 지정합니다.
model_file_path = "/Users/bumsuklee/PhpstormProjects/20240418-git-test-prototype-cms/llm-server/llm_server/output/TheBloke_CodeLlama-7B-Python-GGUF/codellama-7b-python.Q2_K.gguf"

# 모델 로드
llm = AutoModelForCausalLM.from_pretrained(
    "TheBloke/CodeLlama-7B-Python-GGUF",
    model_file=model_file_path,
    model_type="mistral",
    gpu_layers=50
)

print("모델이 성공적으로 로드되었습니다.")