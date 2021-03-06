const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const wordGenerator = require('./wordGenerator')

/**
Create a hashmap to hold all the different multiplayer rooms. the key is the name of the room the value is the room object.
using a map instead of a regular object since its easier to delete things and get an iterable with a map instead of a regular js object
*/
let rooms = new Map()

io.on('connection', socket => {
  console.log(`client connected. socket id:${socket.id}`)

  //Singleplayer logic

  //Start a single player game.
  socket.on('start_single', () => socket.emit('first_word', wordGenerator()))

  //Check that the player typed the right word in, if they did then send them a new word and their prize
  socket.on('check_word', data => {
    console.log(data)
    if(data.answer === data.currWord) {
      socket.emit('new_word', {newWord: wordGenerator(), reduction: data.currWord.length/2})
      if(!data.isMultiplayer) {
        socket.emit('update_score', 1) //only need to update the score if its a single player game
      }
    } else {
      socket.emit('penalty') //penalized the player for getting the word wrong. #toughlove
    }
  })

  //Multiplayer logic

  //join a room (creates one if it doesn't already exists)
  socket.on('join', name => {
    //join the room
    socket.join(name)

    let room = rooms.get(name)
    if(room.isFull) {
      console.log('Both players have joined!')

      //tell the players who to send data too
      io.to(room.player1).emit('oid', room.player2)
      io.to(room.player2).emit('oid', room.player1)

      //get both players ready
      io.sockets.in(name).emit('both_players_ready')

      //delay so everyone is caught up/ rending things on client end is in sync
      setTimeout(() => io.sockets.in(name).emit('first_word', wordGenerator()), 1000)

      //set up increasing difficulty
      const intervalID = setInterval(() => {
        console.log(`Increasing speed for ${room.name}`)
        io.sockets.in(name).emit('increase_speed')
      }, 10000)

      room.intervalID = intervalID
    }
  })

  //Remove the client from the room, then perform some clean up.
  socket.on('leave', room => {
    socket.leave(room)
    console.log(`${socket.id} left ${room}`)

    if(rooms.get(room) !== undefined && rooms.get(room).intervalID) {
      clearInterval(rooms.get(room).intervalID)
      //using Object.assign as a poormans object spread.
      rooms.set(room, Object.assign({}, rooms.get(room), {intervalID: null}))
    } else {
      //if you're the last one to leave the room, then burn it to the ground.
      rooms.delete(room)
    }
  })

  //Find a room, or generate a new room name if none are available.
  socket.on('start_multiplayer', () => {
    console.log(`Starting multiplayer session for ${socket.id}`)
    //if there is space in a room that already exists, join that room. otherwise, create a new room, join it, wait for another player.
    let entries = [...rooms.entries()] //creating an array out of an iterable.

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
        isFull: false,
        intervalID: null
      }
      rooms.set(name, newRoom)
      socket.emit('join_room', name)
    }
  })

  //send the updated timer information to your opponent so they see your timer.
  socket.on('trigger_update_opponent_timer', data => io.to(data.to).emit('update_opponent_timer', data.newTime))

  //If a client disconnects, then we remove them from all rooms they're a part of (should be at most 1), perform some cleanup,  and tell the other players in this room that the game is over cause of a leaver.
  socket.on('disconnect', (data) => {
    console.log(`${socket.id} disconnected. Removing all rooms with ${socket.id}`)
    let entries = [...rooms.entries()] //Creating an array out of an iterable.
    entries.forEach(elem => {
      if(elem[1].player1 === socket.id || elem[1].player2 === socket.id) {
        socket.leave(elem[1].name)
        if(elem[1].intervalID) {
          clearInterval(elem[1].intervalID)
        }
        io.sockets.in(elem[1].name).emit('game_over', true)
        rooms.delete(elem[0])
      }
    })
  })
})

//Listen on port 8000
server.listen(8000)
