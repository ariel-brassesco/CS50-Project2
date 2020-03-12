'use strict';

// Upload a file to server
function change_profile_img(user){
    // Initialize new request
    const request = new XMLHttpRequest();
    var file_info = getFileInfo(this.files[0]);
    request.open('POST', '/uploads');

    // Callback function for when request completes
    request.onload = () => {

        // Extract JSON data from request
        const data = JSON.parse(request.responseText);

        // Update the result div
        if (data.success) {
            // Send the new message
            console.log(data.msg)
            console.log("Changing profile image");
            // Add the source path to file_info object
            file_info['src'] = data.src;

            socket_event("profile img", {'user': user.username, 'image': file_info});
        } else {
            console.log(data.msg);

        }
    }
        
    // Add data to send with request
    const data = new FormData();
    data.append('file', this.files[0]);
    data.append('username', user.username);
    data.append('channel', 'avatar');
    // Send request
    request.send(data);

    return false;
}

function load_counter() {
    let channels = getData('user').channels;
    
    setCounterElements('notifications', 'notifications');
    for (let i=0; i < channels.length; i++) {
        setCounterElements(channels[i][0], channels[i][2]);
    }

}

function load_notification(notification) {
    // Add the new message to the chat
    const temp_noti = Handlebars.compile(document.querySelector('#temp-notification').innerHTML);
    const ch_noti = findElementByClass(document.getElementById("notifications"), "noti");
    
    ch_noti.innerHTML += temp_noti({'notification': notification});
}

function load_noti_event(u) {
    // Send the socket notification
    socket_event('notification',{'user': u.username, 'response':this.dataset});
    // Check the notification
    checkInvitationNoti(this.innerHTML, this.dataset.user, this.dataset.ch);

    // Change the notification content
    let check = document.createElement('span');
    let content = this.parentNode.children;

    check.innerHTML = this.innerHTML;
    content[0].append(check);

    content[2].parentNode.removeChild(content[2]);
    content[1].parentNode.removeChild(content[1]);
}

function load_notifications(){
    let i;
    let user = getData('user');

    for (i=0; i < user.notifications.length; i++){
        load_notification(user.notifications[i]);
    }
    // Add the events to buttons in notification
    let btn_ch_inv = document.getElementsByName('ch-inv');
    for (let btn of btn_ch_inv){
        btn.addEventListener('click', load_noti_event.bind(btn, user), false);
    }
    console.log("Notifications Loaded.");
}

function load_main_elements() {
    // Define Selectors
    const logout_btn = document.querySelector('.btn-logout');
    const btn_channels = document.querySelectorAll('.nav-channel');
    const new_ch_btn = document.getElementById('nav-ch-title');
    const btn_notifications = document.getElementById('notifications').children[0];
    const avatar = document.getElementsByClassName('avatar-img')[0];

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
            // Reset the non-read notifications
            resetCounter('notifications');
            setCounterElements('notifications', 'notifications', true);
            // Scrolldown the notifications box
            scrolldown(noti_box);
        } else {
            noti_box.style.display = "none";
        }
    };

    avatar.onclick = function() {
        let user = getData('user');
        //this.classList.toggle('profile-img');
        const input = document.createElement('input');

        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.addEventListener('change', change_profile_img.bind(input, user), false)

        input.click();
    }

    // Close menu when click outside
    window.onclick = function(event) {
        //console.log(event.target);
        // Close the notifications menu when click outside
        close_menu(event.target, btn_notifications, noti_box);
        // Remove box-invite-users        
        let header = document.getElementsByClassName('ch-header')[0];
        let btn_plus = findElementByClass(header, 'ch-header-plus');
        let box_inv_users =  findElementByClass(header, 'box-invite-users')
        if (box_inv_users) {
            if (event.target !== box_inv_users && event.target !== btn_plus) {
                box_inv_users.remove();
            }
        }
    }
}

function loadServices() {
    
    // Load the Events for Main Page
    load_main_elements();
    load_counter();
    
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

    // Add a Channel to an accepted invitation
    socket.on('channel invitation', socket_channel_invitation, false);

    // Remove a Channel
    socket.on('leave channel', socket_del_channel, false);

    // Notifications
    socket.on('notification', socket_notification, false);

    // New Message
    socket.on('send message', socket_send_message, false);

    // Delete Message
    socket.on('delete message', socket_delete_message, false);

    // Change Profile Image
    socket.on('change img', socket_change_profile_image, false);
}
