'use strict';

// Check username
function check_username() {
    const btn_submit = document.querySelector('button[type="submit"]');
    let i_name = document.getElementById('username');

    btn_submit.disabled = true;
    i_name.oninput = function() {
        // Disabled the submit btn if not name
        if (this.value.length > 0) {
            btn_submit.disabled = false;
        } else {btn_submit.disabled = true;}

        // Limit the name to 20 characters
        if (this.value.length > 20) {
            this.value = this.value.substr(0,20);
        }

        // Convert whitespaces in '-'
        this.value = this.value.replace(" ", "-");
    };
}

// Choose avatar picture
function choose_avatar(){
    const avatar = document.getElementById("selected");
    const chooses = document.getElementById("avatar");
    let avatares = Array.from(chooses.children);


    window.onclick = function(event) {
        close_menu(event.target, avatar, chooses);
    }

    avatar.onclick = () => {
        console.log('click');
        if (!chooses.style.display || chooses.style.display === 'none') {
            chooses.style.display = "flex";
        } else {
            chooses.style.display = "none";
        }
    };

    avatares.forEach((a) => {
        a.addEventListener('click', pick, false);
    })

    function pick(event) {
        // Reemplace the avatar img
        avatar.src = event.target.src;
        //avatar.click();
    }
}

// Select a random avatar picture
function random_avatar(number){
    return Math.floor(Math.random()*number)+1
}

function login() {
    // Initialize new request
    const input = document.getElementById('username');
    const avatar = document.getElementById('selected');
    //const name_input = input.value;
    const request = new XMLHttpRequest();
    
    request.open('POST', '/new_user');

    // Callback function for when request completes
    request.onload = () => {

        // Extract JSON data from request
        const data = JSON.parse(request.responseText);
    
        // Update the result div
        if (data.success) {
            // Save the user data in localStore
            saveData('login', data.success);
            saveData('user', data.user);
            saveData('public_channels', data.public_channels);
            saveData('private_channels', data.private_channels);
            saveData('active_ch', false);

            return location.reload();
        
        } else {
            cleanData();
            input.value = "";
            alert(data.msg)
        }
    }
        
    // Add data to send with request
    const data = new FormData();
    data.append('username', input.value);
    data.append('avatar', avatar.src.replace(avatar.baseURI, "../"));
    // Send request
    request.send(data);

    return false;
}

function logout() {
    // Initialize new request
    const request = new XMLHttpRequest()
    var u = getData('user');
    
    request.open('POST', '/logout');

    // Callback function for when request completes
    request.onload = () => {
        // Extract JSON data from request
        const data = JSON.parse(request.responseText);
        // print the message in the console.log
        console.log(data.msg);

        // Emit the "logout user" and reload the page
        socket_event("logout user", {'username': u.username});
        
        return false;
    }

    // Add data to send with request
    const data = new FormData();
    data.append('username', u.username);
    // Send request
    request.send(data);
    
    return false;
}
