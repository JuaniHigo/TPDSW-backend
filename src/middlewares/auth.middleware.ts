import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { orm } from "../app";
import { Usuarios } from "../entities/Usuarios";

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET as string,
};

passport.use(
  new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
      // Usamos un 'fork' del Entity Manager para asegurar un contexto aislado
      // Esto es CRÍTICO en middlewares y procesos de fondo
      const em = orm.em.fork();
      const user = await em
        .getRepository(Usuarios)
        .findOne({ idUsuario: jwt_payload.id_usuario });

      if (user) {
        return done(null, user); // El usuario existe
      }
      return done(null, false); // El usuario no existe
    } catch (error) {
      return done(error, false);
    }
  })
);
export const isAuth = passport.authenticate("jwt", { session: false });
