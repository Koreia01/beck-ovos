 const express = require("express");
const router = express.Router();

let pedidos = [];

// Criar pedido simples
router.post("/pedido", (req, res) => {
  const { nome, produto, endereco } = req.body;

  if (!nome || !produto) {
    return res.status(400).json({ erro: "Dados incompletos" });
  }

  const novoPedido = {
    id: pedidos.length + 1,
    nome,
    produto,
    endereco
  };

  pedidos.push(novoPedido);

  res.json({
    mensagem: "Pedido criado!",
    pedido: novoPedido
  });
});

// Listar pedidos
router.get("/pedidos", (req, res) => {
  res.json(pedidos);
});

module.exports = router;