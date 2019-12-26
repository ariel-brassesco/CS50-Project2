localStorage.clear();
var login_user = false;

if (localStorage.getItem('username')) {
    login_user = true;
}
function login() {

    // Initialize new request
    const request = new XMLHttpRequest();
    const username = document.querySelector('#username').value;
    request.open('POST', '/new_user');

    // Callback function for when request completes
    request.onload = () => {

        // Extract JSON data from request
        const data = JSON.parse(request.responseText);

        // Update the result div
        if (data.success) {
            localStorage.setItem('username', data.username);
            document.querySelector('#signit').remove();
            login_user = true;
        }
        else {
            localStorage.setItem('error_msg', 'The user already exist. Please try another');
            login_user = false;
        }
    }

    // Add data to send with request
    const data = new FormData();
    data.append('username', username);

    // Send request
    request.send(data);
}

document.addEventListener('DOMContentLoaded', () => {
    
    if (!login_user) {
        document.querySelector('#signit').onsubmit = () => {
            login();
            
            if (localStorage.getItem('error_msg')) {
                document.querySelector('#info').innerHTML = localStorage.getItem('error_msg');
            }
            return false;
        }
    } else {
        document.querySelector('#info').innerHTML = localStorage.getItem('username');       
    }
    
    //if (localStorage.getItem('username')) {
    //    document.querySelector('#info').innerHTML = localStorage.getItem('username');
    //}

    // Connect to websocket
    //var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    // When connected, configure buttons
    //socket.on('connect', () => {

        // Each button should emit a "submit vote" event
    //    document.querySelector('#singit').onclick = () => {
    //        const username = document.querySelector('#username').value;
    //        socket.emit('submit vote', {'selection': selection});
    //    };
    //});

    // When a new vote is announced, add to the unordered list
    //socket.on('announce user', data => {
    //   document.querySelector('#info').innerHTML = data.users;
      //  document.querySelector('#no').innerHTML = data.no;
      //  document.querySelector('#maybe').innerHTML = data.maybe;
    //});
});
