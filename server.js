const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const pedidosRoutes = require("./routes/pedidos");
const authRoutes = require("./routes/auth");
const pagamentoRoutes = require("./routes/pagamentos");
const produtosRoutes = require("./routes/produtos");

app.use("/api", pedidosRoutes);
app.use("/api", authRoutes);
app.use("/api", pagamentoRoutes);
app.use("/api", produtosRoutes);

app.get("/", (req, res) => {
  res.send("Backend rodando 🚀");
});

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

console.log("SUPABASE URL:", process.env.SUPABASE_URL);
console.log("SUPABASE KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "OK" : "NÃO CARREGOU");