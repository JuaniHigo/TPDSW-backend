import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import pool from '../config/database';

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET as string
};

passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
        try {
            // --- ESTA ES LA LÍNEA CORREGIDA ---
            // Cambiamos 'Usuarios' a 'usuarios' para que sea consistente
            const [rows]: any = await pool.query("SELECT * FROM usuarios WHERE id_usuario = ?", [jwt_payload.id_usuario]);
            // ------------------------------------

            if (rows.length > 0) {
                return done(null, rows[0]);
            }
            return done(null, false);
        } catch (error) {
            return done(error, false);
        }
    })
);

export const isAuth = passport.authenticate('jwt', { session: false });