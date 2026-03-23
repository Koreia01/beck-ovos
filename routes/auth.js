const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const supabaseAdmin = require("../lib/supabase");

const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

router.post("/cadastro", async (req, res) => {
  try {
    const { nome, email, cpf, telefone, senha } = req.body;

    if (!nome || !email || !cpf || !telefone || !senha) {
      return res.status(400).json({ erro: "Preencha todos os campos obrigatórios." });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true
    });

    if (authError) {
      return res.status(400).json({ erro: authError.message });
    }

    const userId = authData.user.id;

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert([
        {
          id: userId,
          full_name: nome,
          email,
          cpf,
          phone: telefone
        }
      ]);

    if (profileError) {
      return res.status(400).json({ erro: profileError.message });
    }

    return res.status(201).json({
      mensagem: "Cadastro realizado com sucesso!",
      usuario: {
        id: userId,
        nome,
        email
      }
    });
  } catch (error) {
    return res.status(500).json({ erro: "Erro interno no cadastro." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: "Informe e-mail e senha." });
    }

    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password: senha
    });

    if (error) {
      return res.status(401).json({ erro: "E-mail ou senha inválidos." });
    }

    return res.json({
      mensagem: "Login realizado com sucesso!",
      session: data.session,
      usuario: data.user
    });
  } catch (error) {
    return res.status(500).json({ erro: "Erro interno no login." });
  }
});

module.exports = router;