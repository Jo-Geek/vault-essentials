const { app } = require('electron')

function initAll(appWindow, ipc) {
  initWindow(appWindow, ipc)
  initEvents(appWindow, ipc)
}

function initWindow(appWindow, ipc) {
  appWindow.setMenuBarVisibility(true)
  appWindow.loadFile('./views/root.html')
}

function initEvents(appWindow, ipc) {
  // IPC events
  ipc.on('minimizeApp', () => {
    appWindow.minimize()
  })

  ipc.on('maximizeRestoreApp', () => {
    if (appWindow.isMaximized()) {
      appWindow.restore()
    } else {
      appWindow.maximize()
    }
  })

  ipc.on('closeApp', () => {
    app.quit()
  })

  ipc.on('relaunchApp', () => {
    app.relaunch()
    app.quit()
  })

  // AppWindow Events
  appWindow.on('maximize', () => {
    appWindow.webContents.send('appWindowStateChange', true)
  })

  appWindow.on('unmaximize', () => {
    appWindow.webContents.send('appWindowStateChange', false)
  })
}

module.exports = { initAll, initWindow, initEvents }