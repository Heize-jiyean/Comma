import googlemaps
import pandas as pd
from tqdm import tqdm
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import time
from matplotlib import rc

###############################################################
# Google Maps API를 이용하여 가져온 데이터에 위도와 경도를 추가하는 과정

# Google Maps API 키 설정
mykey = "---"
maps = googlemaps.Client(key=mykey)

# 위도, 경도 변환하는 함수 생성
def trans_geo(addr):
    try:
        geo_location = maps.geocode(addr)[0].get('geometry')
        lat = geo_location['location']['lat']
        lng = geo_location['location']['lng']
        return [lat, lng]
    except:
        return [0, 0]

# CSV 파일 읽기 및 인코딩 처리
input_file = '보건복지부 국립정신건강센터_정신건강 관련기관 정보_20220301.csv'

try:
    df = pd.read_csv(input_file, encoding='cp949')
except UnicodeDecodeError:
    df = pd.read_csv(input_file, encoding='euc-kr')

# 위도와 경도 열 추가
df['latitude'] = 0.0
df['longitude'] = 0.0

# 주소 컬럼명 설정 (필요에 따라 수정)
address_column = '주소'

# 주소를 기반으로 위도와 경도 찾기
for idx, row in tqdm(df.iterrows(), total=df.shape[0]):
    address = row[address_column]
    lat, lon = trans_geo(address)
    df.at[idx, 'latitude'] = lat
    df.at[idx, 'longitude'] = lon


###############################################################
# 114 사이트를 이용하여 웹 크롤링을 통해 전화번호 df에 저장

# WebDriver 초기화
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))

# 전화번호를 저장할 새로운 컬럼 추가
df['전화번호'] = None

# 각 기관명에 대해 전화번호 검색
for index, row in df.iterrows():
    institution_name = row['기관명']
    print(f"Searching for {institution_name}...")
    
    try:
        # 114.co.kr 웹사이트 열기
        driver.get("https://www.114.co.kr/main")

        # 검색창 찾기 및 검색
        search_box = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, '//*[@id="_main__search_input_"]'))
        )
        search_box.clear()
        search_box.send_keys(institution_name)
        search_box.send_keys(Keys.RETURN)

        # 검색 결과 대기 및 로딩
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.XPATH, '//*[@id="contain"]/div/div[1]/div[1]/div[10]/div[2]/ul'))
        )
        time.sleep(2)

        # 전화번호 추출
        phone_number = None
        try:
            phone_number_element = driver.find_element(By.XPATH, '//*[@id="contain"]/div/div[1]/div[1]/div[5]/div[2]/ul/li/div/div[2]/dl/dd/ul/li[2]/a')
            phone_number = phone_number_element.text
        except:
            try:
                phone_number_element = driver.find_element(By.XPATH, '//*[@id="contain"]/div/div[1]/div[1]/div[10]/div[2]/ul/li/div/div[2]/dl/dd/ul/li[2]/a')
                phone_number = phone_number_element.text
            except:
                try:
                    phone_number_element = driver.find_element(By.XPATH, '//*[@id="contain"]/div/div[1]/div[1]/div[8]/div[2]/ul/li/div/div[2]/dl/dd/ul/li[2]/a')
                    phone_number = phone_number_element.text
                except Exception as e:
                    print(f"Error extracting phone number: {e}")
                    phone_number = '전화번호 없음'

        df.at[index, '전화번호'] = phone_number
        print(phone_number)

    except Exception as e:
        print(f"Error retrieving phone number for {institution_name}: {e}")
        df.at[index, '전화번호'] = None

# WebDriver 종료
driver.quit()

# 결과를 CSV 파일로 저장
output_csv_path = 'hospital_information_output.csv'
df.to_csv(output_csv_path, index=False, encoding='utf-8-sig')


###############################################################
# 수집한 데이터를 SQL문으로 변환

# 데이터를 SQL INSERT 문으로 변환하여 저장
insert_template = (
    "INSERT INTO hospital (name, address, phone, website, latitude, longitude, operating_hours) "
    "VALUES ('{name}', '{address}', '{phone}', {website}, {latitude}, {longitude}, {operating_hours});"
)

insert_statements = []

for _, row in df.iterrows():
    name = str(row['기관명']).replace("'", "''") if not pd.isna(row['기관명']) else 'NULL'
    address = str(row['주소']).replace("'", "''") if not pd.isna(row['주소']) else 'NULL'
    phone = str(row['전화번호']).replace("'", "''") if not pd.isna(row['전화번호']) else 'NULL'

    # INSERT시 SQL문 특수어 처리에 걸리지 않도록 홈페이지에서 '?' 삭제.
    website = str(row['홈페이지']).replace('?', '').replace("'", "''") if not pd.isna(row['홈페이지']) else 'NULL'
    latitude = row['latitude']
    longitude = row['longitude']
    operating_hours = 'NULL'

    sql = insert_template.format(
        name=name,
        address=address,
        phone=phone,
        website=f"'{website}'" if website != 'NULL' else website,
        latitude=latitude,
        longitude=longitude,
        operating_hours=operating_hours
    )
    insert_statements.append(sql)

# SQL INSERT 문을 파일에 저장
output_sql_path = 'hospital_information_output.sql'
with open(output_sql_path, 'w', encoding='utf-8') as f:
    for statement in insert_statements:
        f.write(statement + '\n')

print("CSV 파일과 SQL 파일 생성 완료!")