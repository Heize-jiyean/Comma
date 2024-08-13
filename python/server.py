from flask import Flask, request, jsonify

import torch
import gluonnlp as nlp
from model import BERTClassifier, get_kobert_model, predict
from kobert_tokenizer import KoBERTTokenizer

import numpy as np
import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.http.models import PointStruct
from sentence_transformers import SentenceTransformer



# 파라미터 정의

device = torch.device('cpu')
max_len = 500
batch_size = 32



# 분류 모델 불러오기

tokenizer_classification = KoBERTTokenizer.from_pretrained('skt/kobert-base-v1')

bertmodel, vocab = get_kobert_model('skt/kobert-base-v1', tokenizer_classification.vocab_file)
tok = nlp.data.BERTSPTokenizer(tokenizer_classification, vocab, lower = False)

model_classification = BERTClassifier(bertmodel, dr_rate = 0.5).to(device)

checkpoint = torch.load("./python/model.pt", map_location = device)
model_classification.load_state_dict(checkpoint)



# 임베딩 모델 불러오기

model_embedding = SentenceTransformer("bespin-global/klue-sroberta-base-continue-learning-by-mnr")



# vector DB

load_dotenv()

HOST_NAME=os.getenv('VDB_HOST')
PORT_NUM=os.getenv('VDB_PORT')

qdrant = QdrantClient(host=HOST_NAME, port=PORT_NUM)
collection_name = ['article', 'patient', 'diary'];



# AI 서버 구축

app = Flask(__name__)

@app.route('/classification', methods=['POST'])
def classification():
    data = request.get_json()
    
    if 'sentence' in data:
        sentence = data['sentence']
        result = predict(model_classification, tokenizer_classification, vocab, sentence, max_len, batch_size, device)  
        return jsonify(result)
    else:
        return jsonify({'error': 'No input received'}), 400

@app.route('/embedding', methods=['POST'])
def embedding():
    data = request.get_json()
    
    if ('idx' in data) & ('id' in data) & ('sentence' in data):
        idx = data['idx']
        id = data['id']
        sentence = data['sentence']
        embedding = model_embedding.encode(sentence)
        
        point = PointStruct(id=id, vector=embedding)
        
        qdrant.upsert(
            collection_name=collection_name[idx],
            points=[point]
        )
        
        return jsonify({'message': 'Success'}), 200
    else:
        return jsonify({'error': 'No input received'}), 400 

@app.route('/similarity_like', methods=['POST'])
def similarity_like():
    data = request.get_json()
    
    if ('pid' in data) & ('likeId' in data):
        pid = int(data['pid'])
        likeId = data['likeId']
        
        points = qdrant.retrieve(
            collection_name=collection_name[0],
            ids=likeId,
            with_vectors=True
        )

        selected = [point.vector for point in points if point.vector is not None]
        
        if len(selected) > 0:
            selected_array = np.array(selected)
            mean_vector = np.mean(selected_array, axis=0)
            
            qdrant.delete(
                collection_name=collection_name[1],
                points_selector=[pid],
                wait=True
            )
            
            point = PointStruct(id=pid, vector=mean_vector)

            qdrant.upsert(
                collection_name=collection_name[1],
                points=[point]
            )  

        else:
            qdrant.delete(
                collection_name=collection_name[1],
                points_selector=[pid],
                wait=True
            )

        return jsonify({'message': 'Success'}), 200
    else:
        return jsonify({'error': 'No input received'}), 400 

@app.route('/recommend', methods=['POST'])
def recommend():
    data = request.get_json()
    
    if ('likeId' in data) & ('idx' in data) & ('id' in data):
        likeId = data['likeId']
        idx = data['idx']
        id = int(data['id'])
        
        points = qdrant.retrieve(
            collection_name=collection_name[idx],
            ids=[id],
            with_vectors=True
        )
    
        vector = [point.vector for point in points if point.vector is not None]
        vector = np.array(vector).reshape(1, -1)
        
        noise = np.random.normal(scale=0.05, size=768)
        
        if vector.size > 0:
            embedding = vector + noise     
        else:
            embedding = [noise]
        
        results = qdrant.recommend(
            collection_name=collection_name[0],
            positive=embedding
        )
        
        filtered_results = [result for result in results if result.id not in likeId]
        top_3_results = filtered_results[:3]
            
        return jsonify([result.id for result in top_3_results]), 200
    else:
        return jsonify({'error': 'No input received'}), 400

@app.route('/delete_vector', methods=['POST'])
def delete_vector():
    data = request.get_json()
    
    if ('idx' in data) & ('id' in data):
        idx = data['idx']
        id = int(data['id'])
        
        qdrant.delete(
            collection_name=collection_name[idx],
            points_selector=[id],
            wait=True
        )

        return jsonify({'message': 'Success'}), 200
    else:
        return jsonify({'error': 'No input received'}), 400 

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)