import uuid
from asyncio import tasks
from threading import Thread

from flask import Flask, request, jsonify, render_template, send_from_directory
import os
import traceback

from transformers import CLIPModel

from pdf_analyzer import PDFAnalyzer
from llm_analyzer import LLMAnalyzer

app = Flask(__name__)
pdf_analyzer = PDFAnalyzer()
# 기존 코드
# CLIP 모델 로드
hf_token = os.environ.get('HF_TOKEN')

# Use a pipeline as a high-level helper
from llama_cpp import Llama
from huggingface_hub import hf_hub_download
import os
os.environ['GGML_METAL_DEBUG'] = '1'
os.environ['GGML_METAL_PATH_RESOURCES'] = '/Users/bumsuklee/miniconda3/envs/llmserver-3.11-llm/lib/python3.11/site-packages/llama_cpp/ggml-metal.metal'
#mradermacher/Llama-3.1-Korean-8B-Instruct-GGUF
model_id = 'MLP-KTLim/llama-3-Korean-Bllossom-8B-gguf-Q4_K_M'
filename = 'llama-3-Korean-Bllossom-8B-Q4_K_M.gguf'  # 정확한 파일 이름 확인 필요
model_id = 'mradermacher/Llama-3.1-Korean-8B-Instruct-GGUF'
filename = 'Llama-3.1-Korean-8B-Instruct.Q2_K.gguf'  # 정확한 파일 이름 확인 필요

model_path = hf_hub_download(repo_id=model_id, filename=filename)

# LLMAnalyzer 초기화 (수정된 부분)
llm_analyzer = LLMAnalyzer(model_path=model_path)

analysis_tasks = {}
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max-limit



# 이제 model_path를 사용하여 Llama 모델을 초기화할 수 있습니다
model = Llama(
            model_path=model_path,
            n_ctx=2048,  # 컨텍스트 길이를 늘림
            n_threads=20,  # CPU 코어 20개 사용
            n_gpu_layers=-1,  # 모든 가능한 레이어를 GPU로 오프로드
            n_batch=512,  # 배치 크기 증가
            main_gpu=0,  # 주 GPU 지정 (첫 번째 GPU)
            tensor_split=[40],  # GPU 코어 40개 사용 지정
        )

@app.route('/', methods=['GET'])
def home():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        app.logger.debug("Upload request received")
        if 'file' not in request.files:
            app.logger.error("No file part in the request")
            return jsonify({"success": False, "error": "No file uploaded"}), 400
        file = request.files['file']
        if file.filename == '':
            app.logger.error("No selected file")
            return jsonify({"success": False, "error": "No selected file"}), 400

        if not file.filename.lower().endswith('.pdf'):
            app.logger.error(f"Invalid file type: {file.filename}")
            return jsonify({"success": False, "error": "Invalid file type. Only PDF files are allowed."}), 400

        filename = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        app.logger.debug(f"Attempting to save file: {filename}")
        file.save(filename)
        app.logger.debug("File saved successfully")

        total_pages = pdf_analyzer.get_total_pages(filename)

        app.logger.debug("File analysis completed")
        return jsonify({"success": True, "total_pages": total_pages, "filename": file.filename})
    except Exception as e:
        app.logger.error(f"Error processing file: {str(e)}")
        app.logger.error(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": "An error occurred during file processing",
            "details": str(e),
            "traceback": traceback.format_exc()
        }), 500


@app.route('/analyze_page', methods=['POST'])
def analyze_page():
    try:
        data = request.json
        filename = data.get('filename')
        page_num = data.get('page_num')

        if not filename or page_num is None:
            return jsonify({"success": False, "error": "Missing filename or page number"}), 400

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        if not os.path.exists(filepath):
            return jsonify({"success": False, "error": "File not found"}), 404

        # 작업 ID 생성
        task_id = str(uuid.uuid4())
        analysis_tasks[task_id] = {"status": "running", "result": None}

        # 백그라운드에서 분석 작업 실행
        #Thread(target=run_analysis, args=(task_id, filepath, page_num)).start()
        run_analysis(task_id, filepath, page_num)
        return jsonify({"success": True, "task_id": task_id})
    except Exception as e:
        app.logger.error(f"Error analyzing page: {str(e)}")
        app.logger.error(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": "An error occurred during page analysis",
            "details": str(e),
            "traceback": traceback.format_exc()
        }), 500


def run_analysis(task_id, filepath, page_num):
    print("run_analysis ===============================================================================")
    try:
        result = pdf_analyzer.analyze_page(filepath, page_num)
        pypdf2_content = result["PyPDF2"]["content"]
        if pypdf2_content:
            llm_analysis = llm_analyzer.analyze_text(pypdf2_content)

            # 결과가 리스트인 경우 처리
            # llm_analysis는 딕셔너리이므로, 최종 요약만 추출
            final_summary = llm_analysis["final_summary"]
            final_summary = llm_analysis["initial_summary"]
            # 결과가 리스트인 경우 처리
            if isinstance(final_summary, list):
                final_summary = ' '.join(final_summary)

            result["LLM_Analysis"] = final_summary
            result["Local_Model_Summary"] = final_summary  # 최종 요약만 사용
        else:
            result["LLM_Analysis"] = "No content available for LLM analysis"
            result["Local_Model_Summary"] = "No content available for local model summary"

        analysis_tasks[task_id] = {"status": "completed", "result": result}
    except Exception as e:
        app.logger.error(f"Error in background task: {str(e)}")
        analysis_tasks[task_id] = {"status": "error", "error": str(e)}


@app.route('/task_status/<task_id>', methods=['GET'])
def task_status(task_id):
    task = analysis_tasks.get(task_id)
    if not task:
        return jsonify({"success": False, "error": "Task not found"}), 404

    if task["status"] == "completed":
        return jsonify({"success": True, "status": "completed", "result": task["result"]})
    elif task["status"] == "error":
        return jsonify({"success": False, "status": "error", "error": task["error"]})
    else:
        return jsonify({"success": True, "status": "running"})


@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    import logging
    logging.basicConfig(level=logging.DEBUG)
    app.logger.setLevel(logging.DEBUG)
    app.run(debug=False, use_reloader=True, port=5001)
    print("Running in DEBUG mode on port 5001. Do not use in production!")