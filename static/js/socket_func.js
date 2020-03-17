'use strict';
// Add new user
function socket_announce_user(data){
    let u = getData('user');
    // Anounce the new user if there is not already in the list
    if (data.username !== u.username && (!u.users.includes(data.username))) {
        console.log("A new user was added.")
        // Add the new user to the list
        const el = document.createElement('li')
        const user_list = document.getElementById('nav-list-users');

        el.setAttribute('id', data.username);
        el.classList.add('nav-user');
        el.innerHTML = data.username;
        user_list.append(el);

        // Save the data
        add_user(data.username);
    }
}

// Del logout user
function socket_announce_logout(data) {
    let user = getData('user');

    if (data.username === user.username) {
        // Remove the user info from localeStorage
        cleanData();
        return location.reload();
    }
    // For other users delete the logout user from list
    const el = document.getElementById(data.username);
    remove_user(data.username);
    el.remove();
    console.log(data.username + " logging out.");
}

// Force Logout
function socket_force_logout(data) {
    let user = getData('user');
    console.log(data)
    if (data.user === user.username){
        cleanData();
        window.location = data.url;
    }
}

// Add a new Channel
function socket_add_channel(data) {
    console.log('add channel Event');
    let user = getData('user');

    if (data.success) {
        // Check the users could add to channel        
        if (data.channel.status === "private" && !data.channel.users.includes(user.username)) return;
        if (!(findChannelById(data.channel.name) === -1)) return;
        
        console.log('Channel: ' + data.channel.name + ' (' + data.channel.status + ')' + ' has been created.');
        // Save the data
        add_channel(data.channel);

        // Add the new channel to the list
        const el = document.createElement('li');
        const msg_counter = document.createElement('span');
        const list_ch = document.getElementById('nav-list-ch');
    
        // Set the list element
        el.setAttribute('id', data.channel.name);
        el.classList.add(data.channel.status);
        el.classList.add('nav-channel');
        el.innerHTML = data.channel.name;

        // Set the span counter
        msg_counter.setAttribute('class', 'counter');
        el.appendChild(msg_counter);
        // Add the event "click" to open the channel
        el.addEventListener('click', open_channel.bind(null, data.channel.id), false);
        // Add the channel to the list
        list_ch.append(el);

        // Reset the counter of non-read message
        resetCounter(data.channel.id);
    }
    else {
        if (data.user === user.username){
        console.log('The channel could not be created.');
        alert(data.msg);
        open_channel('new-ch');
        }
    }
}

// Add a new Channel
function socket_channel_invitation(data) {
    console.log('Channel Invitation Event');
    let user = getData('user');

    if (data.guess === user.username) {
        console.log(`${user.username} join to ${data.channel.name}`);
        // Save the data
        add_channel(data.channel);

        // Add the new channel to the list
        const el = document.createElement('li');
        const msg_counter = document.createElement('span');
        const list_ch = document.getElementById('nav-list-ch');
    
        // Set the list element
        el.setAttribute('id', data.channel.name);
        el.classList.add(data.channel.status);
        el.classList.add('nav-channel');
        el.innerHTML = data.channel.name;

        // Set the span counter
        msg_counter.setAttribute('class', 'counter');
        el.appendChild(msg_counter);
        // Add the event "click" to open the channel
        el.addEventListener('click', open_channel.bind(null, data.channel.id), false);
        // Add the channel to the list
        list_ch.append(el);

        // Reset the counter of non-read message
        resetCounter(data.channel.id);
    }
    else if (data.host === user.username){
        console.log(`${data.guess} accepted to join to ${data.channel.name}.`);
        // Update users channels
        update_users_from_ch(data.channel.id, data.channel.users);
        
    } else {
        return;
    }
}

// Remove a channel.
function socket_del_channel(data) {
    console.log('Remove a Channel Event');
    let user = getData('user');

    if (data.user == user.username) {
        // Remove the channel
        remove_ch(data.channel.id);
        // Delete the channel from list
        const el = document.getElementById(data.channel.name);
        el.remove();
        // Notify the leaving
        socket_event('notification', {'user': user.username, 'response': {'type': 'information',
                                                                            'users': data.channel.users,
                                                                            'msg': `${user.username} leave ${data.channel.name}`}})
        console.log(`${data.user} leave the channel: ${data.channel.name}`);
    } else if (data.channel.users.includes(user.username)) {
        // Update users channels
        update_users_from_ch(data.channel.id, data.channel.users);
    } else {}
}

// Notifications
function socket_notification(data) {
    
    let user = getData('user');
    
    if (data.users.includes(user.username)) {
        console.log("New Notification.");
        // Save the data
        add_notification(data);
        // Update the counter
        updateCounter('notifications');
        setCounterElements('notifications', 'notifications');
        // Add the new notification
        load_notification(data);
        
        let btn_ch_inv = document.getElementsByName('ch-inv');
        for (let btn of btn_ch_inv){
            btn.addEventListener('click', load_noti_event.bind(btn, user), false);
        }
    }
}

// New Message
function socket_send_message(data) {
    let user=getData('user');
    if (data.success && data.channel.users.includes(user.username)) {
        console.log('Channel: ' + data.channel.name + ' (' + data.channel.status + ')' + ' has sent a message.');
        // Save the data
        add_message(data.channel);

        // Add the new message to the active chat
        let active_ch = getData('active_ch');
        if (active_ch === data.channel.id){
            // Load the message in channel
            const channel_elem = document.getElementById('channel');
            load_message(channel_elem, data.message);
            load_message_events();
            // Scrolldown the chat
            scrolldown(document.getElementById('channel').children[1]);

            if (getSizeChat() >= 100) delete_message(channel_elem, false);
        } else {
            updateCounter(data.channel.id);
            setCounterElements(data.channel.name, data.channel.id);
        }
        
    } else {
        console.log('The message could not be sent.');
        console.log(data.msg);
    }
}

// Delete Message
function socket_delete_message(data){

    if (data.success){
        // Save Data
        del_message(data.msg, data.channel);
        // If the channel is active, delete the message.
        // Else, update the counter to announce the event
        let active_ch = getData('active_ch');
        if (active_ch === data.channel.id){
            let messages = document.getElementsByClassName('msg');
            for (let i=0; i < messages.length; i++){
                if (messages[i].dataset.id === data.msg) {
                    // Remove the content and the delete button
                    messages[i].children[2].remove()
                    messages[i].children[1].children[2].remove();
                    // Create the new content and append to message div
                    let msg_content = document.createElement('p');
                    msg_content.innerHTML = "\u{1f6c7} This message was deleted."
                    messages[i].children[1].appendChild(msg_content);
                }
            }
        } else {
            updateCounter(data.channel.id);
            setCounterElements(data.channel.name, data.channel.id);
        }

    } else{
        console.log(data.msg);
    }
}

// Change Profile Image
function socket_change_profile_image(data){
    console.log('socket to change profile image');
    if (data.success){
        let user = getData('user');
        
        if (user.username === data.user){
            // Save Data
            user.settings.avatar = data.image.src;
            saveData('user', user);
            // Change image profile
            document.getElementsByClassName('avatar-img')[0].src=data.image.src;
        }
    } else{
        console.log(data.msg);
    }
}

// Update user
function socket_update_user(data){
    console.log('Update user info');
    
    if (data.success){
        let user = getData('user')
        if (user.username === data.user.username) {
            saveData('user', data.user);
            saveData('public_channels', data.public_channels);
            saveData('private_channels', data.private_channels);
            location.reload();
        }
    }
}