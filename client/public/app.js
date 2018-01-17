const app = document.querySelector('#app')

const states = {
  login() {
    app.innerHTML = `
        <form id="loginForm" class="fullscreen">
          <label>
            <p>Sala</p>
            <input type="number" size="40" min="1" max="9999999999"/>
            <p>Username</p>
            <input type="text"/>
          </label>
          <button>Entrar</button>
        </form>`
    const loginForm = document.querySelector('#loginForm')
    const loginIdSala = loginForm.querySelector('input[type=number]')
    const loginUsername = loginForm.querySelector('input[type=text]')
    loginIdSala.value = Math.floor(Math.random() * 899999) + 100000
    loginUsername.value = 'Anon' + (Math.floor(Math.random() * 899) + 100)
    loginForm.onsubmit = event => {
      const userInfo = {
        sala: loginIdSala.value,
        username: loginUsername.value,
        presi: false
      }
      event.preventDefault()
      var socket = io(location.hostname === 'localhost' ? 'ws://localhost:3666' : 'ws://nuno.bigmoney.biz:3666')
      socket.on('connect', () => this.app(socket, userInfo))
      socket.on('connect_timeout', () => this.wsInfo(socket, 'WebSocket connect_timeout'))
      socket.on('connect_error', () => this.wsInfo(socket, 'WebSocket connect_error'))
      socket.on('error', () => this.wsInfo(socket, 'WebSocket connection error'))
      socket.on('disconnect', () => this.wsInfo(socket, 'WebSocket connection closed'))
      return false
    }
  },
  wsInfo(socket, message) {
    if (!socket) return
    app.innerHTML = `
        <div id="wpInfo" class="fullscreen">
          <p></p>
          <button>Retry</button>
        </div>`
    const wpInfo = document.querySelector('#wpInfo')
    wpInfo.querySelector('p').textContent = message
    wpInfo.querySelector('button').onclick = () => {
      socket.disconnect()
      socket = false
      this.login()
    }
  },
  app(socket, userInfo) {
    app.innerHTML = `
      <div id="chat">
        <div id="messages"></div>
        <input id="caja" />
      </div>
      <div id="panel">
        <div id="presi"></div>
        <div id="ordenesDiv"></div>
      </div>`
    const caja = document.querySelector('#caja')
    const messages = document.querySelector('#messages')
    const panel = document.querySelector('#panel')
    const presi = panel.querySelector('#presi')
    const ordenesDiv = panel.querySelector('#ordenesDiv')
    caja.onkeypress = e => {
      if (e.keyCode !== 13) return true
      socket.emit('chat', caja.value)
      caja.value = ''
      return false
    }
    socket.emit('henloLizard', userInfo)
    socket.on('chat', chat => {
      const virtualDiv = document.createElement('div')
      virtualDiv.textContent = chat[1]
      const msg = virtualDiv.innerHTML
      const userName = chat[0]
      messages.innerHTML += `\n<p><b>${userName}</b>: ${msg}</p>`
      if(messages.scrollHeight - messages.scrollTop < 200) messages.scrollTop = messages.scrollHeight
    })
    socket.on('ordenes', ordenes => {
      ordenesDiv.innerHTML = ordenes
    })
    socket.on('presi', valor => {
      userInfo.presi = valor
      updatePresi()
    })
    const updatePresi = () => {
      if (userInfo.presi) {
        presi.style.display = 'block'
        presi.innerHTML = `
          <button id="vaciarOrdenes">Vaciar ordenes</button>`
        const vaciarOrdenes = presi.querySelector('#vaciarOrdenes')
        vaciarOrdenes.onclick = () => {
          socket.emit('ordenes', Math.random())
        }
      } else presi.style.display = 'none'
    }
    updatePresi()
  }
}

states.login()