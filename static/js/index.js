'use strict';

// Object for avatar pictures
var avatar = {
    1: 'car1.png',
    2: 'dog1.png',
    3: 'ball1.png',
    4: 'cat1.png',
    5: 'plane1.png',
    6: 'helicopter1.png',
    7: 'forest1.png',
    8: 'waterfall1.png',
    9: 'waterfall2.png',
    10: 'mountain1.png',
    11: 'mountain2.png',
    12: 'castle1.png',
    13: 'castle2.png',
    14: 'castle3.png',
    15: 'house1.png',
    16: 'fruit1.png'
}

document.addEventListener('DOMContentLoaded', () => {
    // Connect to websocket
    const socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    const login_template = Handlebars.compile(document.querySelector('#temp-login').innerHTML);
    const profile_template = Handlebars.compile(document.querySelector('#temp-profile').innerHTML);
    const page = document.querySelector('.mainPage');

    if (getData('login')) {
        console.log('already login')
        
        // Get the user data from localStore
        let user_data = getData('user');
        //user.getUser(user_data);
        
        // Load the profile template
        page.innerHTML = profile_template({'user': user_data});
        
        // When socket is connect, anounce the user and load the services
        socket.on('connect', function() {
            // Emit the event "submit user" and reload the page
            socket_event("submit user", {'username': user_data.username});
            
            // Load the profile elements and Events related
            loadServices();
            loadSocketEvents();

        }, false);
        
    } else {
        console.log('showlogin')
        
        // Render the Login Page
        let len_avatar = Object.keys(avatar).length;
        let select_avatar = avatar[random_avatar(len_avatar)];

        document.body.innerHTML += login_template({'select': select_avatar, "avatar": avatar});
        
        // Load the presentation animation
        presentation();

        // Load the elements and their events
        check_username();
        choose_avatar();

        // Load the login button event
        const btn_login = document.querySelector('button[type="submit"]');
        
        btn_login.onclick = () => {
            login();
            return false;
        };
    };
});

