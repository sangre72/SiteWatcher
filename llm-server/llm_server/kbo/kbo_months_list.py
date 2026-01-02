import time
import requests
import pandas as pd
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Selenium WebDriver 초기화
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))

# KBO 경기 일정 및 결과 URL
url = "https://www.koreabaseball.com/Schedule/Schedule.aspx"
driver.get(url)

# 일정 로드 확인 함수
def is_schedule_loaded():
    try:
        table = driver.find_element(By.CSS_SELECTOR, '.tbl')
        rows = table.find_elements(By.TAG_NAME, 'tr')
        return len(rows) > 1
    except:
        return False

# 특정 달의 데이터를 수집하는 함수
def get_kbo_data():
    games = []

    # 일정 로드 대기
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, '.tbl')))

    html = driver.page_source
    # BeautifulSoup으로 HTML 파싱
    soup = BeautifulSoup(html, 'html.parser')

    # 경기 데이터 추출
    games = []
    table = soup.find('table', {'class': 'tbl'})

    current_date = None
    current_time = None

    for row in table.find_all('tr')[1:]:  # 첫 번째 행은 헤더이므로 제외
        cols = row.find_all('td')

        # 날짜 처리 (rowspan이 있는 경우 날짜 및 rowspan 길이 업데이트)
        if 'rowspan' in cols[0].attrs:
            current_date = cols[0].text.strip()
            current_date_rows = int(cols[0]['rowspan'])
            time_index = 1
            play_index = 2
            venue_index = 7
            status_index = 8
        else:
            time_index = 0
            play_index = 1
            venue_index = 6
            status_index = 7

        # 시간, 경기 정보, 장소, 경기장, 진행 여부 추출
        current_time = cols[time_index].text.strip()
        play_data = cols[play_index]
        teams = play_data.find_all('span')
        team1 = teams[0].text.strip() if len(teams) > 0 else None
        score1 = play_data.find('span', {'class': 'win'}).text.strip() if play_data.find('span',
                                                                                         {'class': 'win'}) else None
        score2 = play_data.find('span', {'class': 'lose'}).text.strip() if play_data.find('span',
                                                                                          {'class': 'lose'}) else None
        team2 = teams[-1].text.strip() if len(teams) > 2 else None
        venue = cols[venue_index].text.strip() if len(cols) > venue_index else None
        game_status = cols[status_index].text.strip() if len(cols) > status_index else None

        # 승패 결과를 기록
        if score1 is not None and score2 is not None:
            score1 = int(score1)
            score2 = int(score2)
            if score1 > score2:
                result = f"{team1} 승"
            elif score1 < score2:
                result = f"{team2} 승"
            else:
                result = "무승부"

            game = {
                'date': current_date,
                'time': current_time,
                'team1': team1,
                'team2': team2,
                'score1': score1,
                'score2': score2,
                'venue': venue,
                'game_status': game_status,
                'result': result
            }
            games.append(game)

    # 필요한 컬럼들만 포함한 데이터프레임으로 변환
    df = pd.DataFrame(games,
                      columns=['date', 'time', 'team1', 'team2', 'score1', 'score2', 'venue', 'game_status', 'result'])

    return df

# 특정 달의 데이터를 파일에 저장하는 함수
def save_kbo_data(year, month, df):
    filename = f'./csv/kbo_games_{year}_{month}.csv'
    df.to_csv(filename, index=False)
    print(f'{filename} saved successfully!')

# 데이터 수집 및 저장 예제
year = 2024
months = ['05', '04', '03']

time.sleep(5)  # 페이지가 로드될 때까지 대기

for month in months:
    # 이전 달 버튼 클릭
    time.sleep(3)  # 클릭 후 데이터 로드 대기
    games = get_kbo_data()
    save_kbo_data(year, month, games)

    prev_button = driver.find_element(By.ID, 'btnPrev')
    prev_button.click()
    time.sleep(2)  # 클릭 후 데이터 로드 대기


# WebDriver 종료
driver.quit()
