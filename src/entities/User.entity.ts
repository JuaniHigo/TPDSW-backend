import { Entity, PrimaryKey, Property, Unique, OneToMany, Collection, Enum } from "@mikro-orm/core";
import { Socio } from "./Socio.entity";
import { Compra } from "./Compra.entity";
import { UserRepository } from "../repositories/UserRepository";

export enum UserRole {
    USER = 'user',
    ADMIN = 'admin',
}

@Entity({ tableName: "usuarios", repository: () => UserRepository }) // <-- Añadir repo
export class User {
    @PrimaryKey({fieldName: "id_usuario"})
    id!: number;

    @Property({length:8})
    @Unique()
    dni!: string;

    @Property({length: 100})
    nombre!: string;    

    @Property({length: 100})
    apellidos!: string; 

    @Property({ length: 150 })
    @Unique()
    email!: string;

    @Property({ length: 255, hidden: true }) // hidden evita que se incluya en serialización JSON
    password!: string;

    fechaNacimiento?: Date;
    @Property({ fieldName: 'fecha_nacimiento', nullable: true })

    @Enum(items: () => UserRole, default: UserRole.USER)
    role: UserRole = UserRole.USER;

    @Property({fieldName: "fecha_creacion", defaultRaw: 'CURRENT_TIMESTAMP'})
    fechaCreacion: Date=new Date();
    
    @Property({fieldName: "fecha_actualizacion", defaultRaw: 'CURRENT_TIMESTAMP', onUpdate:()=>new Date()})
    fechaActualizacion: Date=new Date();

//relaciones

    @OneToMany(()=>Socio, socio=>socio.usuario)
    socios = new Collection<Socio>(this);

    @OneToMany(() => Compra, compra => compra.usuario)
    compras = new Collection<Compra>(this);

    constructor(data: Partial<User>={}){
        Object.assign(this, data);
    }

// Metodos Helper
    
   get nombreCompleto():string{
        // Corregido: 'apellidos' en lugar de 'apellido'
        return `${this.nombre} ${this.apellidos}`;

    toJSON(){
        const o = wrap(this).toObject(); // Usar wrap() de MikroORM
        delete o.password;
        return o;
    }
}