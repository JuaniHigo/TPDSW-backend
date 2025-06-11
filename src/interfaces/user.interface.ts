// src/interfaces/user.interface.ts

export interface User {
  id_usuario?: number;
  dni: string;
  nombre: string;
  apellido: string;
  email:string;
  password?: string; // Es opcional porque no queremos devolverlo en las consultas
  fecha_nacimiento?: Date;
}