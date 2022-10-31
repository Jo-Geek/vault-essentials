const os = require('os')
const fs = require('fs')
const path = require('path')
const crypto = require("crypto")
const encryption = require('../helpers/encryption')
const EventEmitter = require('events')

const EVENTS = {
  passwordsLoaded: 'onload:passwords',
  notesLoaded: 'onload:notes',
  cardsLoaded: 'onload:cards'
}

class Vault {
  // Contants
  #VAULT_HASH = null
  #VAULT_KEY = ''
  #VAULT_DIRECTORY = path.join(os.homedir(), 'vaultessentials', 'vault')
  #VAULT_FILE_PATH = path.join(this.#VAULT_DIRECTORY, 'vault.ve')
  #PASSWORDS_FILE_PATH = path.join(this.#VAULT_DIRECTORY, 'passwords.vault')
  #NOTES_FILE_PATH = path.join(this.#VAULT_DIRECTORY, 'notes.vault')
  #CARDS_FILE_PATH = path.join(this.#VAULT_DIRECTORY, 'cards.vault')
  #isNewVault = false
  #isPasswordVaultEmpty = false
  #isNotesVaultEmpty = false
  #isCardsVaultEmpty = false

  #passwords = []
  #notes = []
  #cards = []

  events

  constructor() {
    this.events = new EventEmitter()
  }

  //#region Vault

  #createNewVault() {
    fs.closeSync(fs.openSync(this.#VAULT_FILE_PATH, 'w'))
    this.#isNewVault = true
    fs.closeSync(fs.openSync(this.#PASSWORDS_FILE_PATH, 'w'))
    this.#isPasswordVaultEmpty = true
    fs.closeSync(fs.openSync(this.#NOTES_FILE_PATH, 'w'))
    this.#isNotesVaultEmpty = true
    fs.closeSync(fs.openSync(this.#CARDS_FILE_PATH, 'w'))
    this.#isCardsVaultEmpty = true
  }

  init() {
    this.checkVault()
  }

  checkVault() {
    try {
      if (!fs.existsSync(this.#VAULT_DIRECTORY)) {
        fs.mkdirSync(this.#VAULT_DIRECTORY, { recursive: true })
        this.#createNewVault()
      }
      else {
        if (!fs.existsSync(this.#VAULT_FILE_PATH)) {
          this.#createNewVault()
        } else {
          // Reead contents of vault hash
          let hashed = fs.readFileSync(this.#VAULT_FILE_PATH, { encoding: 'utf-8' })
          if (hashed && hashed.trim() !== '') {
            this.#VAULT_HASH = {
              hash: hashed.split('$')[0],
              salt: hashed.split('$')[1]
            }
          } else {
            this.#createNewVault()
          }
        }

        if (this.#isNewVault) return

        // Check if files exist, create if not
        if (!fs.existsSync(this.#PASSWORDS_FILE_PATH)) {
          fs.closeSync(fs.openSync(this.#PASSWORDS_FILE_PATH, 'w'))
          this.#isPasswordVaultEmpty = true
        }
        if (!fs.existsSync(this.#NOTES_FILE_PATH)) {
          fs.closeSync(fs.openSync(this.#NOTES_FILE_PATH, 'w'))
          this.#isNotesVaultEmpty = true
        }
        if (!fs.existsSync(this.#CARDS_FILE_PATH)) {
          fs.closeSync(fs.openSync(this.#CARDS_FILE_PATH, 'w'))
          this.#isCardsVaultEmpty = true
        }
      }
    } catch (error) {
      console.error(error)
      throw new Error('Vault initialization failed')
    }
  }

  updateVaultHash(key) {
    this.#VAULT_KEY = key
    let hashed = encryption.hash(key)
    fs.writeFileSync(this.#VAULT_FILE_PATH, `${hashed.hash}$${hashed.salt}`, { encoding: 'utf-8' })
    if (!this.#isNewVault) {
      if (!this.#isPasswordVaultEmpty) {
        this.savePasswords()
      }
    }
    this.#isNewVault = false
  }

  verifyKey(key) {
    if (encryption.verifyHash(this.#VAULT_HASH, key)) {
      this.#VAULT_KEY = key
      return true
    } else {
      return false
    }
  }

  isNew() {
    return this.#isNewVault
  }

  //#endregion Vault

  //#region Passwords
  loadPasswords() {
    return new Promise((resolve, reject) => {
      if (this.#isPasswordVaultEmpty) {
        resolve()
      }
      let encrypted = fs.readFileSync(this.#PASSWORDS_FILE_PATH, { encoding: 'utf-8' })
      encryption.decrypt(encrypted, this.#VAULT_KEY).then(decrypted => {
        this.#passwords = JSON.parse(decrypted).sort((a, b) => b.modified - a.modified)
        resolve()
      }).catch(err => {
        this.#isPasswordVaultEmpty = true
        resolve()
      })
    })
  }

  getPasswords() {
    return this.#passwords
  }

  getPassword(id) {
    return this.#passwords.find(password => password.id === id)
  }

  newEmptyPassword() {
    this.#passwords.push({
      id: crypto.randomUUID(),
      domain: '',
      email: '',
      password: '',
      created: new Date().getTime(),
      modified: new Date().getTime()
    })
  }

  newPassword() {
    // if (!passwordEntry.id) {
    //   passwordEntry.id = crypto.randomUUID()
    // }
    // if (!passwordEntry.created) {
    //   passwordEntry.created = new Date().getTime()
    // }
    // if (!passwordEntry.modified) {
    //   passwordEntry.modified = passwordEntry.created
    // }\
    let newPassword = {
      id: crypto.randomUUID(),
      domain: '',
      email: '',
      password: '',
      created: new Date().getTime(),
      modified: new Date().getTime()
    }
    this.#passwords.push(newPassword)
    return newPassword
  }

  savePasswords() {
    let saveString = JSON.stringify(this.#passwords)
    encryption.encrypt(saveString, this.#VAULT_KEY).then(encrypted => {
      fs.writeFileSync(this.#PASSWORDS_FILE_PATH, encrypted, { encoding: 'utf-8' })
      this.#isPasswordVaultEmpty = false
    })
  }

  deletePassword(id) {
    this.removePasswordFromMemory(id)
    this.savePasswords()
  }

  removePasswordFromMemory(id) {
    this.#passwords = this.#passwords.filter(x => x.id !== id)
  }

  getPasswordIDsForSearch(key) {
    key = key.toLowerCase() || ''
    if (key.length > 0) {
      return this.#passwords.filter(x => x.domain.toLowerCase().includes(key) || x.email.toLowerCase().includes(key)).map(y => y.id)
    } else {
      return this.#passwords.map(y => y.id)
    }
  }

  //#endregion

  //#region Notes

  loadNotes() {
    return new Promise((resolve, reject) => {
      if (this.#isNotesVaultEmpty) {
        resolve()
      }
      let encrypted = fs.readFileSync(this.#NOTES_FILE_PATH, { encoding: 'utf-8' })
      encryption.decrypt(encrypted, this.#VAULT_KEY).then(decrypted => {
        this.#notes = JSON.parse(decrypted).sort((a, b) => b.modified - a.modified)
        resolve()
      }).catch(err => {
        this.#isNotesVaultEmpty = true
        resolve()
      })
    })
  }


  getNotes() {
    return this.#notes
  }

  getNote(id) {
    return this.#notes.find(note => note.id === id)
  }

  newEmptynote() {
    this.#notes.push({
      id: crypto.randomUUID(),
      content: '',
      created: new Date().getTime(),
      modified: new Date().getTime()
    })
  }

  newNote() {
    let newNote = {
      id: crypto.randomUUID(),
      content: '',
      created: new Date().getTime(),
      modified: new Date().getTime()
    }
    this.#notes.push(newNote)
    return newNote
  }

  saveNotes() {
    let saveString = JSON.stringify(this.#notes)
    encryption.encrypt(saveString, this.#VAULT_KEY).then(encrypted => {
      fs.writeFileSync(this.#NOTES_FILE_PATH, encrypted, { encoding: 'utf-8' })
      this.#isNotesVaultEmpty = false
    })
  }

  deletenote(id) {
    this.removeNoteFromMemory(id)
    this.savenotes()
  }

  removeNoteFromMemory(id) {
    this.#notes = this.#notes.filter(x => x.id !== id)
  }

  getNoteIDsForSearch(key) {
    key = key.toLowerCase() || ''
    if (key.length > 0) {
      return this.#notes.filter(x => x.content.toLowerCase().includes(key)).map(y => y.id)
    } else {
      return this.#notes.map(y => y.id)
    }
  }

  //#endregion Notes

  //#region Cards

  loadCards() {
    return new Promise((resolve, reject) => {
      if (this.#isCardsVaultEmpty) {
        resolve()
      }
      let encrypted = fs.readFileSync(this.#CARDS_FILE_PATH, { encoding: 'utf-8' })
      encryption.decrypt(encrypted, this.#VAULT_KEY).then(decrypted => {
        this.#cards = JSON.parse(decrypted).sort((a, b) => b.modified - a.modified)
        resolve()
      }).catch(err => {
        this.#isCardsVaultEmpty = true
        resolve()
      })
    })
  }


  getCards() {
    return this.#cards
  }

  getCard(id) {
    return this.#cards.find(card => card.id === id)
  }

  newCard() {
    let newCard = {
      id: crypto.randomUUID(),
      number: '',
      expiry: '',
      name: '',
      cvv: '',
      created: new Date().getTime(),
      modified: new Date().getTime()
    }
    this.#cards.push(newCard)
    return newCard
  }

  saveCards() {
    let saveString = JSON.stringify(this.#cards)
    encryption.encrypt(saveString, this.#VAULT_KEY).then(encrypted => {
      fs.writeFileSync(this.#CARDS_FILE_PATH, encrypted, { encoding: 'utf-8' })
      this.#isCardsVaultEmpty = false
    })
  }

  deletecard(id) {
    this.removeCardFromMemory(id)
    this.savecards()
  }

  removeCardFromMemory(id) {
    this.#cards = this.#cards.filter(x => x.id !== id)
  }

  getCardIDsForSearch(key) {
    key = key.toLowerCase() || ''
    if (key.length > 0) {
      return this.#cards.filter(x => x.number.includes(key) || x.name.toLowerCase().includes(key)).map(y => y.id)
    } else {
      return this.#cards.map(y => y.id)
    }
  }

  //#endregion Cards
}


module.exports = { Vault, VaultEvents: EVENTS }