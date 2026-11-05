const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static('public'));
let waitingUser = null;
io.on('connection', (socket) => {
  socket.on('find-partner', () => {
    if (waitingUser && waitingUser !== socket) {
      let partner = waitingUser;
      waitingUser = null;
      socket.partner = partner;
      partner.partner = socket;
      socket.emit('partner-found', { initiator: true });
      partner.emit('partner-found', { initiator: false });
    } else {
      waitingUser = socket;
      socket.emit('waiting');
    }
  });
  socket.on('signal', (data) => {
    if (socket.partner) socket.partner.emit('signal', data);
  });
  socket.on('chat', (msg) => {
    if (socket.partner) socket.partner.emit('chat', msg);
  });
  socket.on('next', () => {
    if (socket.partner) {
      socket.partner.emit('partner-left');
      socket.partner.partner = null;
      socket.partner = null;
    }
  });
  socket.on('disconnect', () => {
    if (waitingUser === socket) waitingUser = null;
    if (socket.partner) {
      socket.partner.emit('partner-left');
      socket.partner.partner = null;
    }
  });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("YUYUNG RUNNING sa port" + PORT));