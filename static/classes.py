import json

class User:
    
    def __init__(self, username, settings = {}):
        self.username = username
        self.settings = settings
        self.active_ch = False 
        self.channels = []
        self.notifications = []

    def add_channel(self, channel):
        # Check if the channel already exist
        for ch in self.channels:
            if ch == channel.name:
                return {False: "The channel is already in the list."}
        # Add the channel to the list
        self.channels.append([channel.name, channel.status, channel.id, channel.propose])
    
    def add_notification(self, notification):
        # Add the notification to the list
        self.notifications.append(notification)
    
    def info(self):
        return json.loads(json.dumps(self, cls=FlackEncoder))

    def set_settings(self, **kargs):
        try:
            for key, value in kargs:
                self.settings[key] = value
        except:
            return False
        return True
        

class Channel:

    def __init__(self, name, status = "public", propose=""):
        self.name = name
        self.id = 'ch-' + self.name
        self.propose = propose
        self.status = status
        self.messages = []
        self.users = []

    def info(self):
        return json.loads(json.dumps(self, cls=FlackEncoder))

    def add_message(self, message):
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

class Message:

    def __init__(self, user, content, date_time, state = True, types = 'text'):
        self.username = user.username
        self.settings = user.settings
        self.content = content
        self.date = date_time
        self.state = state
        self.types = types
    
    def info(self):
        return json.loads(json.dumps(self, cls=FlackEncoder))
    
    def set_setting(self, **kargs):
        for key in kargs:
            self.settings[key] = kargs[key]


# Define a subclass to Encode JSON
class FlackEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (User, Channel, Message)):
            return obj.__dict__
        else:
            return json.JSONEncoder.default(self, obj)


def main():
    pass

if __name__ == "__main__":
    main()