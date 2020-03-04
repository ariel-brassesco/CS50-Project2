'use strict';

function getData(key) {
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
/*remove_ch(name) {
    let data = JSON.parse(localStorage.getItem('user'));
    let idx = -1;

    data.channels.forEach(function (element, i) {
        if (element[0] === name) {
            idx = i;
        }
    });

    if (idx >= 0) {
        data.channels.splice(idx, 1);
        localStorage.setItem('user', JSON.stringify(data));
    }

}*/

function add_notification(noti) {
    let user = getData('user');
    user.notifications.push(noti);
    saveData('user', user);
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

function findElementByClass(e, cls) {
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

function createDataMessage(message) {
    // Return the Data from message to make the template
    const img_src = createFileLogo();
    let user = getData('user');
    
    return {'text': message.types === 'text',
            'image': message.types === 'image',
            'file': !(message.types === 'text' || message.types === 'image') ,
            'msg': message,
            'logo': img_src[message.types],
            'class': (message.username === user.username)?'msg-own':'msg-other'};
}

function getDateTime() {
    // Return the Date Time
    let time = new Date();
    return {year: time.getUTCFullYear(),
            month: time.getUTCMonth(),
            date: time.getUTCDate(),
            day: time.getUTCDay(),
            hours: time.getUTCHours(),
            minutes: (time.getUTCMinutes() < 10)?"0"+time.getUTCMinutes():time.getUTCMinutes(),
            seconds: time.getUTCSeconds(),
            miliseconds: time.getUTCMilliseconds()
            //zone: time.getTimezoneOffset()
            };
}