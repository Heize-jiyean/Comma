# 크롤링으로 전화번호를 찾는 코드

import pandas as pd
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import time
from matplotlib import rc
import platform

# 한글 폰트 설정
if platform.system() == 'Darwin':  # macOS
    rc('font', family='AppleGothic')
elif platform.system() == 'Windows':  # Windows
    rc('font', family='Malgun Gothic')

# WebDriver 초기화
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))

# CSV 파일 경로 설정
input_csv_path = '보건복지부 국립정신건강센터_정신건강 관련기관 정보_20220301_with_coords.csv'  # 입력 CSV 파일 경로
output_csv_path = '폰번호포함.csv'  # 출력 CSV 파일 경로

# CSV 파일 읽기
df = pd.read_csv(input_csv_path, encoding='utf-8')

# 전화번호를 저장할 새로운 컬럼 추가
df['전화번호'] = None

# 각 기관명에 대해 전화번호 검색
for index, row in df.iterrows():
    institution_name = row['기관명']
    print(f"Searching for {institution_name}...")
    
    try:
        # 114.co.kr 웹사이트 열기
        driver.get("https://www.114.co.kr/main")

        # 업종명 입력 요소 찾기
        search_box = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, '//*[@id="_main__search_input_"]'))
        )

        # 기관명 입력
        search_box.clear()  # 이전 검색어 지우기
        search_box.send_keys(institution_name)
        search_box.send_keys(Keys.RETURN)

        # 검색 결과가 나타날 때까지 대기
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.XPATH, '//*[@id="contain"]/div/div[1]/div[1]/div[10]/div[2]/ul'))
        )

        # 페이지 로딩을 위한 대기 시간
        time.sleep(2)

        # 전화번호 추출 시도
        phone_number = None
        try:
            # 첫 번째 XPath에서 전화번호 추출 시도
            phone_number_element = driver.find_element(By.XPATH, '//*[@id="contain"]/div/div[1]/div[1]/div[5]/div[2]/ul/li/div/div[2]/dl/dd/ul/li[2]/a')
            phone_number = phone_number_element.text
        except:
            try:
                # 두 번째 XPath에서 전화번호 추출 시도
                phone_number_element = driver.find_element(By.XPATH, '//*[@id="contain"]/div/div[1]/div[1]/div[10]/div[2]/ul/li/div/div[2]/dl/dd/ul/li[2]/a')
                phone_number = phone_number_element.text
            except:
                try:
                    # 세 번째 XPath에서 전화번호 추출 시도
                    phone_number_element = driver.find_element(By.XPATH, '//*[@id="contain"]/div/div[1]/div[1]/div[8]/div[2]/ul/li/div/div[2]/dl/dd/ul/li[2]/a')
                    phone_number = phone_number_element.text
                except Exception as e:
                    print(f"Error extracting phone number: {e}")
                    phone_number = '전화번호 없음'

        # 전화번호를 DataFrame에 추가
        df.at[index, '전화번호'] = phone_number
        print(phone_number)

    except Exception as e:
        print(f"Error retrieving phone number for {institution_name}: {e}")
        df.at[index, '전화번호'] = None

# 결과를 새로운 CSV 파일로 저장
df.to_csv(output_csv_path, index=False, encoding='utf-8-sig')
print(f"Results saved to {output_csv_path}")

# WebDriver 종료
driver.quit()