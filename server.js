const path = require("path");
const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const botName = "ChatBot";
//set static folder
app.use(express.static(path.join(__dirname, "public")));

//Runn when client connects
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);
    //Welcome message
    socket.emit("message", formatMessage(botName, "Welcome to the chat app"));

    //Run when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has connected`)
      );

    io.to(user.room).emit("roomUsers",{
      room:user.room,
      users:getRoomUsers(user.room)
    });
  });

  //Run when a user sends a message
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  //Run when a user disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if(user){
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left`)
      );
    }
    io.to(user.room).emit("roomUsers",{
      room:user.room,
      users:getRoomUsers(user.room)
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
