import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import compression from 'compression';

// Importación de todas las rutas
import userRoutes from './routes/user.routes';
import sociosRoutes from './routes/socios.routes'; 
import clubesRoutes from './routes/clubes.routes';
import estadiosRoutes from './routes/estadios.routes';
import eventosRoutes from './routes/eventos.routes';
import authRoutes from './routes/auth.routes'; 
import tipoEntradaRoutes from './routes/tipoEntrada.routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(compression());
app.use(cors());
app.use(express.json()); 

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/socios', sociosRoutes); 
app.use('/api/clubes', clubesRoutes);
app.use('/api/estadios', estadiosRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/tipoEntrada', tipoEntradaRoutes);

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});