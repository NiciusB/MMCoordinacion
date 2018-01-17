const loggedInState = (socket, userInfo) => {
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
    messages.mouseClickedSelf = false
    messages.onmousedown = e => {messages.mouseClickedSelf = e.target === messages}
    messages.onmouseup = e => {if(messages.mouseClickedSelf) caja.focus()}
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
    var pendingMsgInChat = 0
    function updateTitle() {
        if (!document.hidden) pendingMsgInChat = 0
        document.title = 'MMCoord' + (pendingMsgInChat ? ` (${pendingMsgInChat})` : '')
    }
    window.onfocus = () => {
        updateTitle()
        document.querySelector('#caja').focus()
    }
    var listaMiembros = []
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
    var listaOrdenes = []
    var lastNOrdenes = 0
    socket.on('ordenes', ordenes => {
        listaOrdenes = ordenes
        updateOrdenes()
        if (!userInfo.presi) {
            var misOrdenes = listaOrdenes.filter(val => val.miembros.indexOf(userInfo.username) != -1).length
            if (misOrdenes > lastNOrdenes) beep()
            lastNOrdenes = misOrdenes
        }
    })
    const updateOrdenes = () => {
        var html = ''
        if (!listaOrdenes.length) html = '<h1>Aún no hay órdenes</h1>'
        else listaOrdenes.filter(val => userInfo.presi || val.miembros.indexOf(userInfo.username) != -1).forEach((val, index) => {
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

function beep() {
    var snd = new  Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");  
    snd.play();
}