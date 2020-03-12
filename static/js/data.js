'use strict';
// Functions to manage the localStorage
function getData(key) {
    if (!localStorage.getItem(key)) return false;
    return JSON.parse(localStorage.getItem(key));
}

function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    }
    catch(error){
        console.log('An error was ocurred');
        return false;
    }
}

function cleanData() {
    localStorage.clear();
}


// Functions to manage the data in localStorage

function add_user(username) {    
    let user = getData('user');
    user.users.push(username);
    saveData('user', user);
}

function remove_user(username) {
    let user = getData('user');
    let idx = user.users.indexOf(username);

    if (idx >= 0) {
        user.users.splice(idx, 1);
        saveData('user', user);
    }
}

function add_channel(ch_data) {
    let ch = [ch_data.name, ch_data.status, ch_data.id, ch_data.propose];
    let user = getData('user');

    // Save the channel in the user information
    user.channels.push(ch);
    saveData('user', user);

    // Save the Channel Information
    if (ch_data.status === 'public'){
        let data = getData('public_channels');
        data.push(ch_data);
        saveData('public_channels', data);
    } else {
        let data = getData('private_channels');
        data.push(ch_data);
        saveData('private_channels', data);
    }
}

function add_message(ch_data){
    
    // Save the Channel Information
    if (ch_data.status === 'public'){
        let data = getData('public_channels');
        
        data.forEach(function (ch, idx, arr) {
            if (ch.id === ch_data.id) {
                arr[idx] = ch_data;
            }
        });

        saveData('public_channels', data);
    } else {
        let data = getData('private_channels');
        
        data.forEach(function (ch, idx, arr) {
            if (ch.id === ch_data.id) {
                arr[idx] = ch_data;
            }
        });
        
        saveData('private_channels', data);
    }
}

function del_message(msg_id, channel){
    let key = (channel.status === 'public')?'public_channels':'private_channels';
    let channels = getData(key);

    for (let i=0; i < channels.length; i++){
        if (channels[i].id === channel.id){
            for (let j=0; j < channels[i].messages.length; j++){
                if (channels[i].messages[j].id === msg_id) {
                    channels[i].messages[j].state = false;
                    saveData(key, channels);
                    return;
                }
            }
        }
    }
}

function remove_ch(id) {
    let user = getData('user')
    let channels = getData('private_channels');

    for (let i=0; i < user.channels.length; i++) {
        if (user.channels[i][2] === id) {
            user.channels.splice(i, 1);
            break;
        }
    }

    for (let i=0; i < channels.length; i++) {
        if (channels[i].id === id) {
            channels.splice(i, 1);
            break;
        }
    }
        
    saveData('user', user);
    saveData('private_channels', channels);

}

function update_users_from_ch(id, users) {
    let channels = getData('private_channels');

    for (let i=0; i < channels.length; i++) {
        if (channels[i].id === id) {
            channels[i].users = users;
            break;
        }
    }
    saveData('private_channels', channels)
}

function add_notification(noti) {
    let user = getData('user');
    user.notifications.push(noti);
    saveData('user', user);
}

function getChannelById(id) {
    var public_channels = getData('public_channels');
    var private_channels = getData('private_channels');
    let i;
    
    for (i=0; i < public_channels.length; i++) {
        if (public_channels[i].id === id) {
            return public_channels[i];
        }
    }
    for (i=0; i < private_channels.length; i++) {
        if (private_channels[i].id === id) {
            return private_channels[i];
        }
    }
    return -1;
}

function findChannelById(id) {
    var channels = getData('user').channels;
    let i;
    
    for (i=0; i < channels.length; i++) {
        if (channels[i][0] === id) {
            return channels[i][2];
        }
    }
    return -1;
}

function getSizeChat(id=false) {
    
    let ch_id = (!id)? getData('active_ch'):id;
    var channel = getChannelById(ch_id);

    return channel.messages.length;
}


// Functions to find Elements in the DOM
function findElementByClass(e, cls) {
    if (!e) return null;
    
    var nodes = e.children;
    var find;
    var i;
    
    for (i=0; i < nodes.length; i++) {
        if (nodes[i].classList.contains(cls)) {
            return nodes[i];
        } else {
            find = findElementByClass(nodes[i], cls);
            if (find) {
                return find;
            }
        }
    }
    return null;
}

function findElementByName(e, name) {
    var nodes = e.children;
    var find;
    var i;

    for (i=0; i < nodes.length; i++) {
        if (nodes[i].name === name) {
            return nodes[i];
        } else {
            find = findElementByName(nodes[i], name);
            if (find) {
                return find;
            }
        }
    }
    return null;
}

function findElementsByName(e, name) {
    var nodes = e.children;
    var find;
    var elements = []
    var i;

    for (i=0; i < nodes.length; i++) {
        if (nodes[i].name === name) {
            elements.push(nodes[i]);
        } else {
            find = findElementsByName(nodes[i], name);
            if (find.length) {
                elements.push(...find);
            }
        }
    }
    return elements;
}

function findElementsByTag(e, tag) {
    // Return an Array with the elements of tag in e
    // Only find between childrens of e
    var nodes = e.children;
    var find = [];
    var i;

    for (i=0; i < nodes.length; i++) {
        if (nodes[i].tagName === tag.toUpperCase()) {
            find.push(nodes[i]);
        }
    }
    return find;
}

// Functions to get info about files

function getFileSize(file) {
    // Return the file size in bytes, KB or MB
    if (file.size <= 1024) {
        return file.size + "bytes";
    } else if (file.size <= 1048576) {
        return Math.round(file.size/1024) + "KB";
    } else {
        return Math.round(file.size/(1024*1024)) + "MB";
    }
}

function getFileInfo(file) {
    // Return the name and size of file
    return {'name': file.name,
            'size': getFileSize(file),
            'rsize': file.size,
            'type': file.type
            };
}

function checkFileType(file){
    // Return the type of file
    let images = ['jpeg', 'jpg', 'png', 'gif'];
    let pdf = 'pdf';
    let document = ['txt', 'doc', 'docx', 'xls', 'xlsx', 'plain' , 'msword',
                    'vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'vnd.oasis.opendocument.text', 'vnd.oasis.opendocument.spreadsheet'];
    let type = file.type.split('/')[1];

    if (type === pdf) {
        return 'pdf';
    } else if(images.includes(type)){
        return 'image'
    } else if (document.includes(type)){
        return 'other';
    } else {
        return false;
    }
    
}

function createFileLogo() {
    // Return the source address for logos
    return {'pdf': '../static/images/previews/PDF_logo.png',
            'other': '../static/images/previews/FILE_logo.png'};
}


// Functions to manage the message information
function createDataMessage(message) {
    // Return the Data from message to make the template
    const img_src = createFileLogo();
    let user = getData('user');

    return {'text': message.types === 'text',
            'image': message.types === 'image',
            'file': !(message.types === 'text' || message.types === 'image') ,
            'msg': message,
            'logo': img_src[message.types],
            'class': (message.username === user.username)?'msg-own':'msg-other',
            'date': getLocalTime(message.date)};
}

function getLocalTime(date){
    let time_zone = new Date().getTimezoneOffset();
    let min, hours;
    let dif_h = (time_zone >= 0)?Math.floor(time_zone/60):Math.ceil(time_zone/60);
    let dif_min = time_zone%60;
    
    if (time_zone >= 0) {
        if (date.minutes < dif_min){
            min = 60 + date.minutes - dif_min;
            hours = date.hours - dif_h - 1;
        } else {
            min = date.minutes - dif_min;
            hours = date.hours - dif_h
        }
    } else{
        if ((date.minutes - dif_min) >= 60){
            min = date.minutes - dif_min - 60;
            hours = date.hours - dif_h + 1;
        } else {
            min = date.minutes - dif_min;
            hours = date.hours - dif_h
        }
    }

    if (hours >= 24) {
        hours = hours - 24;
    }

    if (hours < 0) {
        hours = hours + 24;
    }

    return {'hours': (hours < 10)?"0" + hours:hours,
            'minutes': (min < 10)?"0" + min:min};
}

function getDateTime() {
    // Return the Date Time
    let time = new Date();
    return {year: time.getUTCFullYear(),
            month: time.getUTCMonth(),
            date: time.getUTCDate(),
            day: time.getUTCDay(),
            hours: time.getUTCHours(),
            minutes: time.getUTCMinutes(),
            seconds: time.getUTCSeconds(),
            miliseconds: time.getUTCMilliseconds()
            };
}

function genMsgId(date) {
    let date_val = Object.values(date);
    date_val.push(Math.floor(Math.random()*1000000));
    return Object.values(date).join('');
}

function findMsgById(id){
    let public_ch = getData('public_channels');
    let private_ch = getData('private_channels');

    for (let i=0; i < public_ch.length; i++) {
        for (let j=0; j < public_ch[i].messages.length; j++){
            if(public_ch[i].messages[j].id === id){
                return {'channel': public_ch[i].id,
                        'message': public_ch[i].messages[j]};
            }
        }
    }

    for (let i=0; i < private_ch.length; i++) {
        for (let j=0; j < private_ch[i].messages.length; j++){
            if(private_ch[i].messages[j].id === id){
                return {'channel': private_ch[i].id,
                        'message': private_ch[i].messages[j]};
            }
        }
    }

    return false;
}

// Functions to manage counter notifications and non-read message
function updateCounter(key) {
    let counter = getData('counter');
    if (!Object.keys(counter).includes(key)) {
        counter[key] = 0;
    }
    ++counter[key];
    saveData('counter', counter);
}

function resetCounter(key) {
    if (!getData('counter')) var counter = {};
    else var counter = getData('counter');

    counter[key] = 0;
    saveData('counter', counter);
}

function setCounterElements(id, key, reset=false){
    let elem = document.getElementById(id);

    if (!elem){
        return;
    }

    let counter_elem = findElementByClass(elem, 'counter');
    
    if (reset) {
        counter_elem.innerHTML = "";    
    } else {
        let counter = getData('counter');
        if (!counter[key]) counter_elem.innerHTML = "";
        else counter_elem.innerHTML = counter[key];
    }
}

function checkInvitationNoti(check, user, channel){
    let u = getData('user');
    let n = u.notifications;

    for (let i=0; i < n.length; i++) {
        if (n[i].type === 'invitation' && n[i].user === user && n[i].channel === channel) {
            n[i].check = check;
            break;
        }
    }

    u.notifications = n;
    saveData('user', u);
}