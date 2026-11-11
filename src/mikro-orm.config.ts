import 'reflect-metadata';
import 'dotenv/config';
import { defineConfig } from '@mikro-orm/mysql';
import { Migrator } from '@mikro-orm/migrations';
import { Club } from './entities/Club';
import { Estadio } from './entities/Estadio';
import { Sector } from './entities/Sector';
import { Evento } from './entities/Evento';
import { PrecioEventoSector } from './entities/PrecioEventoSector';
import { Compra } from './entities/Compra';
import { Entrada } from './entities/Entrada';
import { Usuario } from './entities/Usuario';
import { Pago } from './entities/Pago';
export default defineConfig({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  dbName: process.env.DB_NAME,
  entities: [
    Club,
    Estadio,
    Sector,
    Evento,
    PrecioEventoSector,
    Compra,
    Entrada,
    Usuario,
    Pago,
  ],
  extensions: [Migrator],
  timezone: 'Z',
  migrations: {
    path: 'dist/migrations',
    pathTs: 'src/migrations',
    glob: '!(*.d).{js,ts}',
    transactional: false,
    allOrNothing: false,
  },
});
