import PyPDF2
import pdfplumber
import re
import spacy


class PDFAnalyzer:
    def __init__(self):
        self.nlp = spacy.load("ko_core_news_sm")

    def get_total_pages(self, pdf_path):
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            return len(reader.pages)

    def analyze_page(self, pdf_path, page_num):
        result = {
            "page_num": page_num,
            "PyPDF2": self.process_with_pypdf2(pdf_path, page_num),
            "PDFPlumber": self.process_with_pdfplumber(pdf_path, page_num)
        }
        return result

    def process_with_pypdf2(self, pdf_path, page_num):
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            if page_num < len(reader.pages):
                page = reader.pages[page_num]
                text = page.extract_text().strip()
                cleaned_text = self.clean_text(text)
                return {"content": cleaned_text}
            else:
                return {"content": ""}

    def process_with_pdfplumber(self, pdf_path, page_num):
        with pdfplumber.open(pdf_path) as pdf:
            if page_num < len(pdf.pages):
                page = pdf.pages[page_num]
                table_data = self.extract_tables(page)
                return {"tables": table_data}
            else:
                return {"tables": []}

    def extract_tables(self, page):
        tables = page.extract_tables()
        return [
            {
                "table_num": i + 1,
                "data": [['' if cell is None else cell for cell in row] for row in table]
            }
            for i, table in enumerate(tables)
        ]

    def clean_text(self, text):
        # 기존의 cleaning 로직
        text = re.sub(r'\(cid:\d+\)', '', text)

        def try_chr(match):
            try:
                return chr(int(match.group(1)))
            except ValueError:
                return match.group(0)

        text = re.sub(r'\(cid:(\d+)\)', try_chr, text)

        char_map = {
            '(cid:103)': 'S',
            '(cid:104)': 'T',
            # 추가 매핑...
        }
        for cid, char in char_map.items():
            text = text.replace(cid, char)

        # URL 패턴 수정 로직
        def fix_url(match):
            url = match.group(0)
            url = re.sub(r'^h(?=\d)', 'http', url)
            url = re.sub(r':2(?=\D|$)', ':28', url)
            url = url.replace('huk', 'hub')
            return url

        url_pattern = r'\b(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)'
        text = re.sub(url_pattern, fix_url, text)

        # 라인 번호 제거 및 문장 연결
        lines = text.split('\n')
        processed_text = ""

        for line in lines:
            # 라인 번호 제거
            line = re.sub(r'^\d+:\s*', '', line.strip())
            processed_text += line + " "

        # spaCy를 사용한 문장 분리
        doc = self.nlp(processed_text)
        sentences = [sent.text.strip() for sent in doc.sents]

        # 줄 번호 다시 추가
        numbered_sentences = [f"{i + 1:04d}: {sentence}" for i, sentence in enumerate(sentences)]
        return '\n'.join(numbered_sentences)