const express = require("express");
const router = express.Router();

let usuarios = [];

// Cadastro
router.post("/cadastro", (req, res) => {
  const { nome, email, cpf, telefone, senha } = req.body;

  if (!nome || !email || !cpf || !telefone || !senha) {
    return res.status(400).json({ erro: "Preencha todos os campos obrigatórios." });
  }

  const emailJaExiste = usuarios.find((u) => u.email === email);
  if (emailJaExiste) {
    return res.status(400).json({ erro: "Este e-mail já está cadastrado." });
  }

  const cpfJaExiste = usuarios.find((u) => u.cpf === cpf);
  if (cpfJaExiste) {
    return res.status(400).json({ erro: "Este CPF já está cadastrado." });
  }

  const novoUsuario = {
    id: usuarios.length + 1,
    nome,
    email,
    cpf,
    telefone,
    senha
  };

  usuarios.push(novoUsuario);

  res.status(201).json({
    mensagem: "Cadastro realizado com sucesso!",
    usuario: {
      id: novoUsuario.id,
      nome: novoUsuario.nome,
      email: novoUsuario.email
    }
  });
});

// Login
router.post("/login", (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: "Informe e-mail e senha." });
  }

  const usuario = usuarios.find((u) => u.email === email && u.senha === senha);

  if (!usuario) {
    return res.status(401).json({ erro: "E-mail ou senha inválidos." });
  }

  res.json({
    mensagem: "Login realizado com sucesso!",
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email
    }
  });
});

module.exports = router;