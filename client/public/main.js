const app = document.querySelector('#app')

const states = {
  loggedInState,
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
          <div class="credits"><a href="https://github.com/NiciusB/MMCoordinacion">https://github.com/NiciusB/MMCoordinacion</a></div>
        </form>`
    const loginForm = document.querySelector('#loginForm')
    const loginIdSala = loginForm.querySelector('input[type=number]')
    const loginUsername = loginForm.querySelector('input[type=text]')
    loginIdSala.value = Math.floor(Math.random() * 899999) + 100000
    loginUsername.value = 'Anon' + (Math.floor(Math.random() * 899) + 100)
    loginForm.onsubmit = event => {
      event.preventDefault()
      const userInfo = {
        sala: loginIdSala.value,
        username: loginUsername.value,
        presi: false
      }
      var socket = io(`ws://${location.hostname}:3666`)
      socket.on('connect', () => this.loggedInState(socket, userInfo))
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
          <button>Ok</button>
        </div>`
    const wpInfo = document.querySelector('#wpInfo')
    wpInfo.querySelector('p').textContent = message
    wpInfo.querySelector('button').onclick = () => {
      socket.disconnect()
      socket = false
      this.login()
    }
  }
}

states.login()