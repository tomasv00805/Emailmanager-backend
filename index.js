import express from 'express';
import cors from 'cors';
import User from './User.js';
import Email from './Email.js';
const app = express();
const port = process.env.PORT || 3000;
app.use(cors())

app.use(express.json());


// Almacena los usuarios registrados y sus correos en arreglos
const users = [];
const sentEmails = [];
const receivedEmails = [];

// Ruta de registro de usuario
app.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  const existingUser = users.find(user => user.username === username);

  if (existingUser) {
    return res.status(409).json({ error: 'El usuario ya existe' });
  }

  const newUser = new User(username, password);

  users.push(newUser);

  return res.json({ message: 'Registro exitoso' });
});

// Ruta de login de usuario
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  const user = users.find(user => user.username === username);

  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }

  return res.json({ message: 'Inicio de sesión exitoso' });
  
});

// Ruta para enviar un correo
app.post('/send', (req, res) => {
  const { from, to, subject, body } = req.body;
  
  if (!from || !to || !subject || !body) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }
  
  const recipients = to.split(' ');
  const recipientIds = [];
  
  // Verificar que todos los destinatarios (ya sea por username o email) existen
  recipients.forEach(recipient => {
      const user = users.find(user => user.username === recipient || user.email === recipient);
      if (!user) {
          return res.status(401).json({ error: 'Usuario no registrado: ' + recipient });
      }
      recipientIds.push(user.username);
  });
  
  const newEmail = new Email(from, recipientIds, subject, body);
  
  sentEmails.push(newEmail);
  receivedEmails.push(newEmail);
  
  return res.json({ message: 'Correo enviado' });
});

// Ruta para obtener la bandeja de entrada de un usuario
app.get('/inbox/:username', (req, res) => {

    const { username } = req.params;
    
    if (!username) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    
    const user = users.find(user => user.username === username);
    
    if (!user) {
        return res.status(401).json({ error: 'Usuario no registrado' });
    }
    
    const inbox = receivedEmails.filter(email => email.to.includes(username));
    
    return res.json(inbox);
});

// Ruta para obtener la lista de correos enviados por un usuario
app.get('/sent/:username', (req, res) => {
  
    const { username } = req.params;
    
    if (!username) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    
    const user = users.find(user => user.username === username);
    
    if (!user) {
        return res.status(401).json({ error: 'Usuario no registrado' });
    }
    
    const sent = sentEmails.filter(email => email.from === username);
    
    return res.json(sent);
});

app.get( '/allmails', (req, res) => {
    return res.json(sentEmails);
});


app.listen(port, () => {
  console.log(`Servidor en ejecución en http://localhost:${port}`);
});