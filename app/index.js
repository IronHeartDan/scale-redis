const express = require("express");
const app = express();
const server = require("http").createServer(app);
const port = process.env.PORT || 3000;
const redis = require("redis");
const client = redis.createClient(6379, "192.168.137.204");

// Scaling With Sockets
const io = require("socket.io")(server);
const redisAdapter = require("socket.io-redis");
io.adapter(redisAdapter({ host: "192.168.137.204", port: 6379 }));

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.status(200).sendFile("public/index.html");
});

io.on("connection", async (socket) => {
  let username = socket.handshake.query.username;
  client.set(username, socket.id);
  client.get("count", (err, data) => {
    if (data == null) {
      client.set("count", 1);
      io.emit("count", 1);
    } else {
      data++;
      client.set("count", data);
      // console.log(`Total Clients : ${data}`);
      io.emit("count", data);
    }
  });

  console.log(socket.id + " Is Connected!");

  // socket.emit("id", process.env.ID);

  socket.on("msg", (msg) => {
    socket.broadcast.emit("msg", msg);
  });

  socket.on("privateMsg", (msgdata) => {
    client.get(msgdata.whome, (err, data) => {
      if (data) {
        socket.to(data).emit("msg", msgdata.msg);
      } else {
        socket.emit("err");
      }
    });
  });

  socket.on("disconnect", () => {
    let username = socket.handshake.query.username;
    client.del(username);
    client.get("count", (err, data) => {
      data--;
      client.set("count", data);
      // console.log(`Total Clients : ${data}`);
      io.emit("count", data);
    });

    // count--;
    // io.emit("count", count);
    // console.log(socket.id + " Is Disconnected");
  });
});

server.listen(port, () => {
  console.log("Listening On Port " + port);
});
