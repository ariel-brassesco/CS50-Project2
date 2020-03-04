'use strict';

function load_notification(notification) {
    // Add the new message to the chat
    const temp_noti = Handlebars.compile(document.querySelector('#temp-notification').innerHTML);
    const ch_noti = findElementByClass(document.getElementById("notifications"), "noti");
    
    ch_noti.innerHTML += temp_noti({'notification': notification});

    // Add the events to buttons in notification
    if (notification.invitation) {
        let noti = Array.from(ch_noti.children).pop();
        let btn_ch_inv = findElementsByName(noti, 'ch-inv');
        let user = getData('user');

        Array.from(btn_ch_inv).forEach((b) => {
            b.onclick = function() {
                socket_event('notification',{'username': user.username, 'response':this.dataset});
            };
        });
    }
}

function load_notifications(){
    let i;
    let user = getData('user');

    for (i=0; i < user.notifications.length; i++){
        load_notification(user.notifications[i]);
    }
    console.log("Notifications Loaded.");
}

function load_message(ch_id, message) {
    // Add the new message to the chat
    const elem = document.getElementById(ch_id);
    const chat = findElementByClass(elem, 'ch-msg');
    const msg_template = Handlebars.compile(document.querySelector('#temp-msg').innerHTML);
    let data_temp = createDataMessage(message);
    
    // Render the template
    chat.innerHTML += msg_template(data_temp);

    //Add event to messages
    if (data_temp.file) {
        let msg = Array.from(chat.children).pop();
        let btn_dw_file = findElementByName(msg, 'user_file');
        let file_info = {'src': btn_dw_file.dataset.src,
                        'type': btn_dw_file.dataset.type};

        btn_dw_file.addEventListener('click', download_file.bind(null, file_info), false);
    }

}

function load_channel(channel) {
    const channel_template = Handlebars.compile(document.getElementById('temp-channel').innerHTML);
    const page = document.querySelector('.grid-main');
    
    // Render the channel_template
    page.innerHTML += channel_template({'channel': channel});

    // Set display: none.
    const page_channel = document.getElementById(channel.id);
    page_channel.style.display = "none";
    console.log("Channel Loaded.");

    // Load the messages
    let i;
    for (i=0; i < channel.messages.length; i++){
        load_message(channel.id, channel.messages[i]);
    }
    console.log("Messages Loaded.");
}

function load_channels() {
    let public_ch = getData('public_channels');
    let private_ch = getData('private_channels');
    let channels = public_ch.concat(private_ch);
    let i;

    for (i=0; i < channels.length; i++){
        load_channel(channels[i]);
    }
}

function load_create_ch() {
    const channel_template = Handlebars.compile(document.getElementById('temp-create-ch').innerHTML);
    const page = document.querySelector('.grid-main');
    
    // Render the channel_template
    page.innerHTML += channel_template();

    // Set display: none.
    const channel_creator = document.getElementById("new-ch");
    
    channel_creator.style.display = "none";
    console.log("Channel Creation Loaded.");
}

function load_main_elements() {
    // Falta el Setting y Notification
    
    // Define Selectors
    const logout_btn = document.querySelector('.btn-logout');
    const btn_channels = document.querySelectorAll('.nav-channel');
    const new_ch_btn = document.getElementById('nav-ch-title');
    const btn_notifications = document.getElementById('notifications').children[0];

    // Add the Logout Button click
    logout_btn.addEventListener('click', logout, false);
    
    // Add the Create New Channel click
    new_ch_btn.addEventListener('click', open_channel.bind(null, 'new-ch'), false);

    // Add the Open Channel Chat click
    btn_channels.forEach( (e) => {
        const ch_id = findChannelById(e.id);
        
        if (ch_id !== -1) {
            console.log('Event to ' + e.id + ' added to open channel: ' + ch_id);
            e.addEventListener('click', open_channel.bind(null, ch_id), false);   
        }
    });

    // Load the notifications
    load_notifications();

    // Add the event click to Notifications btn to show notifications
    const noti_box = document.getElementsByClassName('noti')[0];
    btn_notifications.onclick = function() {
        if ((noti_box.style.display === "") || (noti_box.style.display === "none")) {
            noti_box.style.display = "flex";
        } else {
            noti_box.style.display = "none";
        }
    };

    // Close menu when click outside
    window.onclick = function(event) {
        // Close the notifications menu when click outside
        close_menu(event.target, btn_notifications, noti_box);
    }
}

function loadServices() {

    var user = getData('user');
    
    // Load the Events for Main Page
    load_main_elements();

    // Build the elements.
    load_create_ch();
    load_channels();
    
    // Show the active_ch
    let active_ch = getData('active_ch');
    saveData('active_ch', false);
    if (!active_ch) {
        console.log("There is no active channel.");
    } else {
        console.log("The active channel is " + active_ch);
        open_channel(active_ch);
    }
}

function loadSocketEvents() {
    let socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    
    // When a new user is announced
    socket.on('announce user', socket_announce_user, false);
    
    // Chequear el username como ID.
    socket.on('announce logout', socket_announce_logout, false);
    
    // Add a new Channel
    socket.on('add channel', socket_add_channel, false);

    // Falta agregar la opcion de eliminar el canal.

    // Notifications
    socket.on('notification', socket_notification, false);

    // New Message
    socket.on('send message', socket_send_message, false);

}