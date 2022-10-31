const templateLoader = require('../helpers/templateLoader')
const passwordCard = require('../services/templating/passwordCard')
const clipboard = require('../helpers/clipboard')

const childTemplates = {
  card: {
    path: '../views/templates/passwordCard.html',
    html: null
  }
}
const template = {
  html: '../views/passwords.html',
  css: '../styles/passwords.css'
}

var vault = null
const components = {}
const deleteTimers = {}
let searchTimeout = null
let isEditing = false

function init(root) {
  vault = root.vault
  templateLoader.loadModuleTemplate(template)
    .then(data => {
      root.workspaceStyle.innerHTML = data.css
      root.workspace.innerHTML = data.html
      templateLoader.loadHtmlTemplate(childTemplates.card.path)
        .then(html => {
          childTemplates.card.html = html
          renderData()
          initEvents()
        })
    })
}

function renderData() {
  listContainer.classList.remove('list-empty')
  listContainer.classList.add('list-loading')
  vault.loadPasswords()
    .then(() => {
      listContainer.classList.remove('list-empty')
      listContainer.classList.remove('list-loading')

      if (!!vault.getPasswords().length) {
        vault.getPasswords().forEach((password, index) => {
          let component = passwordCard.create(childTemplates.card.html, password, getEventHandlers(), index)
          components[password.id] = component
          passwordsList.append(component)
        });
      }
      else {
        listContainer.classList.add('list-empty')
      }
    })
    .catch(err => {
      listContainer.classList.add('list-empty')
      listContainer.classList.remove('list-loading')
    })
}

function initEvents() {
  newPasswordButton.addEventListener('click', newInfoHandler)
  passwordsSearchTextbox.addEventListener('keyup', searchInfoHandler)
}

function showInfoHandler(component) {
  component.inputs.password.type = 'text'
  component.container.classList.add('shown')
}

function hideInfoHandler(component) {
  component.inputs.password.type = 'password'
  component.container.classList.remove('shown')
}

function copyToClipboardHandler(component) {
  clipboard.copyTextToClipboard(component.inputs.password.value)
  component.container.classList.add('copied')
  setTimeout(() => {
    component.container.classList.remove('copied')
  }, 1000)
}

function editInfoHandler(component) {
  isEditing = true
  component.container.classList.remove('shown')
  component.container.classList.add('editing')
  component.inputs.password.type = 'text'
  component.inputs.password.readOnly = false
  updateCssClasses()
}

function cancelEditHandler(component, original) {
  isEditing = false
  if (component.newEntry) {
    vault.removePasswordFromMemory(component.id)
    passwordCard.destroy(component)
  } else {
    component.container.classList.remove('shown')
    component.container.classList.remove('editing')
    component.inputs.password.type = 'password'
    component.inputs.password.readOnly = true

    original = original || vault.getPassword(component.id)
    component.fields.domain.innerText = original.domain
    component.inputs.domain.value = original.domain
    component.fields.email.innerText = original.email
    component.inputs.email.value = original.email
    component.inputs.password.value = original.password
  }

  updateCssClasses()
}

function saveHandler(component) {
  let original = vault.getPassword(component.id)
  original.domain = component.inputs.domain.value
  original.email = component.inputs.email.value
  original.password = component.inputs.password.value
  original.modified = new Date().getTime()

  vault.savePasswords()

  // Not new anymore
  component.newEntry = false
  isEditing = false
  cancelEditHandler(component, original)
  updateCssClasses()
}

function deleteHandler(component) {
  hideInfoHandler(component)
  component.container.classList.remove('editing')
  component.container.classList.add('deleting')

  deleteTimers[component.id] = setTimeout(() => {
    vault.deletePassword(component.id)
    passwordCard.destroy(component)
    delete components[component.id]
    updateCssClasses()
  }, 5000)
}

function undoDeleteHandler(component) {
  component.container.classList.remove('deleting')
  clearTimeout(deleteTimers[component.id])
  updateCssClasses()
}

function newInfoHandler() {
  let newInfo = vault.newPassword()
  let component = passwordCard.create(childTemplates.card.html, newInfo, getEventHandlers(), null, true)
  components[newInfo.id] = component
  passwordsList.prepend(component)
  updateCssClasses()
}

function searchInfoHandler() {
  if (!vault.getPasswords()) {
    return
  }
  let searchKey = passwordsSearchTextbox.value.trim()
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    let ids = vault.getPasswordIDsForSearch(searchKey)
    Object.keys(components).forEach(id => {
      if (ids.includes(id)) {
        components[id].firstElementChild.classList.remove('search-hide')
      } else {
        components[id].firstElementChild.classList.add('search-hide')
      }
    })
    searchTimeout = null
  }, 750)
}

function updateCssClasses() {
  listContainer.classList.remove('list-loading')
  if (vault.getPasswords().length > 0) {
    listContainer.classList.remove('list-empty')
  } else {
    listContainer.classList.add('list-empty')
  }

  if (isEditing) {
    listContainer.classList.add('editing')
    topBar.classList.add('editing')
  } else {
    listContainer.classList.remove('editing')
    topBar.classList.remove('editing')
  }
}

function getEventHandlers() {
  return {
    showInfoHandler,
    hideInfoHandler,
    copyToClipboardHandler,
    editInfoHandler,
    cancelEditHandler,
    saveHandler,
    deleteHandler,
    undoDeleteHandler
  }
}

function destroy() {

  // Destroy all passwords
  Object.keys(components).forEach(id => {
    components[id].remove()
    delete components[id]
  })

  // Clear variables
  vault = null
  childTemplates.card.html = null
  newPasswordButton.removeEventListener('click', newInfoHandler)
  passwordsSearchTextbox.removeEventListener('keyup', searchInfoHandler)
}

module.exports = {
  init, destroy
}