import string
import time

import pyperclip
from pydantic import BaseModel
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager
from langchain_core.tools import Tool

# Pydantic 모델 정의
# LangChain Tool로 사용하기 위한 클래스
class DataProcessorTool(Tool):
    def __init__(self, name, func, description):
        super().__init__(name=name, func=func, description=description)
        self.name = name  # 도구의 이름 설정
        self.func = func
        self.description = description

    def run(self, input_data):
        # 데이터 처리 로직
        # 예시: 입력 데이터를 대문자로 변환하고, 최대 결과 수에 따라 일부 결과만 반환
        r = self.naver_blog_write("title", input_data)
        return r[:self.max_results]

def naver_blog(title_text, content_text):
    #driver = webdriver.Chrome()
    driver = webdriver.Chrome(service= Service(ChromeDriverManager().install()))

    driver.get("https://nid.naver.com/nidlogin.login?mode=form&url=https://www.naver.com/")
    # 사용자 ID를 클립보드에 복사
    pyperclip.copy("lime_flavor")

    # JavaScript를 이용해 클립보드 내용을 입력 필드에 붙여넣기
    id_input = driver.find_element(By.ID, "id")
    id_input.click()  # 입력 필드 클릭
    driver.execute_script("document.getElementById('id').value = ''")  # 필드 초기화
    driver.execute_script("document.getElementById('id').value = arguments[0]", pyperclip.paste())  # 붙여넣기
    time.sleep(1)
    # 비밀번호도 같은 방법으로 처리
    pyperclip.copy("Santape123$")
    pw_input = driver.find_element(By.ID, "pw")
    pw_input.click()
    driver.execute_script("document.getElementById('pw').value = ''")  # 필드 초기화
    driver.execute_script("document.getElementById('pw').value = arguments[0]", pyperclip.paste())  # 붙여넣기

    time.sleep(1)
    # 로그인 버튼 클릭
    login_button = driver.find_element(By.ID, "log.login")
    login_button.click()

    time.sleep(1)

    #se-placeholder __se_placeholder se-ff-nanumgothic se-fs32
    #se-ff-nanumgothic se-fs15 __se-node

    driver.get("https://blog.naver.com/lime_flavor/postwrite")
    time.sleep(3)

    #iframe = driver.find_element(By.TAG_NAME, "iframe")
    #driver.switch_to.frame(iframe)
    #tag_title = driver.find_element(By.XPATH, "//textarea[@placeholder='제목']")
    #tag_title.click()
    #tag_title.send_keys("이건 제목이다.")


    # 클래스 이름으로 요소 찾기 및 값 초기화
    # 클래스 이름 설정 - 이 경우, 공백은 CSS 선택자에서 클래스 구분자로 처리되므로 각 공백을 '.'으로 대체합니다.
    title_class_name = ".se-placeholder.__se_placeholder.se-ff-nanumgothic.se-fs32"

    # JavaScript를 사용하여 해당 클래스를 가진 첫 번째 요소의 내부 HTML을 비우기
    d = driver.execute_script(f"document.querySelector('{title_class_name}').innerHTML = '';")

    # 값 설정하기
    #title_text = "이건 제목이다"
    driver.execute_script(f"document.querySelector('{title_class_name}').innerHTML = '{title_text}';")

    time.sleep(2)

    content_class_name = ".se-placeholder.__se_placeholder.se-ff-nanumgothic.se-fs15"

    # JavaScript를 사용하여 해당 클래스를 가진 첫 번째 요소의 내부 HTML을 비우기
    d = driver.execute_script(f"document.querySelector('{content_class_name}').innerHTML = '';")

    # 값 설정하기
    #content_text = "이건 내용이다"
    print("naver =--------------------------------------------------------------------")
    print(content_text)
    print("naver =--------------------------------------------------------------------")
    driver.execute_script(f"document.querySelector('{content_class_name}').innerHTML = '{content_text}';")


    #driver.execute_script(f"document.querySelector('{class_name}').textContent = arguments[0]", pyperclip.paste())  # 붙여넣기

    time.sleep(15)

    print(driver.current_url)

    driver.close()

    return "ok"

# LangChain에서 사용할 도구 인스턴스 생성
custom_tool = DataProcessorTool(name="UppercaseProcessor", func=naver_blog, description="Converts text to uppercase.")


