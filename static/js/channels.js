'use strict'

// Socket Event Emit
function socket_event(e_name, data) {
    let socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    
    // Emit the 'e_name' socket Event
    socket.emit(e_name, data);
}

// Open channel by ID and load the events
function open_channel(ch_id){
    // Check that the channel is not the active channel
    var active_ch = getData('active_ch');
    
    if (!active_ch || (active_ch !== ch_id)) {
        // Set activate_ch = ch_id and show the channel.
        saveData('active_ch', ch_id);
        // Reset the counter of non-read message
        resetCounter(ch_id);
        // Load the elements of channel
        var load_elem = (ch_id === 'new-ch')?load_create_elements: load_channel_elements;
        load_elem();
    };

}

// Close the menu when click outside
function close_menu(target, e_click, e_target) {
    let type_display = ['none', ''];
    let match = (target === e_click) || (target === e_target);

    if (!match && !type_display.includes(e_target.style.display)) {
        e_click.click();
    }
}

// Scrolldown menu
function scrolldown(elem){
    if (elem.scrollTopMax){
        elem.scrollTop = elem.scrollTopMax;
    } else {
        elem.scrollTop = elem.scrollHeight - elem.clientHeight;
    }
    
}

// Generate the emojis div element
function generate_emojis(){
    let emojis = new Array(80).fill(undefined).map((v, i)=>{return String.fromCodePoint(0x1f600 + i);});
    const elem = document.createElement("div");

    for (let i=0; i<emojis.length; i++){
        let el = document.createElement("span");
        el.setAttribute('class', 'emoticon');
        el.innerHTML = emojis[i];
        elem.append(el);
    }
    
    return elem;
}

// Generate the attanchment files div element
function generate_attachment(){
    //let attach = ['\u{1f5bc}', '\u{1f5ba}', '\u{1f5b9}'];
    let attach = ['../static/images/attach-icons/picture-icon.png',
                    '../static/images/attach-icons/pdf-icon.png',
                    '../static/images/attach-icons/file-icon.png'];
    let attach_type = ['image', 'pdf', 'other'];
    const elem = document.createElement("div");

    for (let i=0; i<attach.length; i++){
        let el = document.createElement("span");
        let img = document.createElement("img");
        // Set the src of icon
        img.setAttribute('src', attach[i]);
        // Add the img to span element
        el.setAttribute('class', 'menu-item');
        el.dataset.type = attach_type[i];
        //el.innerHTML = attach[i];
        el.append(img);
        elem.append(el);
    }
    
    return elem;
}

// Load emojis
function load_emojis(e_container, btn, emojis, e_write, display_type='flex', cls='menu-tb') {
    // Add the div emojis to html page
    emojis.setAttribute('class', cls);
    e_container.append(emojis);

    // Add the event click to emoji btn to show emojis
    btn.onclick = function() {
        if ((emojis.style.display === "") || (emojis.style.display === "none")) {
            emojis.style.display = display_type;
        } else {
            emojis.style.display = "none";
        }
    };
    
    // Add the emoji to textarea when click
    for (let i=0; i < emojis.children.length; i++) {
        emojis.children[i].onclick = () => { e_write.value += emojis.children[i].innerHTML;};
    }
}

// Load attachment icons
function load_attachment(e_container, btn, attach, display_type='flex', cls='menu-tb') {
    // Add the div emojis to html page
    attach.setAttribute('class', cls);
    e_container.append(attach);

    // Add the event click to emoji btn to show emojis
    btn.onclick = function() {
        if ((attach.style.display === "") || (attach.style.display === "none")) {
            attach.style.display = display_type;
        } else {
            attach.style.display = "none";
        }
    };
    
    // Add the click input to attach icon when click
    for (let i=0; i < attach.children.length; i++) {
        attach.children[i].onclick = function() { 
            let input_type = findElementByName(e_container, this.dataset.type);
            input_type.click();
        };
    }
}

// Check the content in the textarea until send message
function check_content(elem) {
    let text = elem.value;
    
    // Delete the whitespaces at start
    while (text.startsWith(" ") || text.endsWith(" ")){
        if (text.startsWith(" ")) text = text.slice(1);
        if (text.endsWith(" ")) text = text.slice(0,text.length-1);
    }

    // Return "false" is the message is an empty string
    if (text === "") return false; 
    // Change the value of the element and return "true"
    elem.value = text;
    return true;
}

// Preview the file until send
function preview_file(elem, ev) {
    var file = ev.target.files[0];
    let type = checkFileType(file);
    let temp_preview = Handlebars.compile(document.getElementById('temp-preview').innerHTML);
    const preview = findElementByClass(elem, 'file-preview');
    const img_src = createFileLogo();

    if (!type) {
        return;
    }
    
    var img = document.createElement("img");
    //img.classList.add('preview');
    img.file = file;
    
    preview.innerHTML = temp_preview({'file': getFileInfo(file)});

    if (type === 'image') {
        var reader = new FileReader();
        reader.onload = (function(aImg) { 
                    return function(e) {  aImg.src = e.target.result;
                                        preview.children[0].children[0].innerHTML = "";
                                        preview.children[0].children[0].append(img);};
                                        })(img);

        reader.readAsDataURL(file);
    } else {
        preview.children[0].children[0].innerHTML = "";
        img.src = img_src[type];
        preview.children[0].children[0].append(img);
    }

    // Add the event to close the preview and delete the file attached
    let btn_close = findElementByClass(preview, 'btn-close')
    btn_close.onclick= ()=>{
        ev.target.value ="";
        preview.innerHTML = "";};
}

// Upload a file to server
function upload_file(input, ch_id, user, date, msg_id){

    // Initialize new request
    const request = new XMLHttpRequest();
    let type = checkFileType(input.files[0]);
    var file_info = getFileInfo(input.files[0]);
    request.open('POST', '/uploads');

    // Callback function for when request completes
    request.onload = () => {

        // Extract JSON data from request
        const data = JSON.parse(request.responseText);

        // Update the result div
        if (data.success) {
            // Send the new message
            console.log(data.msg)
            console.log("Sending Message from channel " + ch_id);
            // Add the source path to file_info object
            file_info['src'] = data.src;

            socket_event("new message", {'channel': ch_id, 'user': user, 'content': file_info, 
                        'date': date, 'id': msg_id, 'state': true, 'type': type});
        } else {
            console.log(data.msg);

        }
    }
        
    // Add data to send with request
    const data = new FormData();
    data.append('file', input.files[0]);
    data.append('username', user.username);
    data.append('channel', ch_id);
    // Send request
    request.send(data);

    return false;
}

// Dowload a file from server
function download_file(file_info){
    console.log("Try to download File");
    const request = new XMLHttpRequest();

    request.open('POST', '/downloads');
    console.log(file_info);
    request.onload = () => {

        let header = request.getResponseHeader('content-disposition');
        console.log(header);
        // The actual download
        var filename = header.split('=').pop();
        var blob = new Blob([request.response], { type: file_info.type });
        var link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);
        return false;
    }
    // Add data to send with request
    const data = new FormData();
    data.append('src', file_info.src);
    data.append('type', file_info.type);
    // Send request
    request.send(data);

    return false;
}


// Functions to load a new channel form

function load_create_ch() {
    const channel_template = Handlebars.compile(document.getElementById('temp-create-ch').innerHTML);
    const page = document.querySelector('.grid-main');
    
    // Render the channel_template
    page.innerHTML = channel_template();
    console.log("Channel Creation Loaded.");
    return document.getElementById('new-ch');
}

function load_create_elements() {
    console.log("Loading elements of create channel.");
    // Define Buttons
    const elem = load_create_ch();
    const btn_create = findElementByClass(elem, 'btn-create-ch');
    const btn_close = findElementByClass(elem, 'btn-close-create');
    const i_name = document.querySelector('input[name=ch_name]');
    const check_st = document.querySelector('input[name=ch_st]');
    const add_user = document.querySelector('input[name=add_u]');
    let user = getData('user');

    // Change symbol for channel name
    check_st.onchange = function() {
        let e = findElementByClass(elem, 'add_users');
        let e_list = document.getElementById('add_u_names');

        if (this.checked) {
            i_name.previousSibling.previousSibling.innerHTML = "&#x0023";
            e.classList.add('inactive');
            e_list.innerHTML = "";
        } else { 
            e.classList.remove('inactive');
            i_name.previousSibling.previousSibling.innerHTML = "&#x1f512";}
    };
    // Check name channel
    btn_create.disabled = true;
    i_name.oninput = function() {
        // Disabled the create btn if not name
        if (this.value.length > 0) {
            btn_create.disabled = false;
        } else {btn_create.disabled = true;}
        
        // Limit the name to 20 characters
        if (this.value.length > 20) {
            this.value = this.value.substr(0,20);
        }

        // Convert forbidden characters in '-'
        let symbols = [" ", ".", ",", ":", ";", ">", "<", "*", "+", "[","]", "{","}","~"];
        for (let i=0; i < symbols.length; i++) {
            this.value = this.value.replace(symbols[i], "-");
        }

        // Convert to lowercase
        this.value = this.value.toLowerCase();
    };

    // Add Users List
    add_user.onkeyup = function() {
        const u_find = document.getElementById('finders');
        let name = this.value;
        let lst_added = Array.from(document.getElementById('add_u_names').children).map(x => x.innerHTML);
        let lst = user.users.filter( u => (u.toLowerCase().includes(name.toLowerCase()) && !lst_added.includes(u)));
        
        // Clean the list
        if (name.length < 1) {
            u_find.innerHTML = "";
        } else {
            u_find.innerHTML = "";
            lst.forEach( u => {
                // Add the users into dorpdown list
                const el = document.createElement('li');

                el.innerHTML = u;
                u_find.append(el);
            });
        }

        // Add the click Event to the list of name to add
        Array.from(u_find.children).forEach( (e) => {            
            e.onclick = () => {
                console.log(e.innerHTML);
                let u_div = document.getElementById('add_u_names');
                let u = document.createElement('span');
                u.innerHTML = e.innerHTML;
                // Add the event to remove
                u.onclick = (s) => {
                    s.target.parentNode.removeChild(u);
                };

                u_div.append(u);
                // Remove the list and reset the input user entry
                u_find.innerHTML = "";
                this.value = "";
            }
        });

    }

    // Set click events for btn-close and btn-create
    btn_close.addEventListener('click', close_newch_form, false);
    btn_create.addEventListener('click', create_newch, false);
    
    // Add the Event to close
    function close_newch_form() {
        elem.parentElement.removeChild(elem);
        saveData('active_ch', false);
    };

    // Add the Event to Create Channel
    function create_newch() {
        
        let status = (document.querySelector('input[name=ch_st]').checked) ? 'public': 'private';
        let name = document.querySelector('input[name=ch_name]').value;
        let propose = document.querySelector('textarea[name=ch_propose]').value;
        let u_added = Array.from(document.getElementById('add_u_names').children).map(x => x.innerHTML);
        let u = getData('user');
        
        console.log(u.username + ' want to create channel ' + name + ' (' + status + ')');
        
        if (status === 'public')  u_added = [];
        // Emit the socket Event
        socket_event('new channel', {'username': u.username, 
                                    'channel': [name, status, propose],
                                    'users': u_added});
        // Close the Create Channel Form
        close_newch_form();
    };
}

function load_message(elem, message) {
    // Add the new message to the chat
    const chat = findElementByClass(elem, 'ch-msg');
    let data = createDataMessage(message);
    const msg_template = Handlebars.compile(document.querySelector('#temp-msg').innerHTML);
    
    // Render the template
    chat.innerHTML += msg_template(data);
}

function load_message_events() {
    // Add event to download files
    let btn_dw_file = document.getElementsByName('user_file');
    for (let btn of btn_dw_file){
        let file_info = {'src': btn.dataset.src,
                        'type': btn.dataset.type};
        btn.addEventListener('click', download_file.bind(null, file_info), false);
    }
    
    // Add event to delete messages
    let btn_del_msg = document.querySelectorAll('.msg-own.del-msg');
    
    for (let btn of btn_del_msg){
        let id_msg = btn.dataset.id;
        btn.addEventListener('click', socket_event.bind(null, 'delete msg', findMsgById(id_msg)), false);
    }
}

// Load channel header
function load_channel_header(channel){
    const temp_header = Handlebars.compile(document.querySelector('#temp-ch-header').innerHTML);
    const header = document.getElementsByClassName('ch-menu')[0];
    let status = (channel.status === 'private')?true:false;

    header.innerHTML += temp_header({'channel': channel, 'private': status});

    // Add the event click to show the header
    const btn_hide = document.getElementsByClassName('ch-header-hide')[0];
    const ch_header = document.getElementsByClassName('ch-header')[0];

    btn_hide.addEventListener('click', function() {
        // Show the header
        ch_header.classList.toggle('expanded');
        // Rotate the btn_hide
        this.classList.toggle('rotate');
    }, false);

    try{
        const btn_plus = findElementByClass(ch_header, 'ch-header-plus');
        btn_plus.onclick = function(e) {
            if (!findElementByClass(ch_header, 'box-invite-users')) {
                let user = getData('user');
                let lst = user.users.filter( u => (!channel.users.includes(u)));
                let box_elem = createBoxList(lst);
                // Set the class for box and the position
                box_elem.setAttribute('class', 'box-invite-users')
                box_elem.style.left = e.layerX +'px';
                box_elem.style.top = e.layerY +'px';
                // Add the box to header
                ch_header.appendChild(box_elem);

                //Add the click event to list items
                let li_users = findElementsByTag(findElementByClass(ch_header, 'box-invite-users').children[0], 'li');

                li_users.forEach((e) => {
                    e.addEventListener('click', function(){
                        socket_event('invite users', {'user': user.username, 
                                                    'channel': channel.name, 
                                                    'users': [this.dataset.user]});
                        }
                    ,false);
                });
            }
        };
    } catch(error) {
        //console.error(error);
    }

    function createBoxList(arr) {
        let box = document.createElement('div');
        let list_items = document.createElement('ul');
        for (let i=0; i < arr.length; i++) {
            let item = document.createElement('li');
            item.setAttribute('data-user', arr[i]);
            item.innerHTML = arr[i];
            list_items.append(item);
        }
        box.appendChild(list_items);
        box.style.position = 'absolute';

        return box;
    }

}

function load_channel(channel) {
    const channel_template = Handlebars.compile(document.getElementById('temp-channel').innerHTML);
    const page = document.querySelector('.grid-main');
    
    // Render the channel_template
    page.innerHTML = channel_template({'channel': channel});
    console.log("Channel Loaded.");
    // Reset the counter non-read message
    setCounterElements(channel.name, channel.id, true);
    // Load the channel header
    load_channel_header(channel);
    // Load the message in channel
    const channel_elem = document.getElementById('channel')

    // Load the messages
    let i;
    for (i=0; i < channel.messages.length; i++){
        load_message(channel_elem, channel.messages[i]);
    }

    // Add Messages Events
    load_message_events();

    console.log("Messages Loaded.");

    return channel_elem;
}

function load_channel_elements() {
    var active_ch = getData('active_ch');
    var channel = getChannelById(active_ch);
    
    // Check that channel exists
    if (channel === -1){
        console.log("Error during loading channel.")
        return
    }

    const ch_elem = load_channel(channel);
    console.log("Loading elements of channel " + active_ch);
    // Main elments
    const menu = ch_elem.children[0];
    const ch_msg = ch_elem.children[1];
    const new_msg = ch_elem.children[2];

    // Message write and draw related elements
    const msg_content = findElementByClass(new_msg, 'msg-content');
    
    // Emojis related elements
    const emo_tb = findElementByClass(new_msg, 'emojis');
    const btn_emoji = findElementByClass(new_msg, 'btn-emoji');
    const emojis = generate_emojis();
    
    // Attachment files related elements
    const attach_tb = findElementByClass(new_msg, 'file-attach');
    const btn_attach = findElementByClass(new_msg, 'btn-attach');
    const attachment = generate_attachment();
    const inputs_attach = findElementsByTag(attach_tb, 'input');
    
    // Scrolldonw the chat
    scrolldown(ch_msg);


    // Close and Send Message Buttons
    let btn_close = findElementByClass(menu, 'btn-close');
    let btn_send_msg = findElementByClass(new_msg, 'btn-send-msg');
    
    // Add events to close the channel and send messages
    btn_close.addEventListener('click', close_ch, false);
    btn_send_msg.addEventListener('click', send_ch_msg, false);
    
    // Function to close channel
    function close_ch() {
        console.log("Closing channel " + active_ch);
        ch_elem.parentElement.removeChild(ch_elem);
        saveData('active_ch', false);
    };

    // Function to send message
    function send_ch_msg(e) {
        e.stopPropagation();

        let user = getData('user');
        let date_time = getDateTime();
        let msg_id = genMsgId(date_time);
        
        if (check_content(msg_content)){
            console.log("Sending Message from channel " + active_ch);
            socket_event("new message", {'channel': active_ch, 'user': user, 'content': msg_content.value, 
                        'date': date_time, 'id': msg_id, 'state': true, 'type': 'text'});
            // Reset the textarea
            msg_content.value = "";
        }
        
        for (let i=0; i < inputs_attach.length; i++){

            if (inputs_attach[i].files[0]){
                console.log("Upload file: " + inputs_attach[i].files[0].name);
                upload_file(inputs_attach[i], active_ch, user, date_time, msg_id);
                // Close preview
                let preview = findElementByClass(ch_elem, 'file-preview');
                let btn_close = findElementByClass(preview, 'btn-close')
                btn_close.click();
            }
        }

        // Close the emoji and attachment menues
        emojis.style.display = 'none';
        attachment.style.display = 'none';
    };

    // Add the event to leave the channel
    try{
        const btn_ch_leave = document.getElementById('ch-btn-leave');
        btn_ch_leave.onclick = function() {
            let user = getData('user');
            socket_event("remove channel",{'user': user.username, 'channel': channel})
            btn_close.click();
        };
    } catch(error) {
        //console.error(error);
    }

    // Load the emojis table
    load_emojis(emo_tb, btn_emoji, emojis, msg_content, 'flex', 'menu-tb emoji_tb');
    // Load the attachment files table
    load_attachment(attach_tb, btn_attach, attachment, 'flex', 'menu-tb attach_tb');
    // Add the event to preview when select a file
    inputs_attach.forEach((e) => {e.addEventListener('change', preview_file.bind(null, ch_elem), false)});

}