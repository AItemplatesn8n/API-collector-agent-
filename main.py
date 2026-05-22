from flask import Flask, request, jsonify

app = Flask(__name__)

platforms = []

@app.route("/")
def home():
    return "API Collector Brain Running"

@app.route("/add-platform", methods=["POST"])
def add_platform():
    data = request.json
    platforms.append(data)
    return jsonify({
        "status": "added",
        "platform": data
    })

@app.route("/platforms")
def get_platforms():
    return jsonify(platforms)

app.run(host="0.0.0.0", port=3580)
