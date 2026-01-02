import torch
from diffusers import StableDiffusionPipeline
from langchain_community.chat_models import ChatOpenAI
from langchain_core.prompts import PromptTemplate
import matplotlib.pyplot as plt
from langchain.chains.llm import LLMChain
import os
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
hf_token = os.environ.get('HF_TOKEN')
llm = ChatOpenAI(api_key=OPENAI_API_KEY, model="gpt-4o")

# Stable Diffusion 모델 로드
model_id = "CompVis/stable-diffusion-v1-4"
device = torch.device(
    "cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu"
)

pipe = StableDiffusionPipeline.from_pretrained(model_id, torch_dtype=torch.float16)
pipe = pipe.to(device)


# 이미지 생성 함수
def generate_image(prompt):
    image = pipe(prompt).images[0]
    return image


# 이미지 표시 함수
def show_image(image):
    plt.imshow(image)
    plt.axis("off")
    plt.show()

def translate_text_korean_to_english(text):
    # LangChain을 사용하여 번역 수행
    prompt = PromptTemplate(
        template="Translate the following Korean text to English and put the translated sentence in [ ]:\n\n{text}",
        input_variables=["text"]
    )
    chain = LLMChain(llm=llm, prompt=prompt)
    response = chain.run({"text": text})
    print("{}".format(response))

    return response.strip()

# 사용자 입력 받기
while True:
    prompt = input("Enter a prompt (or 'exit' to quit): ")
    if prompt.lower() == 'exit':
        break

    english = translate_text_korean_to_english(prompt)
    # 이미지 생성 및 표시
    generated_image = generate_image(english)
    show_image(generated_image)
