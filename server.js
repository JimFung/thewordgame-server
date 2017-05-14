const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const wordGenerator = require('./wordGenerator')

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

let rooms = new Map()

io.on('connection', socket => {
  console.log(`client connected...\nsocket id:${socket.id}`)

  //Singleplayer logic

  //Start a single player game.
  socket.on('start_single', () => socket.emit('first_word', wordGenerator()))

  //Check that the player typed the right word in
  socket.on('check_word', data => {
    console.log(data)
    if(data.answer === data.currWord) {
      socket.emit('new_word', {newWord: wordGenerator(), reduction: data.currWord.length/2})
      socket.emit('update_score', 1)
    } else {
      socket.emit('increase_timer')
    }
  })

  //Multiplayer logic

  //join a room (creates one if it doesn't already exists)
  socket.on('join', name => {
    socket.join(name)

    let room = rooms.get(name)
    if(room.isFull) {
      console.log('Both players have joined!')
      io.to(room.player1).emit('oid', room.player2)
      io.to(room.player2).emit('oid', room.player1)
      io.sockets.in(name).emit('both_players_ready')
      setTimeout(() => io.sockets.in(name).emit('first_word', wordGenerator()), 2000)
    }
  })

  //Find a room, or generate a new room name if none are available.
  socket.on('start_multiplayer', () => {
    console.log(`Starting multiplayer session for ${socket.id}`)
    //if there is space in a room that already exists, join that room. ELSE, create a new room, join it, wait for another player.
    let entries = [...rooms.entries()]

    let hasRoom = entries.findIndex(room => typeof room[1].player2 !== "string")
    if(hasRoom !== -1) {
      //findIndex returned a positive number so there is an available room.
      entries[hasRoom][1].player2 = socket.id
      console.log(`Room ${entries[hasRoom][1].name} is waiting for another player!`)
      rooms.set(entries[hasRoom][1].name, Object.assign({}, entries[hasRoom][1], {isFull: true}))
      socket.emit('join_room', entries[hasRoom][1].name)
    } else {
      //No empty room found, create a new one.
      const name = wordGenerator() + socket.id
      let newRoom = {
        name,
        player1: socket.id,
        player2: null,
        isFull: false
      }
      rooms.set(name, newRoom)
      socket.emit('join_room', name)
    }
  })

  socket.on('trigger_update_opponent_timer', data => io.to(data.to).emit('update_opponent_timer', data.newTime))

  socket.on('disconnect', (data) => {
    console.log('someone disconnected')
    console.log(typeof data)
  })
})

server.listen(8000)