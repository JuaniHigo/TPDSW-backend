// src/middlewares/auth.middleware.ts
import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { Database } from "../config/database.js"; // <-- Importamos Database
import { User } from "../entities/User.entity.js"; // <-- Importamos la Entidad
import { wrap } from "@mikro-orm/core";


const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  // Lanzamos un ERROR REAL que SÍ se puede leer
  throw new Error(
    "⛔ Variable de entorno JWT_SECRET no definida. Revisa tu archivo .env"
  );
}

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET as string,
};

passport.use(
  new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
      // Usamos el Entity Manager en lugar de 'pool'
      const em = Database.getEM().fork();
      const user = await em.findOne(User, { id: jwt_payload.id_usuario });

      if (user) {
        // Devolvemos el objeto de usuario
        // --- CORRECCIÓN ---
        // Se eliminó el punto y coma extra
        return done(null, wrap(user).toObject());
      }
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  })
);

export const isAuth = passport.authenticate("jwt", { session: false });