# Project 2

This a chat for course Web Programming with Python and JavaScript.
[Link to the app](https://flack-cs50.herokuapp.com/)
## Description
In this web application you can login with an username and start chating.
There is a default public channel called 'general'. You can create public channels where every user can chat, or create private channel where only the invite users can chat and invite other users.

You can send images or files and emojis, you can change your avatar. There are notifications for invitations to private channels, for creations of new public channels and for accepted or rejected your invitations. Also there is a counter for non-read messages and notifications.
## Some features
* Still login when close the browser(required).
* When logout all the files upload and your private channels will be delete.
* If a private channel has no users will be delete.
* If you are inactive (no events generated) for more than 24 hours, your user will be logout by force when try to make some action.
* The users and channels information are saved by global variables in the server side.
* If you are inactive for more than 30 minutes will be and `update event` when reload the page.


## File Structure
This web application is developed with Flask and Socket and with one page html. The `application.py` file contains the main Flask app settings, routes and socket events for server side.

In template folder there is two html files, `index.html` which contains the Handlebars templates and the main structured, and the `test.html` used only for my own test propose.

The static folder contains:
* `classes.py`: Define the classes used in the project.
* `func.py`: Some functions to manage the data in server side.
* `images` folder: Contains the images used in the application and the folder to upload files by users.
* `css` folder: Contains the `css` files, the files names are very intuitive.
* `js` folder: Contains the `javascript` files which I describe later.

In `index.js` there is a simple logic to determine if your are already login or not. If your are not login, calls the functions in `login.js` to render the login page. If you are already login calls the functions in `utils.js` to render the profile page and load the events related and the user information.

The `presentation.js` file contains the functions for animation in the login page.

The `data.js` contains the functions to manage the `localStorage` and manage the `DOM Elements`.

The `socket_func.js` contains the functions called by the socket events.

The `channels.js` contains all the functions related with the channels features and to created a new channel.






