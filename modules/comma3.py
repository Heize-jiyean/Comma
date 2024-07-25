# 데이터를 insert문으로 변경하는 코드

import pandas as pd
import numpy as np

# 데이터프레임 읽기
df = pd.read_csv('폰번호포함.csv', encoding='utf-8')

# INSERT 문 템플릿
insert_template = (
    "INSERT INTO hospital (name, address, phone, website, latitude, longitude, operating_hours) "
    "VALUES ('{name}', '{address}', '{phone}', {website}, {latitude}, {longitude}, {operating_hours});"
)

# INSERT 문 목록 생성
insert_statements = []

for _, row in df.iterrows():
    name = str(row['기관명']).replace("'", "''") if not pd.isna(row['기관명']) else 'NULL'
    address = str(row['주소']).replace("'", "''") if not pd.isna(row['주소']) else 'NULL'
    
    # 전화번호가 NaN일 경우 처리
    phone = str(row['전화번호']).replace("'", "''") if not pd.isna(row['전화번호']) else 'NULL'
    
    # 홈페이지에서 '?' 제거
    website = str(row['홈페이지']).replace('?', '').replace("'", "''") if not pd.isna(row['홈페이지']) else 'NULL'
    
    latitude = row['latitude']
    longitude = row['longitude']
    operating_hours = 'NULL'  # operating_hours는 null로 처리
    
    # SQL 삽입문 작성
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

# INSERT 문을 파일에 저장
with open('insert_statements.sql', 'w', encoding='utf-8') as f:
    for statement in insert_statements:
        f.write(statement + '\n')

print("INSERT 문 생성 완료!")