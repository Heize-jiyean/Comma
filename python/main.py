import torch
import gluonnlp as nlp
from model import BERTClassifier, get_kobert_model, predict
from kobert_tokenizer import KoBERTTokenizer
import sys
import json



# GPU 설정

device_type = 'cuda' if torch.cuda.is_available() else 'cpu'
device = torch.device(device_type)



# 파라미터 정의

max_len = 200
batch_size = 32
warmup_ratio = 0.1
num_epochs = 50
max_grad_norm = 1
log_interval = 200
learning_rate =  5e-5



# 모델 불러오기

tokenizer = KoBERTTokenizer.from_pretrained('skt/kobert-base-v1')

bertmodel, vocab = get_kobert_model('skt/kobert-base-v1',tokenizer.vocab_file)
tok = nlp.data.BERTSPTokenizer(tokenizer, vocab, lower = False)

model = BERTClassifier(bertmodel, dr_rate = 0.5).to(device)

checkpoint = torch.load("./python/model.pt", map_location=torch.device('cpu'))
model.load_state_dict(checkpoint)



# 사용 

if len(sys.argv) > 1:
    sentence = sys.argv[1]
    another_result = predict(model, tokenizer, vocab, sentence, max_len, batch_size, device)
    print(json.dumps(another_result))
else:
     print(json.dumps({'error': 'No input received'}))