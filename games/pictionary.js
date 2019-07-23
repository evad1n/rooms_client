//PICTIONARY
const PICTIONARY_INTERVAL = 500

var pictionary = new Vue({
    data: {
        colors: [
            "red", "orange", "yellow", "green", "blue", "purple", "black", "white"
        ],
        marker_color: "black",
        canvas: null,
        context: null,
        isDrawing: false,
        startPos: {},
        endPos: {},
        timer: null,
        seconds: 0,
        lines: [],
    },
    methods: {
        beginDrawing: function () {
            this.canvas = app.$refs.canvas[0];
            this.context = this.canvas.getContext("2d");
            this.canvas.addEventListener('mousedown', this.mousedown);
            this.canvas.addEventListener('mousemove', this.mousemove);
            document.addEventListener('mouseup', this.mouseup);

            app.roomData.drawing = true

            //Start timer
            this.timer = setInterval(() => {
                pictionary.seconds += 0.5

                pictionary.updateDrawing()

                // END TURN
                if (pictionary.seconds > 30) {
                    pictionary.endDrawing()
                    pictionary.seconds = 0
                }
            }, PICTIONARY_INTERVAL);
            this.sendGameInfo()
        },
        endDrawing: function () {
            app.roomData.drawing = false
            this.canvas.removeEventListener('mousedown', this.mousedown);
            this.canvas.removeEventListener('mousemove', this.mousemove);
            document.removeEventListener('mouseup', this.mouseup);
            clearInterval(this.timer)
        },
        mousedown: function (e) {
            if (app.roomData.turn.user == app.username) {
                var rect = this.canvas.getBoundingClientRect();
                var x = e.clientX - rect.left;
                var y = e.clientY - rect.top;

                this.isDrawing = true;
                this.startPos = { x: x, y: y }
            }
        },
        mousemove: function (e) {
            if (app.roomData.turn.user == app.username) {
                var rect = this.canvas.getBoundingClientRect();
                var x = e.clientX - rect.left;
                var y = e.clientY - rect.top;

                if (this.isDrawing) {
                    this.context.beginPath();
                    this.context.moveTo(this.startPos.x, this.startPos.y);
                    this.context.lineTo(x, y);
                    this.context.lineWidth = 5;
                    this.context.lineCap = 'round';
                    this.context.strokeStyle = this.marker_color;
                    this.context.stroke();

                    this.startPos = { x: x, y: y }
                }
            }
        },
        mouseup: function (e) {
            if (app.roomData.turn.user == app.username) {
                this.isDrawing = false;
            }
        },
        readyUp: function () {
            // Say that you are ready
            fetch(`${url}/${app.page}/game/ready`, {
                method: "POST",
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({
                    user: app.username
                })
            })
        },
        start: function () {
            //Start game
            fetch(`${url}/${app.page}/game/start`, {
                method: "POST",
                headers: {
                    "Content-type": "application/json"
                },
            })
        },
        reset: function () {
            app.roomData.canvas = null
            app.roomData.winner = "none"
            app.roomData.started = false

            // Set starting user for next game
            app.roomData.first++
            app.roomData.first %= app.roomData.players.length
            app.roomData.turn.user = app.roomData.players[app.roomData.first].name
            app.roomData.turn.turn = app.roomData.first

            this.sendGameInfo()
        },
        sendGameInfo: function () {
            //app.roomData.lines = pictionary.lines

            fetch(`${url}/${app.page}/game`, {
                method: "POST",
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({
                    data: app.roomData
                })
            })
        },
        updateDrawing: function () {
            // check if someone is drawing
            if (app.roomData.drawing) {

                // If this user is drawing
                if (app.roomData.turn.user == app.username) {
                    if (true) {
                        var endPos = { x: pictionary.startPos.x, y: pictionary.startPos.y }
                        // send line to to the server
                        app.roomData.lines.push({ start: pictionary.startPos, end: endPos, color: pictionary.marker_color })
                        // send data
                        pictionary.sendGameInfo()
                    }
                }
                else {
                    var diff = app.roomData.lines.length - pictionary.lines.length
                    // if there are new lines
                    if (diff > 0) {
                        // add to drawing
                        for (let i = 0; i < diff; i++) {
                            var line = app.roomData.lines[pictionary.lines.length + i]
                            pictionary.lines.push(line)

                            // draw line 
                            this.context.beginPath();
                            this.context.moveTo(line.start.x, line.start.y);
                            this.context.lineTo(line.end.x, line.end.y);
                            this.context.lineWidth = 5;
                            this.context.lineCap = 'round';
                            this.context.strokeStyle = line.color;
                            this.context.stroke();
                        }
                    }
                }
            }
        }
    },
})