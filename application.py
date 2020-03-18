import os, shutil
from time import time
import requests
from static.classes import User, Channel, Message
from static import func as f

from flask import Flask, request, jsonify, render_template, send_file, redirect, url_for
from flask_socketio import SocketIO, emit
from werkzeug.utils import secure_filename
from werkzeug.exceptions import RequestEntityTooLarge


# Set some folders
AVATAR_FOLDER = "./static/images/avatar"
UPLOAD_FOLDER = "./static/images/uploads"
MAX_SIZE_FILE = 16 * 1024 * 1024 # 16MB
ALLOWED_EXTENSIONS = {'txt', 'odt','doc', 'docx', 'ods','xls', 'xlsx', 'pdf', 'png', 'jpg', 'jpeg', 'gif'}

#Set some variables
TIME_TO_FORCE_LOGOUT = 24 * 3600

# Set some socketio params
PING_TIMEOUT = 600
PING_INTERVAL = 10

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_SIZE_FILE
socketio = SocketIO(app,
                    ping_timeout=PING_TIMEOUT,
                    ping_interval=PING_INTERVAL,
                    cors_credentials=False,
                    cors_allowed_origins=[])

# Set global variables
users = []
public_channels = []
private_channels = []

# Create some users for test
user1 = User("Ariel")
user2 = User("Pedro")
user3 = User("Tomas")
users.extend([user1, user2, user3])

# Create some channels for test
ch_public = Channel("general", "public", "A default chat for everyone.")
ch_private = Channel("tut", "private", "My first private chat room.")

# Add the channels to global varaibles
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
    user.last_active = time()

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
        # Delete the files
        delete_files(username)
        return {"success": False, "msg": "The user does not exist."}
    # Delete the files
    delete_files(username)
    
    # Delete the private channels without users
    f.del_empty_channel(private_channels)
    
    print(f"{username} is logout.")
    # Send response
    return {"success": True, "msg": "Success logout"}

@app.route('/uploads', methods=['POST'])
def upload_file():
    
    if request.method == 'POST':
        try:
            user = request.form.get('username')
            channel = request.form.get('channel')

            # Check the user exist
            if force_logout(user):
                return

            if 'file' not in request.files:
                return jsonify({'success': False, 'msg': 'No file part.'})
            
            # check if the post request has the file part
            file = request.files['file']

            if file.filename == '':
                return jsonify({'success': False, 'msg': 'No file selected for uploading'})
            
            if file and f.allowed_file(file.filename, ALLOWED_EXTENSIONS):
                filename = secure_filename(file.filename)
                if channel == 'avatar':
                    path = "/".join([app.config['UPLOAD_FOLDER'], "../" + channel, user])
                else:
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
    username = data['username']
    emit("announce logout", {"username": username}, broadcast=True)

@socketio.on("new channel")
def new_channel(data):
    user = data['username']
    channel = data['channel']
    
    # Check the user exist
    if force_logout(user):
        return

    # Create a list of channels
    channels = public_channels.copy()
    channels.extend(private_channels)

    # Try to Create the New Channel
    try:
        ch = Channel(*channel)
    except:
        print("The channel name is not valid.")
        emit('add channel', {'success': False, 'user': user, 'msg': 'The channel name is not valid.'}, broadcast=True)
        return

    if not f.check_channel(channel[0], channels):
        print("The channel already exists.")
        emit('add channel', {'success': False, 'user': user,'msg': 'The channel already exist'}, broadcast=True)
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
        invite_user({'user': user, 'channel': channel[0], 'users': data['users']})

    # Send the channel info
    res['channel'] = ch.info()
    res['success'] = True
    print(res)
    emit('add channel', res, broadcast=True)

@socketio.on("remove channel")
def remove_channel(data):
    username = data['user']
    channel = data['channel']

    # Check the user exist
    if force_logout(username):
        return

    print(f'{username} wants to leave the channel: {channel["name"]}')

    user = f.find_user(username, users)
    ch = f.find_channel(channel['id'], private_channels)

    if ch.del_user(username):
        user.del_channel(ch)
        print(f"{username} leaves {ch.name}")

        if len(ch.users) == 0:
            # Remove the uploads
            print(f"Channel: {ch.name} will be delete.")
            private_channels.remove(ch)
            if os.path.exists(UPLOAD_FOLDER + '/' + ch.id):
                shutil.rmtree(UPLOAD_FOLDER + '/' + ch.id)
                print(f'Delete files form {UPLOAD_FOLDER + "/" + ch.id}.')
        
        emit('leave channel', {'user': username, 'channel': ch.info()}, broadcast=True)
    
@socketio.on("invite users")
def invite_user(data):
    user = data['user']
    channel = data['channel']
    other_users = data['users']

    # Check the user exist
    if force_logout(user):
        return

    # Add the notification to users and Emit the Event
    notification = {'user': user, 
                    'channel': channel,
                    'users': other_users,
                    'msg': f"{user} invite you to join to {channel}.",
                    'type': 'invitation',
                    'invitation': True,
                    'check': False}

    for item in data['users']:
        f.add_notification(notification, item, users)

    # Send a notification for users invited
    emit("notification", notification, broadcast=True)
    
    if len(other_users) > 0:
        # Add the notification to user and Emit the Event
        notification = {'users': [user],
                        'msg': f"You invited {', '.join(other_users)} to {channel}.",
                        'type': 'information'}
        
        f.add_notification(notification, user, users)

        # Send a notification for users invited
        emit("notification", notification, broadcast=True)

@socketio.on("new message")
def new_message(data):
    # Check if user exist
    if force_logout(data['user']['username']):
        return
    # Find the user and the channel
    user = f.find_user(data['user']['username'], users)
    # Check that the channel exists
    channel = f.find_channel(data['channel'], public_channels)
    if not channel:
        channel = f.find_channel(data['channel'], private_channels)

    if not channel:
        print(f"The channel: {data['channel']} does not exists.")
        emit('send message', {'success': False, 'msg': f'The channel: {data["channel"]} does not exist'}, broadcast=False)
    else:
        # Create the message from data
        message = Message(user, data['id'], data['content'], data['date'], data['state'], data['type'])

        # Add the message to the channel
        channel.add_message(message)
        print(f'Sending message to channel: {channel.name}, {channel.id}.')
        emit('send message', {'success': True, 'message': message.info(), 'channel': channel.info()}, broadcast=True)

@socketio.on("delete msg")
def delete_msg(data):
    ch_id = data['channel']
    msg = data['message']

    ch = f.find_channel(ch_id, public_channels)
    if not ch:
        ch = f.find_channel(ch_id, private_channels)
    
    if ch.del_message(msg['id']):
        emit("delete message", {"success": True, "msg": msg['id'], 'channel': ch.info()}, broadcast=True)
    else:
        emit("delete message", {"success": False, "msg": "The message could not delete."}, broadcast=True)

@socketio.on("notification")
def notification(data):
    user = data['user']
    noti = data['response']

    # Check user exist:
    if force_logout(user):
        return

    if noti['type'] == 'invitation':
        # Check the notification
        u = f.find_user(user, users)
        u.check_notification(noti['res'], noti['user'], noti['ch'])
        print(noti)
        if noti['res'] == 'no':
            # Create the notification response
            notification = { 'users': [noti['user']],
                        'msg': f"{user} rejected your invitation to {noti['ch']}.",
                        'type': 'information'}
            print(notification)
            f.add_notification(notification, noti['user'], users)

            # Send a notification
            emit("notification", notification, broadcast=True)
        else:
            # Add the user to the channel
            id_channel = 'ch-'+ noti['ch']
            ch = f.find_channel(id_channel, private_channels)
            f.add_to_channel(private_channels, u, ch_name=noti['ch'])
            
            # Create the notification response
            notification = { 'users': [noti['user']],
                        'msg': f"{user} accepted your invitation to {noti['ch']}.",
                        'type': 'information'}
            print(notification)
            f.add_notification(notification, noti['user'], users)
            # Send a notification
            emit("notification", notification, broadcast=True)

            # Send the channel info
            res = {}
            res['host'] = noti['user']
            res['guess'] = user
            res['channel'] = ch.info()
            print(res)
            emit('channel invitation', res, broadcast=True)
    else:
        # Add the notification to users and Emit the Event
        notification = {'users': noti['users'],
                        'msg': noti['msg'],
                        'type': noti['type']}

        for item in noti['users']:
            f.add_notification(notification, item, users)

        # Send a notification for users added
        emit("notification", notification, broadcast=True)

@socketio.on("profile img")
def change_profile_img(data):
    username = data['user']
    image = data['image']
    
    if force_logout(username):
            return

    try:
        user = f.find_user(username, users)
        user.set_settings(avatar=image['src'])
        
        emit('change img', {'success': True, 'image': image, 'user': username}, broadcast=True)
    except:
        emit('change img', {'success': False, 'msg': 'Could not load the image.', 'user': username}, broadcast=True)

@socketio.on("update user")
def update_user(data):
    username = data['username']

    if force_logout(username):
        return
    
    user = f.find_user(username, users)
    user.last_active = time()

    # Create a dict to response
    ch_public = []
    ch_private = []
    
    for ch in public_channels:
        ch_public.append(ch.info())
    
    for ch in private_channels:
        if username in ch.users:
            ch_private.append(ch.info())

    res_user = user.info()
    res_user['users'] = f.users_list(users, user)
    # Send response
    emit('update user', {'success': True,
                        'user': res_user, 
                        'public_channels': ch_public, 
                        'private_channels': ch_private}, broadcast=True)

def force_logout(username):
    u = f.find_user(username, users)
    if not u:
        print(f'{username} does not exists. Logout.')
        delete_files(username)
        emit('force logout', {'user': username, 'url': url_for('index')}, broadcast=True)
        return True
    else:
        last_active = time() - u.last_active

        if last_active > TIME_TO_FORCE_LOGOUT:
            print(f'{username} will be Logout.')

            f.delete_user(username, users)
            f.del_to_channels(public_channels, username)
            f.del_to_channels(private_channels, username)
            # Delete the files
            delete_files(username)
            # Delete the private channels without users
            f.del_empty_channel(private_channels)
            # Announce the logout user
            announce_logout({'username': username})
            return True
        u.last_active = time()

    return False 

def delete_files(username):
    
    ch_dir = []

    # Delete avatar pictures uploaded by username
    with os.scandir(AVATAR_FOLDER) as it:
        for entry in it:
            if entry.is_dir() and (entry.name == username):
                shutil.rmtree(AVATAR_FOLDER + '/' + username)
    
    # Find the folder names inside UPLOAD_FOLDER
    with os.scandir(UPLOAD_FOLDER) as it:
        ch_dir = ['/'.join([UPLOAD_FOLDER, entry.name]) for entry in it if entry.is_dir()]
    
    # Delete the files uploaded by username
    for folder in ch_dir:
        with os.scandir(folder) as it:
            for entry in it:
                if entry.is_dir() and (entry.name == username):
                    shutil.rmtree(folder + '/' + username)


if __name__ == "__main__":
    socketio.run(app, debug=True)