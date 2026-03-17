from flask import Flask, render_template, request, jsonify
import whois
import requests
from urllib.parse import urlparse
from phishing_model import predict_phishing

app = Flask(__name__)

VIRUSTOTAL_API = "YOUR_KEY_HERE"


def check_domain_age(domain):

    try:
        w = whois.whois(domain)

        creation = w.creation_date

        if isinstance(creation, list):
            creation = creation[0]

        age_days = (creation - creation).days if creation else 0

        if age_days < 180:
            return False,"Domain is very new"
        else:
            return True,"Domain age looks legitimate"

    except:
        return False,"Unable to verify domain age"


def check_virustotal(url):

    try:
        headers = {"x-apikey":VIRUSTOTAL_API}

        response = requests.post(
            "https://www.virustotal.com/api/v3/urls",
            headers=headers,
            data={"url":url}
        )

        return "VirusTotal scan submitted"

    except:
        return "VirusTotal check failed"


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/detect",methods=["POST"])
def detect():

    data = request.get_json()
    url = data["url"]

    parsed = urlparse(url)
    domain = parsed.netloc

    reasons = []
    score = 100

    # ML detection
    prediction = predict_phishing(url)

    if prediction == 1:
        reasons.append("Machine learning model predicts phishing patterns")
        score -= 40

    # WHOIS check
    domain_check,message = check_domain_age(domain)
    reasons.append(message)

    if not domain_check:
        score -= 20

    # VirusTotal
    vt_result = check_virustotal(url)
    reasons.append(vt_result)

    # URL length
    if len(url) > 75:
        reasons.append("URL length suspicious")
        score -= 15

    # HTTP check
    if not url.startswith("https"):
        reasons.append("Website not using HTTPS")
        score -= 10

    # Final status
    status = "safe"

    if score < 60:
        status = "fake"

    return jsonify({
        "status":status,
        "confidence":score,
        "reasons":reasons
    })


if __name__ == "__main__":
    app.run(debug=True)
