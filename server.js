const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const pedidosRoutes = require("./routes/pedidos");
app.use("/api", pedidosRoutes);



app.get("/", (req, res) => {
  res.send("Backend rodando 🚀");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});