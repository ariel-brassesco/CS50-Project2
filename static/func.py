# Check that the username is not already used
def check_user(username, users):
    for user in users:
        if username == user.username:
            return False
    return True

# Find a user by username in a list of users
def find_user(username, users):
    for user in users:
        if username == user.username:
            return user
    return False

# Return a list of users different for the user passed
def users_list(users, user):
    lst = []

    for u in users:
        if u.username != user.username:
            lst.append(u.username)
    return lst

# Add a channel to a user
def add_to_channel(channels, user, ch_name=False):

    for ch in channels:
        if ch_name:
            if ch_name == ch.name:
                ch.add_user(user.username)
                user.add_channel(ch)  
                break
        else:
            ch.add_user(user.username)
            user.add_channel(ch)
    
# Delete a user from a list of users
def delete_user(username, users):
    for idx, user in enumerate(users):
        if user.username == username:
            del users[idx]
            return True
    return False

# Delete a user from a channel
def del_to_channels(channels, username):
    for ch in channels:
        ch.del_user(username)

# Check that a channel name is not already used
def check_channel(ch_name, channels):
    for ch in channels:
        if ch.name == ch_name:
            return False
    return True

# Find a channel by id in a list of channels
def find_channel(ch_id, channels):

    for ch in channels:
        if ch.id == ch_id:
            return ch
    return False

# Add notification to username
def add_notification(notification, username, users) :
    for u in users:
        if username == u.username:
            u.add_notification(notification)


# Check the file is allowed
def allowed_file(filename, allow_extensions):
	return '.' in filename and filename.rsplit('.', 1)[1].lower() in allow_extensions

def get_filename(address):
    return address.split('/')[-1]
