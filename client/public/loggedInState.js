const loggedInState = (socket, userInfo) => {
    var pendingMsgInChat = 0
    function updateTitle() {
        if (!document.hidden) pendingMsgInChat = 0
        document.title = 'MMCoord' + (pendingMsgInChat ? ` (${pendingMsgInChat})` : '')
    }
    window.onfocus = () => {
        updateTitle()
        document.querySelector('#caja').focus()
    }
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
    caja.focus()
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
        if (messages.scrollHeight - messages.scrollTop - messages.offsetHeight < 100) messages.scrollTop = messages.scrollHeight
        pendingMsgInChat++
        updateTitle()
    })
    socket.on('ordenes', ordenes => {
        listaOrdenes = ordenes
        updateOrdenes()
    })
    socket.on('miembros', miembros => {
        listaMiembros = miembros
        if (userInfo.presi) updatePresi()
    })
    socket.on('presi', valor => {
        userInfo.presi = valor
        updatePresi()
    })
    const updatePresi = () => {
        if (userInfo.presi) {
            presi.style.display = 'block'
            const miembrosOptions = !listaMiembros.length ? '' : listaMiembros.map(a => `<option value="${parseHTML(a)}">${parseHTML(a)}</option>`).reduce((a, b) => a + b)
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
                html += `
                <h1><a href="${val.link}" target="_blank">${parseHTML(val.nombre)}</a></h1>
                <p>Nivel de seguridad: ${val.seguridad}</p>
                <p>Número de guardias: ${val.guardias}</p>
                <p>Sabots a enviar: ${val.sabots}</p>
                <p>Miembros asignados: ${parseHTML(val.miembros)}</p>
                <p>Notas: ${parseHTML(val.notas)}</p>
                `
                if (userInfo.presi) {
                    html += `<button class="borrar-orden" data-index="${index}">Borrar</button>`
                    html += `<button class="editar-orden" data-index="${index}">Editar</button>`
                }
            }
        })
        ordenesDiv.innerHTML = html
        if (userInfo.presi) {
            document.querySelectorAll('.borrar-orden').forEach(val => {
                val.onclick = () => {
                    listaOrdenes.splice(parseInt(val.dataset.index), 1)
                    updateOrdenes()
                    socket.emit('ordenes', listaOrdenes)
                }
            })
            document.querySelectorAll('.editar-orden').forEach(val => {
                val.onclick = () => {
                    const orden = listaOrdenes[parseInt(val.dataset.index)]
                    const newTarget = presi.querySelector('#newTarget')
                    var k = 0
                    newTarget.querySelectorAll('input')[k++].value = orden.nombre
                    newTarget.querySelectorAll('input')[k++].value = orden.link
                    newTarget.querySelectorAll('input')[k++].value = orden.seguridad
                    newTarget.querySelectorAll('input')[k++].value = orden.guardias
                    newTarget.querySelectorAll('input')[k++].value = orden.sabots
                    newTarget.querySelectorAll('input')[k++].value = orden.notas
                    listaOrdenes.splice(parseInt(val.dataset.index), 1)
                    updateOrdenes()
                    socket.emit('ordenes', listaOrdenes)
                }
            })
        }
    }
}


function parseHTML(html) {
    const virtualDiv = document.createElement('div')
    virtualDiv.textContent = html
    return virtualDiv.innerHTML
}