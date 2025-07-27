// src/app.ts

import express, { Application } from 'express';
import dotenv from 'dotenv';
import userRoutes from './routes/user.routes'; // Importamos las rutas de usuario que creamos
import compression from 'compression';
import cors from 'cors'; 

import sociosRoutes from './routes/socios.routes'; 
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---
// Este middleware permite que Express entienda el formato JSON en el cuerpo de las peticiones POST y PUT
app.use(express.json()); 
app.use(compression());
app.use(cors());        

// --- Rutas ---
// Le decimos a la aplicación que use nuestras rutas de usuario para cualquier
// petición que empiece con '/api/users'
app.use('/api/users', userRoutes);
app.use('/api/socios', sociosRoutes);

// --- Iniciar el servidor ---
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});