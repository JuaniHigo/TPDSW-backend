// src/middlewares/auth.middleware.ts
import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { Database } from "../config/database"; // <-- Importamos Database
import { User } from "../entities/User.entity"; // <-- Importamos la Entidad

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
        // Devolvemos el objeto de usuario (sin password, gracias a toJSON)
        return done(null, user.toJSON());
      }
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  })
);

export const isAuth = passport.authenticate("jwt", { session: false });
