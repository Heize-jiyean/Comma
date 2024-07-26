import firebase_admin
from firebase_admin import credentials, storage
import requests

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
    'storageBucket': 'comma-5a85c.appspot.com'
})

bucket = storage.bucket()

file_url = 'https://firebasestorage.googleapis.com/v0/b/comma-5a85c.appspot.com/o/AI%2Ffinal_model.pt?alt=media&token=2e645401-d725-4755-9ac6-de162beef50a'

response = requests.get(file_url)
local_file_path = './python/model.pt'
with open(local_file_path, 'wb') as file:
    file.write(response.content)