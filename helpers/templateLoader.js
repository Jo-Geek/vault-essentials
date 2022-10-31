function loadModuleTemplate(template) {
  return new Promise((resolve, reject) => {
    fetch(template.css)
      .then(res => res.text())
      .then(css => {
        fetch(template.html)
          .then(res => res.text())
          .then(html => {
            resolve({ css, html })
          })
      })
  })
}

function loadHtmlTemplate(path) {
  return fetch(path).then(res => res.text())
}

module.exports = {
  loadModuleTemplate, loadHtmlTemplate
}