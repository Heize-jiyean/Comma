# Node.js 20.11.1 이미지를 기반으로 함
FROM node:20.11.1

# 앱 디렉토리 생성
WORKDIR /usr/src/app

# package.json과 package-lock.json을 모두 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# 앱 소스 복사
COPY . .

# 앱이 사용할 포트 설정 (3000번 포트)
EXPOSE 3000

# 앱 실행
CMD [ "node", "main.js" ]