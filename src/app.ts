// src/app.ts

import express, { Application } from 'express';
import dotenv from 'dotenv';
import userRoutes from './routes/user.routes'; // Importamos las rutas de usuario que creamos

dotenv.config();
console.log('DB_USER:', process.env.DB_USER); // Debería imprimir 'root' u otro valor


const app: Application = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---
// Este middleware permite que Express entienda el formato JSON en el cuerpo de las peticiones POST y PUT
app.use(express.json()); 

// --- Rutas ---
// Le decimos a la aplicación que use nuestras rutas de usuario para cualquier
// petición que empiece con '/api/usuarios'
app.use('/api/users', userRoutes);

// --- Iniciar el servidor ---
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});