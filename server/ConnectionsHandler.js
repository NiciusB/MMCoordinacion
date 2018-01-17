const Sala = require('./Sala.js')
const socket = require('socket.io')

module.exports = server => {
  const io = socket(server)
  const salas = {}
  io.on('connection', socket => {
    socket.on('henloLizard', userInfo => {
      socket.userInfo = userInfo
      io.in(userInfo.sala).clients((error, clients) => {
        if (error) return
        try {
          if (clients.length === 0) salas[userInfo.sala] = new Sala(io, userInfo.sala)
          else if (clients.some(client => io.sockets.sockets[client].userInfo.username == userInfo.username)) {
            socket.disconnect()
          }
          if (userInfo.username == 'System') socket.disconnect()
          if (socket.disconnected) return
        } catch (e) {
          console.error(e)
          return
        }
        
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
}