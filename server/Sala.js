class Sala {
  constructor(io, id) {
    this.io = io
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
    this.io.in(this.id).emit(id, msg)
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
module.exports = Sala