import os
import requests

from flask import Flask, request, jsonify, render_template
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = 'dfsdf)/94432(//$%#)'#os.getenv("SECRET_KEY")
socketio = SocketIO(app)

users = list()

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/new_user", methods = ['POST'])
def new_user():

    username = request.form.get('username')

    if username in users:
        return jsonify({"success": False})
    
    users.append(username)
    return jsonify({"success": True, "username": username})



if __name__ == "__main__":
    app.run(debug = True)#socketio.run(app)