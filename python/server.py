from flask import Flask, request, jsonify

import torch
import gluonnlp as nlp
from model import BERTClassifier, get_kobert_model, predict
from kobert_tokenizer import KoBERTTokenizer

import numpy as np
import json
import os
from dotenv import load_dotenv
from database import create_connection, insert_sim_like, delete_sim_like, insert_sim_diary
#import chromadb
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity



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



# DB 연결

load_dotenv()

HOST_NAME=os.getenv('DB_HOST')
USER_NAME=os.getenv('DB_USER')
USER_PASSWORD=os.getenv('DB_PW')
DB_NAME=os.getenv('DB_NAME')

connection = create_connection(HOST_NAME, USER_NAME, USER_PASSWORD, DB_NAME)



# vector DB

#client = chromadb.Client()
#vector_collection = client.create_collection(name="comma")



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
    
    if 'sentence' in data:
        sentence = data['sentence']
        embedding = model_embedding.encode(sentence)
        embedding_list = embedding.tolist()
        return jsonify(embedding_list)
    else:
        return jsonify({'error': 'No input received'}), 400 

@app.route('/similarity_like', methods=['POST'])
def similarity_like():
    data = request.get_json()
    
    if ('pid' in data) & ('likeId' in data):
        if os.path.exists('python/vector/articleVectors.json'):
            pid = data['pid']
            likeId = data['likeId']
            selected = []
            vectors = []

            with open('python/vector/articleVectors.json', 'r') as file:
                jdata = json.load(file)
        
            for i in range(len(jdata)):
                if jdata[i]['id'] in likeId:
                    selected.append(jdata[i]['vector'])
            
                vectors.append(jdata[i]['vector'])

            selected_array = np.array(selected)
            
            if selected_array.size > 0:
                mean_vector = np.mean(selected_array, axis=0, keepdims=True)
        
                vectors_array = np.array(vectors)
                vectors_array = np.concatenate((vectors_array, mean_vector), axis=0)
        
                cosine_sim_matrix = cosine_similarity(vectors_array)
                sim = cosine_sim_matrix[-1]
        
                delete_sim_like(connection, pid)
        
                for index, similarity in enumerate(sim[:-1]):
                    if jdata[index]['id'] not in likeId:
                        insert_sim_like(connection, pid, jdata[index]['id'], similarity)
        
                mean_vector = mean_vector.tolist()
                return jsonify(mean_vector)
            else:
                delete_sim_like(connection, pid)   
                zero_list = [0] * 768   
                return jsonify(zero_list)
    else:
        return jsonify({'error': 'No input received'}), 400 

@app.route('/similarity_article', methods=['POST'])
def similarity_article():
    data = request.get_json()
    
    if ('aid' in data) & ('vector' in data):
        aid = data['aid']
        vector = data['vector']
        
        if os.path.exists('python/vector/patientVectors.json'):
            vectors = []
        
            with open('python/vector/patientVectors.json', 'r') as file:
                jdata = json.load(file)
        
            for i in range(len(jdata)):
                vectors.append(jdata[i]['vector'])
        
            vectors_array = np.array(vectors)
            vectors_array = np.append(vectors_array, [vector], axis=0)
        
            cosine_sim_matrix = cosine_similarity(vectors_array)
            sim = cosine_sim_matrix[-1]
        
            for index, similarity in enumerate(sim[:-1]):
                insert_sim_like(connection, jdata[index]['id'], aid, similarity)
        
        if os.path.exists('python/vector/diaryVectors.json'):
            vectors = []    
            
            with open('python/vector/diaryVectors.json', 'r') as file:
                jdata = json.load(file)
            
            for i in range(len(jdata)):
                vectors.append(jdata[i]['vector'])
                
            vectors_array = np.array(vectors)
            vectors_array = np.append(vectors_array, [vector], axis=0)
            
            cosine_sim_matrix = cosine_similarity(vectors_array)
            sim = cosine_sim_matrix[-1]
            
            for index, similarity in enumerate(sim[:-1]):
                insert_sim_diary(connection, jdata[index]['id'], aid, similarity)
            
        return jsonify({'message': 'Operation successful'}), 200
    else:
        return jsonify({'error': 'No input received'}), 400 

@app.route('/similarity_diary', methods=['POST'])
def similarity_diary():
    data = request.get_json()
    
    if ('did' in data) & ('vector' in data):
        if os.path.exists('python/vector/articleVectors.json'):
            did = data['did']
            vector = data['vector']
            vectors = []

            with open('python/vector/articleVectors.json', 'r') as file:
                jdata = json.load(file)
        
            for i in range(len(jdata)):
                vectors.append(jdata[i]['vector'])
        
            vectors_array = np.array(vectors)
            vectors_array = np.append(vectors_array, [vector], axis=0)
        
            cosine_sim_matrix = cosine_similarity(vectors_array)
            sim = cosine_sim_matrix[-1]
        
            for index, similarity in enumerate(sim[:-1]):
                insert_sim_diary(connection, did, jdata[index]['id'], similarity)

        return jsonify({'message': 'Operation successful'}), 200
    else:
        return jsonify({'error': 'No input received'}), 400 

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)