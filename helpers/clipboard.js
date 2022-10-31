function copyTextToClipboard(text) {
  navigator.clipboard.writeText(text).then(function () {
  }, function (err) {
    console.error('Async: Could not copy text: ', err);
  });
}

module.exports = {
  copyTextToClipboard
}