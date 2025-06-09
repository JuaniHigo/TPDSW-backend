const express = require('express');
const app = express();
const usuariosRouter = require('./routes/usuarios');

app.use(express.json()); // para parsear JSON en el body

app.use('/usuarios', usuariosRouter);

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
