import json

class User:
    
    def __init__(self, username, settings = {}):
        self.username = username
        self.settings = settings
        self.active_ch = False
        self.last_active = 0
        self.channels = []
        self.notifications = []

    def add_channel(self, channel):
        # Check if the channel already exist
        for ch in self.channels:
            if ch[0] == channel.name:
                return {False: "The channel is already in the list."}
        # Add the channel to the list
        self.channels.append([channel.name, channel.status, channel.id, channel.purpose])
    
    def del_channel(self, channel):
        # Check if the channel already exist
        for ch in self.channels:
            if ch[0] == channel.name:
                # Remove the channel
                self.channels.remove(ch)
                return True
        return False
    
    def add_notification(self, notification):
        # Add the notification to the list
        self.notifications.append(notification)

    def check_notification(self, res, u, ch, t='invitation'):
        check = {'yes': '\u2714', 'no': '\u274c'}
        
        for n in self.notifications:
            if (n['type'] == t and n['user'] == u and n['channel'][0] == ch):
                n['check'] = check[res]
                break
    
    def info(self):
        return json.loads(json.dumps(self, cls=FlackEncoder))

    def set_settings(self, **kargs):
        try:
            for key, value in kargs.items():
                self.settings[key] = value
        except Exception as e:
            print(e)
            return False
        return True
        
class Channel:

    def __init__(self, name, status = "public", purpose=""):
        self.name = name
        self.id = 'ch-' + self.name
        self.purpose = purpose
        self.status = status
        self.messages = []
        self.users = []

    def info(self):
        return json.loads(json.dumps(self, cls=FlackEncoder))

    def add_message(self, message):
        # Check the amount of messages
        if len(self.messages) >= 100:
            self.messages = self.messages[1:]

        if message.username in self.users:
            self.messages.append(message)
            return True
        return False
    
    def add_user(self, username):
        # Check the user is not in the channel 
        for u in self.users:
            if u == username:
                return False
        self.users.append(username)
        return True
    
    def del_user(self, username):
        # Check the user is not in the channel 
        try:
            self.users.remove(username)
        except:
            return False
        return True
    
    def del_message(self, msg_id):
        for msg in self.messages:
            if msg.id == msg_id:
                msg.state = False
                return True
        
        return False

class Message:

    def __init__(self, user, id_msg, content, date_time, state = True, types = 'text'):
        self.username = user.username
        self.settings = user.settings
        self.id = id_msg
        self.content = content
        self.date = date_time
        self.state = state
        self.types = types
    
    def info(self):
        return json.loads(json.dumps(self, cls=FlackEncoder))

# Define a subclass to Encode JSON
class FlackEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (User, Channel, Message)):
            return obj.__dict__
        else:
            return json.JSONEncoder.default(self, obj)


def main():
    # Implement for testing
    pass


if __name__ == "__main__":
    main()