import pandas as pd
from sklearn.ensemble import RandomForestClassifier

# Simple training dataset
data = {
    "url_length":[54,23,120,45,200,30],
    "has_https":[1,1,0,1,0,1],
    "has_ip":[0,0,1,0,1,0],
    "label":[0,0,1,0,1,0]  # 0 safe, 1 phishing
}

df = pd.DataFrame(data)

X = df[["url_length","has_https","has_ip"]]
y = df["label"]

model = RandomForestClassifier()
model.fit(X,y)

def predict_phishing(url):
    url_length = len(url)
    has_https = 1 if url.startswith("https") else 0
    has_ip = 1 if any(char.isdigit() for char in url.split("/")[2]) else 0

    prediction = model.predict([[url_length,has_https,has_ip]])[0]

    return prediction
