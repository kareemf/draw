
draw! is a web-based collaborative doodling app, built usng NodeJs, Express, Socket.io, Redis, jQuery, and HTML 5 canvas.

Overview:
When a user lands on the base URL, a "room" is created and the URL is updated to contain the room ID. This URL can now be sent to other users with whom you wish to doodle.

When a user lands on a URL containing a room ID, they join the room, and their canvas is updated to match the current state of the doodle.

All users in the room are assigned a randomly colored badge next to thier cursor. The movement of all users' cursors within the canvas are tracked and shared. **Note:** other users can only see your cursor within the bounds of the canvas and vise versa.

Press 'S' to save the doodle.
Press 'C' to clear the doodle. Affects all users

tl;dr: Everyone in the room will see what you draw and you see what they draw.

#Requirements:
nodeJS + npm
redis

#Optional:
Grunt

All other dependecies will be resolved via npm and subsequently bower

#Installation:
0. Install redis
1. Install node + npm
2. Once npm is installed, nagivate to the project root in the terminal and run 'npm install' to grab all project depdences
3. Run 'bower install' to grab all client-side libraries
4. Launch 'redis-server'
5. Run 'node server.js' or, if you are using grunt, simply 'grunt'
6. If all went well, you should be able to visit the app at 'http://localhost:3000'


#TODOs:

[ ] - after canvas is cleared, last line before clear command is restored when new stroke is drawn
[ ] - menu for color options
[x] - when clear command is sent, clear redis cache (no need to replay steps)
[x] - introduce concept of rooms. if user is not already in a room (no url hash), create a new room. if user is joining an existing room (roomId hash is present), send command history, business as usual
[x] - option to show other user's cursors - not optional
[x] - remove user from room on disconnect
[x] - user names
[x] - map user names to colors
[x] - save image
[x] - uniquely colored cursors/ cursor badges
[x] - hide badge when user is performing action
