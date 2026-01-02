from transformers import AutoTokenizer, AutoModel

model_id = "meta-llama/Meta-Llama-3-8B-Instruct"
cache_dir = "/Users/bumsuklee/.cache"

tokenizer = AutoTokenizer.from_pretrained(model_id, cache_dir=cache_dir)
model = AutoModel.from_pretrained(model_id, cache_dir=cache_dir)

print(f"Model is downloaded to: {cache_dir}/{model_id.replace('/', '-')}")
