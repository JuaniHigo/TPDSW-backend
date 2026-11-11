import { MikroORM } from '@mikro-orm/mysql';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import config from '../mikro-orm.config';
import { Usuario } from '../entities/Usuario';
async function main() {
  const input = z
    .object({
      ADMIN_EMAIL: z.string().email(),
      ADMIN_PASSWORD: z.string().min(8).max(72),
      ADMIN_DNI: z.string().regex(/^\d{7,8}$/),
      ADMIN_NOMBRE: z.string().min(2).default('Admin'),
      ADMIN_APELLIDO: z.string().min(2).default('Kicket'),
    })
    .safeParse(process.env);
  if (!input.success)
    throw new Error(
      'Definí ADMIN_EMAIL, ADMIN_PASSWORD (8–72 caracteres) y ADMIN_DNI; nombre y apellido son opcionales.',
    );
  const data = input.data,
    orm = await MikroORM.init(config);
  try {
    const em = orm.em.fork();
    if (
      await em.count(Usuario, {
        $or: [
          { email: data.ADMIN_EMAIL.toLowerCase() },
          { dni: data.ADMIN_DNI },
        ],
      })
    )
      throw new Error(
        'El email o DNI ya existe; no se modificaron sus permisos.',
      );
    await em.persistAndFlush(
      em.create(Usuario, {
        email: data.ADMIN_EMAIL.toLowerCase(),
        dni: data.ADMIN_DNI,
        nombre: data.ADMIN_NOMBRE,
        apellido: data.ADMIN_APELLIDO,
        password: await bcrypt.hash(data.ADMIN_PASSWORD, 12),
        rol: 'admin',
      }),
    );
    console.log('Administrador creado');
  } finally {
    await orm.close(true);
  }
}
main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : 'No se pudo crear el administrador',
  );
  process.exitCode = 1;
});
