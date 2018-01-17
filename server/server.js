const express = require('express')
const http = require('http')
const app = express()
const path = require('path')
const fs = require('fs')
const server = http.createServer(app)
const sassMiddleware = require('node-sass-middleware')

const savePath = './salas.json'
var salas = {}
if (!fs.existsSync(savePath)) {
  fs.writeFileSync(savePath, JSON.stringify(salas))
} else {
  try {
    salas = JSON.parse(fs.readFileSync(savePath))
  } catch (e) {
    salas = {}
  }
}

app.use(sassMiddleware({
  src: path.join('client', 'scss'),
  dest: path.join('client', 'public'),
  outputStyle: 'compressed'
}))
app.use(express.static(path.join('client', 'public')))

require('./ConnectionsHandler.js')(server, salas)

setInterval(() => {
  fs.writeFile(savePath, JSON.stringify(salas), ()=>{})
}, 1000)

server.listen(3666, function listening() {
  console.log('Listening on %d', server.address().port)
})
