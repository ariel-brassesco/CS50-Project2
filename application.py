import os
import requests
from static.classes import User, Channel, Message
from static import func as f

from flask import Flask, request, jsonify, render_template, send_file
from flask_socketio import SocketIO, emit
from werkzeug.utils import secure_filename
from werkzeug.exceptions import RequestEntityTooLarge


# Set the UPLOAD FOLDER
UPLOAD_FOLDER = "./static/images/uploads"
MAX_SIZE_FILE = 16 * 1024 * 1024 # 16MB
ALLOWED_EXTENSIONS = {'txt', 'odt','doc', 'docx', 'ods','xls', 'xlsx', 'pdf', 'png', 'jpg', 'jpeg', 'gif'}

app = Flask(__name__)
app.config["SECRET_KEY"] = 'dfsdf)/94432(//$%#)'#os.getenv("SECRET_KEY")
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_SIZE_FILE
socketio = SocketIO(app)

# Set global variables
users = []
public_channels = []
private_channels = []

# Create some users for test
user1 = User("Ariel", settings={"color": "blue"})
user2 = User("Pedro", settings={"color": "black"})
user3 = User("Tomas", settings={"color": "black"})
users.extend([user1, user2, user3])

# Create some channels for test
ch_public = Channel("general", "public", "A default chat for everyone.")
ch_private = Channel("tut", "private", "My first private chat room.")
#ch_direct = Channel("Pedro", "direct")
public_channels.append(ch_public)
private_channels.append(ch_private)

# Add Users to public channel
f.add_to_channel(public_channels, user1, ch_name=False)
f.add_to_channel(public_channels, user2, ch_name=False)
f.add_to_channel(public_channels, user3, ch_name=False)


@app.route("/")
def index():
    return render_template("index.html")

@app.route("/new_user", methods = ['POST'])
def new_user():

    username = request.form.get('username')
    avatar = request.form.get('avatar')

    if not f.check_user(username, users):
        return jsonify({"success": False, "msg": "The user already exist. Try another."})
    
    # Generate the User
    user = User(username, settings={'avatar': avatar})
    # Add the publics to Channels to User
    f.add_to_channel(public_channels, user, ch_name=False)
    # Add the User to users list
    users.append(user)
    #Just to check in terminal
    print("{} is login.".format(user.username))
    
    # Create a dict to response
    response = {}
    response['success'] = True
    response['user'] = user.info()
    response['user']['users'] = f.users_list(users, user)
    response['public_channels'] = []
    response['private_channels'] = []
    
    for ch in public_channels:
        response['public_channels'].append(ch.info())
    
    # Send response
    return jsonify(response)

@app.route("/logout", methods = ['POST'])
def logout():

    username = request.form.get('username')

    try:
        if not f.delete_user(username, users):
            raise Exception("The user does not exist.")
        f.del_to_channels(public_channels, username)
        f.del_to_channels(private_channels, username)
    except:
        print('An error was ocurred during LOGOUT.')
        return {"success": False, "msg": "The user does not exist."}
    
    print(f"{username} is logout.")
    # Send response
    return {"success": True, "msg": "Success logout"}

@app.route('/uploads', methods=['POST'])
def upload_file():
    
    if request.method == 'POST':
        try:
            user = request.form.get('username')
            channel = request.form.get('channel')

            if 'file' not in request.files:
                return jsonify({'success': False, 'msg': 'No file part.'})
            
            # check if the post request has the file part
            file = request.files['file']

            if file.filename == '':
                return jsonify({'success': False, 'msg': 'No file selected for uploading'})
            
            if file and f.allowed_file(file.filename, ALLOWED_EXTENSIONS):
                filename = secure_filename(file.filename)
                path = "/".join([app.config['UPLOAD_FOLDER'], channel, user])

                if not os.path.exists(path):
                    print(path)
                    os.makedirs(path)

                path_file = "/".join([path, filename])
                file.save(path_file)

                return jsonify({'success': True, 'msg': 'File successfully uploaded', 'src': path_file})
            return jsonify({'success': False, 'msg': f'Allowed file types are {",".join(ALLOWED_EXTENSIONS)}.'})
        except RequestEntityTooLarge:
            return jsonify({'success': False, 'msg': f'Allowed file sizes are less than 16 MB.'})

@app.route('/downloads', methods=['POST'])
def download_file():

    file_src = request.form.get('src')
    file_type = request.form.get('type')
    print(file_src, file_type)
    try:
        filename = f.get_filename(file_src)
        return send_file(file_src, as_attachment=True, add_etags=True, attachment_filename=filename, mimetype=file_type)
    except Exception as e:
        return str(e)

@socketio.on("submit user")
def announce_user(data):
    username = data['username']
    emit("announce user", {"username": username}, broadcast=True)


@socketio.on("logout user")
def announce_logout(data):
    print(data)
    username = data['username']
    emit("announce logout", {"username": username}, broadcast=True)


@socketio.on("new channel")
def new_channel(data):
    user = data['username']
    channel = data['channel']
    
    channels = public_channels.copy()
    channels.extend(private_channels)
    
    # Try to Create the New Channel
    try:
        ch = Channel(*channel)
    except:
        print("The channel name is not valid.")
        emit('add channel', {'success': False, 'msg': 'The channel name is not valid.'}, broadcast=False)
        return

    if not f.check_channel(channel[0], channels):
        print("The channel already exists.")
        emit('add channel', {'success': False, 'msg': 'The channel already exist'}, broadcast=False)
        return

    res = {}
    # Add the New Channel to channels list
    # If the channel is public add to all users
    if ch.status == 'public':
        
        print(f'The New Channel {ch.status}: {ch.name} was created.')
        public_channels.append(ch)
        for u in users:
            f.add_to_channel(public_channels, u, ch_name=False)
        
        # Add the notification to users and Emit the Event
        notification = {'users': [u.username for u in users],
                        'msg': f"{user} create the public channel: {channel[0]}.",
                        'type': 'information'}

        for u in users:
            f.add_notification(notification, u, users)

        # Send a notification for users added
        emit("notification", notification, broadcast=True)

    else:
        print(f'The New Channel {ch.status}: {ch.name} was created.')
        # Add the user to the new channel
        # and add the channel to the user
        ch.add_user(user)
        u = f.find_user(user, users)
        u.add_channel(ch)

        # Add the channel to the private_channels list
        private_channels.append(ch)

        # Add the notification to users and Emit the Event
        notification = {'user': user, 
                        'channel': channel,
                        'users': data['users'],
                        'msg': f"{user} invite you to join to {channel[0]}.",
                        'type': 'invitation',
                        'invitation': True}

        for item in data['users']:
            f.add_notification(notification, item, users)

        # Send a notification for users added
        emit("notification", notification, broadcast=True)

    # Send the channel info
    res['channel'] = ch.info()
    res['success'] = True
    print(res)
    emit('add channel', res, broadcast=True)


@socketio.on("new message")
def new_message(data):
    # Find the user and the channel
    user = f.find_user(data['user']['username'], users)
    print(data)
    # Check that the channel exists
    channel = f.find_channel(data['channel'], public_channels)
    if not channel:
        channel = f.find_channel(data['channel'], private_channels)

    if not channel:
        print(f"The channel: {data['channel']} does not exists.")
        emit('send message', {'success': False, 'msg': f'The channel: {data["channel"]} does not exist'}, broadcast=False)
    else:
        # Create the message from data
        message = Message(user, data['content'], data['date'], data['state'], data['type'])

        # Add the message to the channel
        channel.add_message(message)
        print(f'Sending message to channel: {channel.name}, {channel.id}.')
        emit('send message', {'success': True, 'message': message.info(), 'channel': channel.info()}, broadcast=True)


@socketio.on("notification")
def notification(data):
    user = data['username']
    noti = data['response']

    if noti['type'] == 'ch-inv':
        if noti['res'] == 'no':
            # Create the notification response
            notification = { 'users': [noti['user']],
                        'msg': f"{user} reject your invitation to {noti['ch']}.",
                        'type': 'information'}
            print(notification)
            f.add_notification(notification, noti['user'], users)
            # Send a notification
            emit("notification", notification, broadcast=True)
        else:
            # Add the user to the channel
            u = f.find_user(user, users)
            id_channel = 'ch-'+noti['ch']
            ch = f.find_channel(id_channel, private_channels)
            f.add_to_channel(private_channels, u, ch_name=noti['ch'])
            
            # Create the notification response
            notification = { 'users': [noti['user']],
                        'msg': f"{user} accept your invitation to {noti['ch']}.",
                        'type': 'information'}
            print(notification)
            f.add_notification(notification, noti['user'], users)
            # Send a notification
            emit("notification", notification, broadcast=True)

            # Send the channel info
            res = {}
            res['channel'] = ch.info()
            res['success'] = True
            print(res)        
            emit('add channel', res, broadcast=True)


if __name__ == "__main__":
    app.run(debug = True)