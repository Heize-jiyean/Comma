# 위도와 경도를 찾는 코드

import googlemaps
import pandas as pd
from tqdm import tqdm

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

# CSV 파일 읽기
input_file = '보건복지부 국립정신건강센터_정신건강 관련기관 정보_20220301.csv'
output_file = '보건복지부 국립정신건강센터_정신건강 관련기관 정보_20220301_with_coords.csv'

# 인코딩을 cp949로 시도
try:
    df = pd.read_csv(input_file, encoding='cp949')
except UnicodeDecodeError:
    # 실패할 경우 euc-kr로 시도
    df = pd.read_csv(input_file, encoding='euc-kr')

# 새로운 열 추가
df['latitude'] = 0.0
df['longitude'] = 0.0

# 주소 컬럼명 수정 필요 시 여기에 변경
address_column = '주소'  # 실제 주소 컬럼명으로 변경

# 주소를 기반으로 위도와 경도 찾기
for idx, row in tqdm(df.iterrows(), total=df.shape[0]):
    address = row[address_column]  # 주소 컬럼명 (필요에 따라 수정)
    lat, lon = trans_geo(address)
    df.at[idx, 'latitude'] = lat
    df.at[idx, 'longitude'] = lon

# 새로운 CSV 파일로 저장
df.to_csv(output_file, index=False, encoding='utf-8-sig')

print("CSV 파일이 성공적으로 작성되었습니다.")