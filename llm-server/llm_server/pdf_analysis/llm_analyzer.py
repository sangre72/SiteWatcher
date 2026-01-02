import requests
from llama_cpp import Llama

class LLMAnalyzer:
    def __init__(self, model_path=None):
        if model_path is None:
            raise ValueError("model_path must be provided")
        self.model = Llama(
            model_path=model_path,
            n_ctx=2048,
            n_threads=20,
            n_gpu_layers=-1,
            n_batch=512,
            main_gpu=0,
            tensor_split=[40],
        )
        self.system_prompt = """You are an expert in summarizing and structuring PDF documents. Please summarize the content of each page in a consistent format, and organize the main points as bullet points. You should convey the information clearly and thoroughly while maintaining the structure and format of the original text as much as possible."""

    def summarize_with_local_model(self, text):
        prompt = f"""{self.system_prompt} 
        다음 텍스트를 분석하여 의미가 통하는 라인으로 재구성하고 요약해주세요:

        {text}

        라인정리하고 출력해줘.
        """
        response = self.model(prompt, max_tokens=500, stop=["Human:", "Human"], echo=True)

        # 응답이 리스트 형태인 경우 처리
        if isinstance(response['choices'][0]['text'], list):
            # 리스트의 각 요소를 문자열로 변환하고 결합
            summary = ''.join(str(item) for item in response['choices'][0]['text'])
        else:
            summary = response['choices'][0]['text']

        # 프롬프트 제거
        summary = summary.replace(prompt, '').strip()
        return summary

    def compare_and_finalize(self, original_text, summary):
        prompt = f"""The following is the original text and a summary of it.
Please compare the two and write a more accurate and consistent final summary.
Make sure that important information and code are not omitted, and maintain the structure and meaning of the original as much as possible.

        원본 텍스트:
        {original_text}

        요약:
        {summary}

        최종 요약 및 주요 포인트:"""

        response = self.model(prompt, max_tokens=1000, stop=["Human:", "Human"], echo=True)
        final_summary = response['choices'][0]['text']
        final_summary = final_summary.replace(prompt, '').strip()

        return final_summary

    def analyze_text(self, text):
        initial_summary = self.summarize_with_local_model(text)
        #final_summary = self.compare_and_finalize(text, initial_summary)

        return {
            "original_text": text,
            "initial_summary": initial_summary,
            "final_summary": '' #final_summary
        }