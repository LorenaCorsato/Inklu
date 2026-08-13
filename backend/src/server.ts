import express from 'express';

const app = express();
const port = 3000;

// Permite que o servidor entenda JSON
app.use(express.json());

// Uma rota de teste para ver se está funcionando
app.get('/', (req, res) => {
  res.send('Servidor do Inklu rodando com sucesso! 🚀');
});

// Liga o servidor na porta 3000
app.listen(port, () => {
  console.log(`✅ Servidor backend iniciado em http://localhost:${port}`);
});