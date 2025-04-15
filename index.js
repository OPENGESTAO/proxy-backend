// index.js
const express = require('express');
const fetch = require('node-fetch');
require('dotenv').config();
const app = express();
const PORT = 5000;

app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY;

// Verificar se as variáveis de ambiente estão definidas
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Erro: SUPABASE_URL ou SERVICE_ROLE_KEY não estão definidas no .env');
  process.exit(1);
}

console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? 'Definida' : 'Não definida');

// Rota para criar usuário com SERVICE_ROLE_KEY
app.post('/api/create-user', async (req, res) => {
  console.log('➡️  Requisição recebida no /api/create-user');
  console.log('Token recebido no proxy:', req.headers.authorization); // token do usuário
  console.log('Body recebido:', req.body); // <-- Adicione isso

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`, // aqui está o segredo!
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

// Rota para atualizar usuário usando o token do usuário logado (enviado do frontend)
app.post('/api/update-user', async (req, res) => {
  try {
    console.log('Recebendo requisição para /api/update-user:', req.body);

    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token ausente ou inválido' });
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/update-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader, // usa o token do usuário
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

app.listen(PORT, () => {
  console.log(`Proxy backend rodando em http://localhost:${PORT}`);
});
