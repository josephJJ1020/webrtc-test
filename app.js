const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = http.createServer(app);
const server = new Server(httpServer);

app.use(express.static("static"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/static/index.html");
});

server.on("connection", (client) => {
  // console.log(`${client.id} connected!`)

  client.on("offer", (data) => {
    // console.log("offer recieved");
    server.to(data.receiver).emit("offer", data);
  });

  client.on("answer", (data) => {
    // console.log("answer received");
    server.to(data.receiver).emit("answer", data);
  });

  client.on("add-ice-candidate", (data) => {
    // console.log("ice candidate received");
    server.to(data.receiver).emit("add-ice-candidate", data);
  });
});

httpServer.listen(process.env.PORT || 3000, console.log("listening"));
