import { VercelRequest, VercelResponse } from '@vercel/node'
import cors from 'cors'
import Mail from './Mail.js'
import User from './User.js'

const express = require('express')
const app = express()
app.use(cors())
app.use(express.json())

// Almacena los usuarios registrados y sus correos en arreglos
const users = [
  new User('tomi', 'tomi@gmail.com', '123'),
  new User('juli', 'juli@gmail.com', '123'),
  new User('joaqui', 'joaqui@gmail.com', '123'),
  new User('gabriel', 'gabriel@gmail.com', '123'),
  new User('facu', 'facu@gmail.com', '123')
]
const sentEmails = []
const receivedEmails = []

// Ruta de registro de usuario
app.post('/api/register', (req, res) => {
  const { username, email, password } = req.body

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' })
  }

  const existingUser = users.find(
    (user) => user.username === username || user.email === email
  )

  if (existingUser) {
    return res.status(409).json({ error: 'El usuario ya existe' })
  }

  const newUser = new User(username, email, password)

  users.push(newUser)

  return res.json({ message: 'Registro exitoso' })
})

// Ruta de login de usuario
app.post('/api/login', (req, res) => {
  const { identifier, password } = req.body

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' })
  }

  const user = users.find(
    (user) => user.username === identifier || user.email === identifier
  )

  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
  }

  return res.json({ message: 'Inicio de sesión exitoso' })
})

// Ruta para enviar un correo
app.post('/api/send', (req, res) => {
  const { from, to, subject, body } = req.body

  if (!from || !to || !subject || !body) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' })
  }

  const recipients = to.split(' ')
  const recipientIds = []

  // Verificar que todos los destinatarios (ya sea por username o email) existen
  recipients.forEach((recipient) => {
    const user = users.find(
      (user) => user.username === recipient || user.email === recipient
    )
    if (!user) {
      return res
        .status(401)
        .json({ error: 'Usuario no registrado: ' + recipient })
    }
    recipientIds.push(user.username)
  })

  const newEmail = new Mail(from, recipientIds, subject, body)

  sentEmails.push(newEmail)
  receivedEmails.push(newEmail)

  return res.json({ message: 'Correo enviado' })
})

// Ruta para obtener la bandeja de entrada de un usuario
app.get('/api/inbox/:username', (req, res) => {
  const { username } = req.params

  if (!username) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' })
  }

  const user = users.find((user) => user.username === username)

  if (!user) {
    return res.status(401).json({ error: 'Usuario no registrado' })
  }

  const inbox = receivedEmails.filter((email) => email.to.includes(username))

  return res.json(inbox)
})

// Ruta para obtener la lista de correos enviados por un usuario
app.get('/api/sent/:username', (req, res) => {
  const { username } = req.params

  if (!username) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' })
  }

  const user = users.find((user) => user.username === username)

  if (!user) {
    return res.status(401).json({ error: 'Usuario no registrado' })
  }

  const sent = sentEmails.filter((email) => email.from === username)

  return res.json(sent)
})

app.get('/api/allmails', (req, res) => {
  return res.json(sentEmails)
})

module.exports = (req, res) => {
  if (req.method === 'OPTIONS') {
    // Pre-flight request
    res.status(200).end()
    return
  }

  app(req, res)
}
