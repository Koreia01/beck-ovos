const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const produtosRoutes = require("./routes/produtos");
const authRoutes = require("./routes/auth");
const pedidosRoutes = require("./routes/pedidos");
const pagamentosRoutes = require("./routes/pagamentos");

app.use("/api", produtosRoutes);
app.use("/api", authRoutes);
app.use("/api", pedidosRoutes);
app.use("/api", pagamentosRoutes);

app.get("/", (req, res) => {
  res.send("Backend rodando 🚀");
});

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});