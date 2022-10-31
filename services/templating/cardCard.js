function create(template, content, eventHandlers, index, newEntry) {
  index = index || 1
  newEntry = newEntry || false
  let wrapper = document.createElement('div')
  template = template.replaceAll('{{domain}}', content.domain)
  template = template.replaceAll('{{email}}', content.email)
  template = template.replaceAll('{{password}}', content.password)
  template = template.replaceAll('{{id}}', content.id)
  wrapper.innerHTML = template.trim()

  let container = wrapper.querySelector('article')
  let inputs = {
    password: wrapper.querySelector('input[name="password"]'),
    domain: wrapper.querySelector('input[name="domain"]'),
    email: wrapper.querySelector('input[name="email"]')
  }
  let fields = {
    domain: wrapper.querySelector('[data-field="domain"]'),
    email: wrapper.querySelector('[data-field="email"]')
  }
  let buttons = {
    show: wrapper.querySelector('button.btn-show-info'),
    hide: wrapper.querySelector('button.btn-hide-info'),
    copy: wrapper.querySelector('button.btn-copy-info'),
    edit: wrapper.querySelector('button.btn-edit-info'),
    save: wrapper.querySelector('button.btn-save-info'),
    cancel: wrapper.querySelector('button.btn-cancel-info'),
    delete: wrapper.querySelector('button.btn-delete-info'),
    undo: wrapper.querySelector('button.btn-undo-delete')
  }
  let eventData = {
    id: content.id, container, inputs, fields, buttons, newEntry
  }

  buttons.show.addEventListener('click', () => eventHandlers.showInfoHandler(eventData))
  buttons.hide.addEventListener('click', () => eventHandlers.hideInfoHandler(eventData))
  buttons.copy.addEventListener('click', () => eventHandlers.copyToClipboardHandler(eventData))
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
  component.inputs.password = null
  component.inputs.domain = null
  component.inputs.email = null
  component.fields.domain = null
  component.fields.email = null
  component.buttons.show = null
  component.buttons.hide = null
  component.buttons.copy = null
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