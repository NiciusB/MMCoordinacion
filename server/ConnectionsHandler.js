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
        socket.emit('chat', ['System', 'Usa /help para ver la lista de comandos disponibles'])
  
        socket.on('disconnect', () => {
          sala.leaved(socket)
        })
        socket.on('chat', msg => {
          if (msg[0] === '/') {
            const command = msg.split(' ')
            command[0] = command[0].replace('/', '')
            switch (command[0]) {
              case 'ordenes':
                command.splice(0, 1)
                sala.ordenes(command.join(' '))
                break
              case 'help': case '?':
                socket.emit('chat', ['System', 'Lista de comandos: /ordenes, /timer, /leave, /help, /?'])
                break
              case 'timer':
                for(let t = 10; t >= 0; t--) {
                  setTimeout(() => {
                    sala.chat(['System', t > 3 ? t : `${t}<script>beep()</script>`])
                  }, (10 - t) * 1000)
                }
                break
              case 'leave':
                socket.disconnect()
                break
              default:
                socket.emit('chat', ['System', 'Comando no reconocido. Usa /help para ver la lista de comandos'])
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