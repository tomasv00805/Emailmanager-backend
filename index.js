import express from 'express'
import cors from 'cors'
import Mail from 'Mail.js'
import User from 'User.js'
const app = express()
const port = process.env.PORT || 3000
app.use(cors())

app.use(express.json())

// Almacena los usuarios registrados y sus correos en arreglos
const users = [
  { username: 'tomi', password: '123' },
  { username: 'juli', password: '123' },
  { username: 'joaqui', password: '123' },
  { username: 'gabriel', password: '123' },
  { username: 'facu', password: '123' }
]
const sentEmails = []
const receivedEmails = []

// Ruta de registro de usuario
app.post('/register', (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' })
  }

  const existingUser = users.find((user) => user.username === username)

  if (existingUser) {
    return res.status(409).json({ error: 'El usuario ya existe' })
  }

  const newUser = {
    username,
    password
  }

  users.push(newUser)

  return res.json({ message: 'Registro exitoso' })
})

// Ruta de login de usuario
app.post('/login', (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' })
  }

  const user = users.find((user) => user.username === username)

  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
  }

  return res.json({ message: 'Inicio de sesión exitoso' })
})

// Ruta para enviar un correo
app.post('/send', (req, res) => {
  const { from, to, subject, body } = req.body

  if (!from || !to || !subject || !body) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' })
  }
  const recipients = to.split(' ')
  // recorrer arreglo recipients para verificar que todos los usuarios existen
  const allRecipientsExist = recipients.every((recipient) =>
    users.some((user) => user.username === recipient)
  )

  if (!allRecipientsExist) {
    return res.status(401).json({ error: 'Usuario no registrado' })
  }

  const newEmail = {
    from,
    to: recipients,
    subject,
    body
  }

  sentEmails.push(newEmail)
  receivedEmails.push(newEmail)

  return res.json({ message: 'Correo enviado' })
})

// Ruta para obtener la bandeja de entrada de un usuario
app.get('/inbox/:username', (req, res) => {
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
app.get('/sent/:username', (req, res) => {
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

app.get('/allmails', (req, res) => {
  return res.json(sentEmails)
})

app.get('/keep-alive', (req, res) => {
  res.send('Backend is alive!')
})

// Configurar el intervalo de tiempo para el mecanismo de "ping"
const keepAliveInterval = setInterval(() => {
  fetch('https://tu-backend.vercel.app/keep-alive')
    .then((response) => response.text())
    .then(console.log)
    .catch(console.error)
}, 300000) // Cada 5 minutos (300000 milisegundos)

// Detener el mecanismo de "ping" al cerrar la aplicación
process.on('SIGINT', () => {
  clearInterval(keepAliveInterval)
  process.exit()
})

app.listen(port, () => {
  console.log(`Servidor en ejecución en http://localhost:${port}`)
})
