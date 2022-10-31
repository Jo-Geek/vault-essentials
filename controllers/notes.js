const templateLoader = require('../helpers/templateLoader')
const noteCard = require('../services/templating/noteCard')

const childTemplates = {
  card: {
    path: '../views/templates/noteCard.html',
    html: null
  }
}
const template = {
  html: '../views/notes.html',
  css: '../styles/notes.css'
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
  vault.loadNotes()
    .then(() => {
      listContainer.classList.remove('list-empty')
      listContainer.classList.remove('list-loading')

      if (!!vault.getNotes().length) {
        vault.getNotes().forEach((note, index) => {
          let component = noteCard.create(childTemplates.card.html, note, getEventHandlers(), index)
          components[note.id] = component
          notesList.append(component)
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
  newNoteButton.addEventListener('click', newInfoHandler)
  notesSearchTextbox.addEventListener('keyup', searchInfoHandler)
}

function editInfoHandler(component) {
  isEditing = true
  component.container.classList.add('editing')
  updateCssClasses()
}

function cancelEditHandler(component, original) {
  isEditing = false
  if (component.newEntry) {
    vault.removeNoteFromMemory(component.id)
    noteCard.destroy(component)
  } else {
    component.container.classList.remove('editing')
    original = original || vault.getNote(component.id)
    component.fields.content.innerText = original.content
    component.inputs.content.value = original.content
  }

  updateCssClasses()
}

function saveHandler(component) {
  let original = vault.getNote(component.id)
  original.content = component.inputs.content.value
  original.modified = new Date().getTime()

  vault.saveNotes()

  // Not new anymore
  component.newEntry = false
  isEditing = false
  cancelEditHandler(component, original)
  updateCssClasses()
}

function deleteHandler(component) {
  component.container.classList.remove('editing')
  component.container.classList.add('deleting')

  deleteTimers[component.id] = setTimeout(() => {
    vault.deleteNote(component.id)
    noteCard.destroy(component)
    components[component.id] = null
    updateCssClasses()
  }, 5000)
}

function undoDeleteHandler(component) {
  component.container.classList.remove('deleting')
  clearTimeout(deleteTimers[component.id])
  updateCssClasses()
}

function newInfoHandler() {
  let newInfo = vault.newNote()
  let component = noteCard.create(childTemplates.card.html, newInfo, getEventHandlers(), null, true)
  components[newInfo.id] = component
  notesList.prepend(component)
  updateCssClasses()
}

function searchInfoHandler() {
  if (!vault.getNotes()) {
    return
  }
  let searchKey = notesSearchTextbox.value.trim()
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    let ids = vault.getNoteIDsForSearch(searchKey)
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
  if (vault.getNotes().length > 0) {
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
    editInfoHandler,
    cancelEditHandler,
    saveHandler,
    deleteHandler,
    undoDeleteHandler
  }
}


function destroy() {

  // Destroy all notes
  Object.keys(components).forEach(id => {
    components[id].remove()
    delete components[id]
  })

  // Clear variables
  vault = null
  childTemplates.card.html = null
  newNoteButton.removeEventListener('click', newInfoHandler)
  notesSearchTextbox.removeEventListener('keyup', searchInfoHandler)
}


module.exports = {
  init, destroy
}