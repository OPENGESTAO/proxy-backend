// index.js
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 5000;

app.use(express.json());

// Configuração segura de CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ Origin não permitida: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));


// Variáveis do Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY;

// Verificar se as variáveis estão definidas
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Erro: SUPABASE_URL ou SERVICE_ROLE_KEY não estão definidas no .env');
  process.exit(1);
}

console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? 'Definida' : 'Não definida');

// Função para criar usuários (usa chave secreta)
app.post('/api/create-user', async (req, res) => {
  console.log('➡️  Requisição recebida no /api/create-user');
  console.log('Token recebido no proxy:', req.headers.authorization);
  console.log('Body recebido:', req.body);

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('Erro ao processar /api/create-user:', err);
    res.status(500).json({ error: `Erro no proxy: ${err.message}` });
  }
});

// Função para atualizar usuários (usa token do usuário logado)
app.post('/api/update-user', async (req, res) => {
  console.log('➡️  Requisição recebida no /api/update-user');
  console.log('Token recebido no proxy:', req.headers.authorization);
  console.log('Body recebido:', req.body);

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token ausente ou inválido' });
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/update-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    console.log('Resposta do Supabase:', data);

    res.status(response.status).json(data);
  } catch (err) {
    console.error('Erro ao processar /api/update-user:', err);
    res.status(500).json({ error: `Erro no proxy: ${err.message}` });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Proxy backend rodando em http://localhost:${PORT}`);
});
