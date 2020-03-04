'use strict';

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

// Add a new Channel
function socket_add_channel(data) {
    console.log('add channel Event');
    console.log(data);
    let user = getData('user');

    if (data.success) {
        console.log('Channel: ' + data.channel.name + ' (' + data.channel.status + ')' + ' has been created.');
        
        if (data.channel.status === "private" && !data.channel.users.includes(user.username)) {
        } else {
            // Save the data
            add_channel(data.channel);

            // Add the new channel to the list
            const el = document.createElement('li');
            const list_ch = document.getElementById('nav-list-ch');
    
            el.setAttribute('id', data.channel.name);
            el.classList.add(data.channel.status);
            el.classList.add('nav-channel');
            el.innerHTML = data.channel.name;
            // Add the event "click" to open the channel
            el.addEventListener('click', open_channel.bind(null, data.channel.id), false);
            // Add the channel to the list
            list_ch.append(el);

            // Load the channel
            load_channel(data.channel);
        }
    }
    else {
        console.log('The channel could not be created.');
        alert(data.msg);
        open_channel('new-ch');
    }
}

// Falta agregar la opcion de eliminar el canal.

// Notifications
function socket_notification(data) {
    console.log(data);
    let user = getData('user');
    
    if (data.users.includes(user.username)) {
        // Save the data
        add_notification(data);
        // Add the new message to the chat
        load_notification(data);
    }
}

// New Message
function socket_send_message(data) {
    
    if (data.success) {
        console.log('Channel: ' + data.channel.name + ' (' + data.channel.status + ')' + ' has sent a message.');
        // Save the data
        add_message(data.channel);
        // Add the new message to the chat
        load_message(data.channel.id, data.message);
    } else {
        console.log('The message could not be sent.');
        alert(data.msg);
    }
}