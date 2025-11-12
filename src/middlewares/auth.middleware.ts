import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { orm } from "../app";
import { Usuario } from "../entities/Usuario";

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET as string,
};

passport.use(
  new JwtStrategy(opts, async (jwt_payload, done) => {
    // --- NUESTROS ESPÍAS ---
    console.log("\n--- 🕵️‍♂️ (DEBUG) MIDDLEWARE 'isAuth' (Passport) ---");
    console.log("PAYLOAD RECIBIDO DEL TOKEN:", jwt_payload);
    // --- FIN ESPÍAS ---

    try {
      const em = orm.em.fork();
      const user = await em
        .getRepository(Usuario)
        .findOne({ idUsuario: jwt_payload.idUsuario }); // La corrección de camelCase

      if (user) {
        // --- MÁS ESPÍAS ---
        console.log("ÉXITO: Usuario encontrado en BD:", user.email);
        // --- FIN ESPÍAS ---
        return done(null, user); // ✅ El usuario existe
      }

      // --- MÁS ESPÍAS ---
      console.log("ERROR: Usuario del token no encontrado en BD.");
      // --- FIN ESPÍAS ---
      return done(null, false); // ❌ El usuario no existe
    } catch (error) {
      // --- MÁS ESPÍAS ---
      console.log("ERROR CATASTRÓFICO EN PASSPORT:", error);
      // --- FIN ESPÍAS ---
      return done(error, false);
    }
  })
);

export const isAuth = passport.authenticate("jwt", { session: false });
