function create(template, content, eventHandlers, index, newEntry) {
  index = index || 1
  newEntry = newEntry || false
  let wrapper = document.createElement('div')
  template = template.replaceAll('{{content}}', content.content)
  template = template.replaceAll('{{id}}', content.id)
  wrapper.innerHTML = template.trim()

  let container = wrapper.querySelector('article')
  let inputs = {
    content: wrapper.querySelector('textarea[name="content"]')
  }
  let fields = {
    content: wrapper.querySelector('[data-field="content"]')
  }
  let buttons = {
    edit: wrapper.querySelector('button.btn-edit-info'),
    save: wrapper.querySelector('button.btn-save-info'),
    cancel: wrapper.querySelector('button.btn-cancel-info'),
    delete: wrapper.querySelector('button.btn-delete-info'),
    undo: wrapper.querySelector('button.btn-undo-delete')
  }
  let eventData = {
    id: content.id, container, inputs, fields, buttons, newEntry
  }

  buttons.edit.addEventListener('click', () => eventHandlers.editInfoHandler(eventData))
  buttons.cancel.addEventListener('click', () => eventHandlers.cancelEditHandler(eventData))
  buttons.save.addEventListener('click', () => eventHandlers.saveHandler(eventData))
  buttons.delete.addEventListener('click', () => eventHandlers.deleteHandler(eventData))
  buttons.undo.addEventListener('click', () => eventHandlers.undoDeleteHandler(eventData))

  if (newEntry) {
    container.classList.add('slide')
    eventHandlers.editInfoHandler(eventData)
  } else {
    setTimeout(() => {
      container.classList.add('slide')
    }, 50 * index)
  }
  return wrapper
}

function destroy(component, htmlElemnt) {
  component.container.remove()
  component.inputs.content = null
  component.fields.content = null
  component.buttons.edit = null
  component.buttons.save = null
  component.buttons.cancel = null
  component.buttons.delete = null
  component.buttons.undo = null
  component.container = null
}

module.exports = {
  create, destroy
}