const APP_INFO = require('../appInfo')
const { ipcRenderer } = require("electron")
const { Vault, VaultEvents } = require('../services/vault')
const templateLoader = require('../helpers/templateLoader')
const passwordsModule = require('../controllers/passwords')
const notesModule = require('../controllers/notes')
const cardsModule = require('../controllers/cards')
const loginModule = require('../controllers/login')
const AVAILABLE_MODULES = require('../helpers/availableModules')
const CURRENT_MODULE = {
  name: null,
  controller: null,
  menuItem: null
}
const vault = new Vault()

window.onload = init

function init() {

  minimizeAppButton.addEventListener('click', () => {
    ipcRenderer.send('minimizeApp')
  })

  maximizeRestoreAppButton.addEventListener('click', () => {
    ipcRenderer.send('maximizeRestoreApp')
  })

  closeAppButton.addEventListener('click', () => {
    ipcRenderer.send('closeApp')
  })

  ipcRenderer.on('appWindowStateChange', appWindowStateChangeHandler)

  initMenu()
  vault.init()
  showLogin()
}

function appWindowStateChangeHandler(event, isWindowMaximized) {
  if (isWindowMaximized) {
    maximizeRestoreAppButton.title = 'Restore'
    maximizeRestoreAppButton.classList.add('maximized')
  } else {
    maximizeRestoreAppButton.title = 'Maximize'
    maximizeRestoreAppButton.classList.remove('maximized')
  }
}

function initMenu() {
  passwordsAppMenu.addEventListener('click', () => {
    loadModule(AVAILABLE_MODULES.passwords)
  })
  notesAppMenu.addEventListener('click', () => {
    loadModule(AVAILABLE_MODULES.notes)
  })
  cardsAppMenu.addEventListener('click', () => {
    loadModule(AVAILABLE_MODULES.cards)
  })
}

function showLogin() {
  appHome.style.display = 'none'

  document.title = `Login - ${APP_INFO.name}`
  appTitle.innerText = `Login - ${APP_INFO.name}`

  templateLoader.loadModuleTemplate(loginModule.template).then(data => {
    workspaceStyle.innerHTML = data.css
    appLogin.innerHTML = data.html

    appLoginForm.addEventListener('submit', loginSubmitEvent)
    appLoginTitle.innerText = vault.isNew() ? 'Enter a key to use for your new vault' : 'Enter your vault key'
  })
}

function loginSubmitEvent(event) {
  event.preventDefault()
  let key = appLoginPassword.value
  if (vault.isNew()) {
    vault.updateVaultHash(key)
    ipcRenderer.send('relaunchApp')
  } else {
    if (vault.verifyKey(key)) {
      successfulLogin()
    } else {
      appLoginPrompt.style.visibility = 'visible'
    }
  }
}

function successfulLogin() {
  appLogin.style.display = 'none'
  appHome.style.display = 'flex'

  loadModule(AVAILABLE_MODULES.passwords)
}

function loadModule(module) {
  // Clear current module

  if (CURRENT_MODULE.controller) {
    // Call the destroy method on previosu module if it exists
    CURRENT_MODULE.controller.destroy && CURRENT_MODULE.controller.destroy()
  }

  if (CURRENT_MODULE.menuItem) {
    // Remove active class from last menu item if exists
    CURRENT_MODULE.menuItem.classList && CURRENT_MODULE.menuItem.classList.remove('active')
  }

  switch (module) {
    case AVAILABLE_MODULES.passwords:
      CURRENT_MODULE.name = 'Passwords'
      CURRENT_MODULE.controller = passwordsModule
      CURRENT_MODULE.menuItem = passwordsAppMenu
      break
    case AVAILABLE_MODULES.notes:
      CURRENT_MODULE.name = 'Notes'
      CURRENT_MODULE.controller = notesModule
      CURRENT_MODULE.menuItem = notesAppMenu
      break
    case AVAILABLE_MODULES.cards:
      CURRENT_MODULE.name = 'Cards'
      CURRENT_MODULE.controller = cardsModule
      CURRENT_MODULE.menuItem = cardsAppMenu
      break;

    default:
      console.error("Module name not specified: Using passwords module as default")
      CURRENT_MODULE.name = 'Passwords'
      CURRENT_MODULE.controller = passwordsModule
      CURRENT_MODULE.menuItem = passwordsAppMenu
      break
  }

  applyModule()
}

function applyModule() {
  // Clear currently loaded module from UI
  workspace.innerHTML = ''
  workspaceStyle.innerHTML = ''
  document.title = `${CURRENT_MODULE.name} - ${APP_INFO.name}`
  appTitle.innerText = document.title
  CURRENT_MODULE.controller.init({ workspace, vault, workspaceStyle })
  CURRENT_MODULE.menuItem.classList.add('active')
}