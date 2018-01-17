const express = require('express')
const http = require('http')
const app = express()
const server = http.createServer(app)
const io = require('socket.io')(server)
const path = require('path')
const sassMiddleware = require('node-sass-middleware')

app.use(sassMiddleware({
  /* Options */
  src: path.join('client', 'scss'),
  dest: path.join('client', 'public'),
  outputStyle: 'compressed'
}))
// Note: you must place sass-middleware *before* `express.static` or else it will
// not work.
app.use(express.static(path.join('client', 'public')))

const salas = {}
class Sala {
  constructor(id) {
    this.id = id
    this.miembrosSaved = []
    this.ordenesSaved = []
    this.chatHist = []
    this.chat(['System', 'Creada sala ' + this.id])
  }
  chat(msg) {
    this.chatHist.push(msg)
    this.emit('chat', msg)
  }
  ordenes(ordenes) {
    this.ordenesSaved = ordenes
    this.emit('ordenes', ordenes)
  }
  emit(id, msg) {
    io.in(this.id).emit(id, msg)
  }
  joined(socket) {
    this.chat(['System', 'Welcome, ' + socket.userInfo.username])
    socket.join(this.id)
    socket.emit('ordenes', this.ordenesSaved)
    this.chatHist.forEach(element => {
      socket.emit('chat', element)
    })
    this.miembrosSaved.push(socket.userInfo.username)
    this.emit('miembros', this.miembrosSaved)
  }
  leaved(socket) {
    this.miembrosSaved.splice(this.miembrosSaved.indexOf(socket.userInfo.username), 1)
    this.emit('miembros', this.miembrosSaved)
  }
}

io.on('connection', socket => {
  socket.on('henloLizard', userInfo => {
    socket.userInfo = userInfo
    io.in(userInfo.sala).clients((error, clients) => {
      if (error) throw error
      if (clients.length === 0) salas[userInfo.sala] = new Sala(userInfo.sala)

      if (userInfo.username == 'System') socket.disconnect()
      if ((clients && clients.some(client => io.sockets.sockets[client].userInfo.username == userInfo.username))) {
        socket.disconnect()
      }
      if (socket.disconnected) return
      
      const sala = salas[userInfo.sala]
      sala.joined(socket)

      socket.on('disconnect', () => {
        sala.leaved(socket)
      })
      socket.on('ordenes', ordenes => {
        sala.ordenes(ordenes)
      })
      socket.on('chat', msg => {
        if (msg[0] === '/') {
          const command = msg.split('/')
          command.splice(0, 1)
          switch (command[0]) {
            case 'presi':
              userInfo.presi = !userInfo.presi
              socket.emit('presi', userInfo.presi)
              socket.emit('chat', ['System', userInfo.presi ? 'Bienvenido presi' : 'Chao presi'])
              break
            case 'help': case '?':
              socket.emit('chat', ['System', 'Lista de comandos: /presi, /help, /?'])
              break
            default:
              socket.emit('chat', ['System', 'Comando no reconocido'])
              break
          }
        } else {
          sala.chat([userInfo.username, msg])
        }
      })
    })
  })
})

server.listen(3666, function listening() {
  console.log('Listening on %d', server.address().port)
})