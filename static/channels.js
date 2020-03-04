'use strict'

// Socket Event Emit
function socket_event(e_name, data) {
    let socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    
    // Emit the 'e_name' socket Event
    socket.emit(e_name, data);
}

// Close channel by ID
function close_channel(ch_id) {
    if(ch_id) {
        let elem = document.getElementById(ch_id);
        let btn_close = findElementByClass(elem, 'btn-close');
        btn_close.click();
    }
}

// Open channel by ID and load the events
function open_channel(ch_id){
    
    // Check that the channel is hide
    var channel = document.getElementById(ch_id);
    var active_ch = getData('active_ch');
    
    if (!active_ch || (active_ch !== channel.id)) {
        // Close the Active Channel.
        close_channel(active_ch);
        
        // Set activate_ch = ch_id.
        // and show the channel.
        saveData('active_ch', channel.id);
        channel.style.display = "block";
        
        // Load the elements of channel
        var load_elem = (channel.id === 'new-ch')?load_create_elements: load_channel_elements;
        load_elem(channel);
    };

}

// Close the menu
function close_menu(target, e_click, e_target) {
    let type_display = ['none', ''];
    let match = (target === e_click) || (target === e_target);

    if (!match && !type_display.includes(e_target.style.display)) {
        e_click.click();
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
    let attach = ['\u{1f5bc}', '\u{1f5ba}', '\u{1f5b9}'];
    let attach_type = ['image', 'pdf', 'other'];
    const elem = document.createElement("div");

    for (let i=0; i<attach.length; i++){
        let el = document.createElement("span");
        el.setAttribute('class', 'menu-item');
        el.dataset.type = attach_type[i];
        el.innerHTML = attach[i];
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

function generate_toolbar_draw(){
    const elem = document.getElementById('draw-tools');
    let btn_erase = document.createElement('button');
    let btn_size = document.createElement('select');

    btn_erase.setAttribute('id', 'erase-draw');
    btn_erase.innerHTML = String.fromCodePoint(0x1f512);

    for (let i=1; i <= 10; i++) {
        let size = document.createElement('option');
        if (i === 3) {
            size.setAttribute('selected', true);
        }
        size.setAttribute('value', i);
        size.innerHTML = i;

        btn_size.append(size);
    }

    elem.append(btn_size);
    elem.append(btn_erase);

    return elem;
}

// Drawing function in SVG
function svg_drawing() {
    const svg = d3.select('.canvas');
    let drawing = false;

        function draw_point() {
            if (!drawing)
                return;

            const coords = d3.mouse(this);

            svg.append('circle')
               .attr('cx', coords[0])
               .attr('cy', coords[1])
               .attr('r', 5)
               .style('fill', 'black');
        };

        svg.on('mousedown', () => {
            drawing = true;
        });

        svg.on('mouseup', () => {
            drawing = false;
        });

        svg.on('mousemove', draw_point);
}

function preview_file(elem, ev) {
    console.log(ev.target.files[0]);
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

function upload_file(input, ch_id, user, date){

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
                        'date': date, 'state': true, 'type': type});
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

function load_create_elements(elem) {
    console.log("Loading elements of create channel.");
    // Define Buttons
    const btn_create = findElementByClass(elem, 'btn-create-ch');
    const btn_close = findElementByClass(elem, 'btn-close');
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
        console.log(lst);

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
        console.log("Closing create form.");
        // Switch to Public
        if (!check_st.checked) check_st.click();

        elem.style.display = 'none';
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

function load_channel_elements(ch_elem) {
    console.log("Loading elements of channel " + ch_elem.id);
    // Main elments
    const menu = ch_elem.children[0];
    const ch_msg = ch_elem.children[1];
    const new_msg = ch_elem.children[2];

    // Message write and draw related elements
    const msg_content = findElementByClass(new_msg, 'msg-content');
    const svg_draw = findElementByClass(new_msg, 'canvas');
    
    // Emojis related elements
    const emo_tb = findElementByClass(new_msg, 'emojis');
    const btn_emoji = findElementByClass(new_msg, 'btn-emoji');
    const emojis = generate_emojis();
    
    // Attachment files related elements
    const attach_tb = findElementByClass(new_msg, 'file-attach');
    const btn_attach = findElementByClass(new_msg, 'btn-attach');
    const attachment = generate_attachment();
    const inputs_attach = findElementsByTag(attach_tb, 'input');

    // Close and Send Message Buttons
    let btn_close = findElementByClass(menu, 'btn-close');
    let btn_send_msg = findElementByClass(new_msg, 'btn-send-msg');
    
    // Add events to close the channel and send messages
    btn_close.addEventListener('click', close_ch, false);
    btn_send_msg.addEventListener('click', send_ch_msg, false);
    
    // Function to close channel
    function close_ch() {
        console.log("Closing channel " + ch_elem.id);
        ch_elem.style.display = 'none';
        saveData('active_ch', false);
    };
    
    // Function to send message
    function send_ch_msg(e) {
        e.preventDefault();
        e.stopPropagation();

        let user = getData('user');
        let date_time = getDateTime();

        
        if (check_content(msg_content)){
            console.log("Sending Message from channel " + ch_elem.id);
            socket_event("new message", {'channel': ch_elem.id, 'user': user, 'content': msg_content.value, 
                        'date': date_time, 'state': true, 'type': 'text'});
            // Reset the textarea
            msg_content.value = "";
        }
        
        for (let i=0; i < inputs_attach.length; i++){

            if (inputs_attach[i].files[0]){
                console.log("Upload file: " + inputs_attach[i].files[0].name);
                upload_file(inputs_attach[i], ch_elem.id, user, date_time);

                // Close preview
                let preview = findElementByClass(ch_elem, 'file-preview');
                let btn_close = findElementByClass(preview, 'btn-close')
                btn_close.click();

            }
        }

    };

    // Close menues when click outside
    window.onclick = function(event) {
        // Close the emoji menu when click outside
        close_menu(event.target, btn_emoji, emojis);
        // Close the draw menu when click outside
        close_menu(event.target, btn_draw, svg_draw);
        // Close the attachment files menu when click outside
        close_menu(event.target, btn_attach, attachment);
    }

    // Load the emojis table
    load_emojis(emo_tb, btn_emoji, emojis, msg_content, 'flex', 'menu-tb emoji_tb');
    // Load the attachment files table
    load_attachment(attach_tb, btn_attach, attachment, 'flex', 'menu-tb attach_tb');
    // Add the event to preview when select a file
    inputs_attach.forEach((e) => {e.addEventListener('change', preview_file.bind(null, ch_elem), false)});

    

    // Add Events to drawing
    const btn_draw = findElementByClass(new_msg, 'btn-draw');

    btn_draw.onclick = function() {
        if ((svg_draw.style.display === "") || (svg_draw.style.display === "none")) {
            svg_draw.style.display = "block";
            msg_content.style.display = "none";
            msg_content.value = "";
        } else {
            svg_draw.style.display = "none";
            msg_content.style.display = "block";
            svg_draw.innerHTML = "";
        }
    };

    svg_drawing();

}