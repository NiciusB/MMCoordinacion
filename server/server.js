const express = require('express')
const http = require('http')
const app = express()
const path = require('path')
const server = http.createServer(app)
const sassMiddleware = require('node-sass-middleware')

app.use(sassMiddleware({
  src: path.join('client', 'scss'),
  dest: path.join('client', 'public'),
  outputStyle: 'compressed'
}))
app.use(express.static(path.join('client', 'public')))

require('./ConnectionsHandler.js')(server)

server.listen(3666, function listening() {
  console.log('Listening on %d', server.address().port)
})
