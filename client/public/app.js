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
      event.preventDefault()
      const userInfo = {
        sala: loginIdSala.value,
        username: loginUsername.value,
        presi: false
      }
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
    var listaOrdenes = []
    var listaMiembros = []
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
      const msg = parseHTML(chat[1])
      const userName = parseHTML(chat[0])
      messages.innerHTML += `\n<p><b>${userName}</b>: ${msg}</p>`
      if(messages.scrollHeight - messages.scrollTop - messages.offsetHeight < 100) messages.scrollTop = messages.scrollHeight
    })
    socket.on('ordenes', ordenes => {
      listaOrdenes = ordenes
      updateOrdenes()
    })
    socket.on('miembros', miembros => {
      listaMiembros = miembros
      updatePresi()
    })
    socket.on('presi', valor => {
      userInfo.presi = valor
      updatePresi()
    })
    const updatePresi = () => {
      if (userInfo.presi) {
        presi.style.display = 'block'
        const miembrosOptions = !listaMiembros.length ? '' : listaMiembros.map(a=>`<option value="${parseHTML(a)}">${parseHTML(a)}</option>`).reduce((a, b) => a+b)
        presi.innerHTML = `
          <form id="newTarget">
          <label>Nombre <input type="text"/></label>
          <label>Link perfil <input type="url"/></label>
          <label>Nivel de seguridad <input type="number"/></label>
          <label>Número de guardias <input type="number"/></label>
          <label>Sabots a enviar <input type="number"/></label>
          <div>Miembros asignados <select multiple>${miembrosOptions}</select></div>
          <label>Notas <input type="text"/></label>
          <button>Añadir objetivo</button>
          </form>
          <hr/>
        `
        const newTarget = presi.querySelector('#newTarget')
        newTarget.querySelector('select').onmousedown = e => {
            e.preventDefault()
            e.target.selected = !e.target.selected
            newTarget.querySelector('select').focus()
            return false
        }
        newTarget.onsubmit = event => {
          event.preventDefault()
          let k = 0
          listaOrdenes.push({
            nombre: newTarget.querySelectorAll('input')[k++].value,
            link: newTarget.querySelectorAll('input')[k++].value,
            seguridad: newTarget.querySelectorAll('input')[k++].value,
            guardias: newTarget.querySelectorAll('input')[k++].value,
            sabots: newTarget.querySelectorAll('input')[k++].value,
            notas: newTarget.querySelectorAll('input')[k++].value,
            miembros: Array.from(newTarget.querySelector('select').selectedOptions).map(v => v.value)
          })
          updateOrdenes()
          newTarget.reset()
          socket.emit('ordenes', listaOrdenes)
          return false
        }
      } else presi.style.display = 'none'
      updateOrdenes()
    }
    const updateOrdenes = () => {
      var html = ''
      if (!listaOrdenes.length) html = '<h1>Aún no hay órdenes</h1>'
      else listaOrdenes.forEach((val, index) => {
        if (userInfo.presi || val.miembros.indexOf(userInfo.username) != -1) {
          html+= `
          <h1><a href="${val.link}" target="_blank">${parseHTML(val.nombre)}</a></h1>
          <p>Nivel de seguridad: ${val.seguridad}</p>
          <p>Número de guardias: ${val.guardias}</p>
          <p>Sabots a enviar: ${val.sabots}</p>
          <p>Miembros asignados: ${parseHTML(val.miembros)}</p>
          <p>Notas: ${parseHTML(val.notas)}</p>
          `
          if (userInfo.presi) {
            html+= `<button class="borrar-orden" data-index="${index}">Borrar</button>`
          }
        }
      })
      ordenesDiv.innerHTML = html
      document.querySelectorAll('.borrar-orden').forEach(val => {
        val.onclick = () => {
          listaOrdenes.splice(parseInt(val.dataset.index), 1)
          updateOrdenes()
          socket.emit('ordenes', listaOrdenes)
        }
      })
    }
  }
}

states.login()

function parseHTML(html) {
  const virtualDiv = document.createElement('div')
  virtualDiv.textContent = html
  return virtualDiv.innerHTML
}