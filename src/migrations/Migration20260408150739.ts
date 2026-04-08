import { Migration } from '@mikro-orm/migrations';

export class Migration20260408150739 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table \`club\` (\`id_club\` int not null auto_increment primary key, \`nombre\` varchar(100) not null, \`logo_url\` varchar(255) null) default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`club\` add unique \`nombre_UNIQUE\`(\`nombre\`);`);

    this.addSql(`create table \`estadio\` (\`id_estadio\` int not null auto_increment primary key, \`nombre\` varchar(100) not null, \`calle\` varchar(150) null, \`numero\` varchar(10) null, \`ciudad\` varchar(100) null) default character set utf8mb4 engine = InnoDB;`);

    this.addSql(`create table \`evento\` (\`id_evento\` int not null auto_increment primary key, \`fk_id_club_local\` int not null, \`fk_id_club_visitante\` int not null, \`fk_id_estadio_id_estadio\` int not null, \`fecha_hora\` datetime not null, \`torneo\` varchar(100) null, \`estado\` enum('Programado', 'En Venta', 'Finalizado', 'Cancelado') not null default 'Programado', \`solo_publico_local\` tinyint(1) not null default false) default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`evento\` add index \`fk_Eventos_ClubLocal_idx\`(\`fk_id_club_local\`);`);
    this.addSql(`alter table \`evento\` add index \`fk_Eventos_ClubVisitante_idx\`(\`fk_id_club_visitante\`);`);
    this.addSql(`alter table \`evento\` add index \`fk_Eventos_Estadios_idx\`(\`fk_id_estadio_id_estadio\`);`);

    this.addSql(`create table \`sector\` (\`id_sector\` int not null auto_increment primary key, \`fk_id_estadio_id_estadio\` int not null, \`nombre_sector\` varchar(100) not null, \`capacidad\` int unsigned null) default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`sector\` add index \`fk_Sectores_Estadios_idx\`(\`fk_id_estadio_id_estadio\`);`);

    this.addSql(`create table \`precio_evento_sector\` (\`fk_id_evento_id_sector\` int not null, \`fk_id_sector_id_sector\` int not null, \`precio\` numeric(10,2) not null, primary key (\`fk_id_evento_id_sector\`, \`fk_id_sector_id_sector\`)) default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`precio_evento_sector\` add index \`fk_Precios_Sectores_idx\`(\`fk_id_evento_id_sector\`);`);
    this.addSql(`alter table \`precio_evento_sector\` add index \`precio_evento_sector_fk_id_sector_id_sector_index\`(\`fk_id_sector_id_sector\`);`);

    this.addSql(`create table \`usuario\` (\`id_usuario\` int not null auto_increment primary key, \`dni\` varchar(20) not null, \`nombre\` varchar(100) not null, \`apellido\` varchar(100) not null, \`email\` varchar(255) not null, \`password\` varchar(255) not null, \`fecha_nacimiento\` date null, \`rol\` varchar(50) not null default 'user') default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`usuario\` add unique \`dni_UNIQUE\`(\`dni\`);`);
    this.addSql(`alter table \`usuario\` add unique \`email_UNIQUE\`(\`email\`);`);

    this.addSql(`create table \`compra\` (\`id_compra\` int not null auto_increment primary key, \`fk_usuario_id_usuario\` int not null, \`fecha_compra\` datetime not null default CURRENT_TIMESTAMP, \`monto_total\` numeric(10,2) not null, \`metodo_pago\` varchar(50) null, \`estado_pago\` varchar(50) not null default 'Pendiente', \`id_preferencia_mp\` varchar(100) null, \`id_pago_mp\` varchar(100) null) default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`compra\` add index \`fk_Compras_Usuarios_idx\`(\`fk_usuario_id_usuario\`);`);
    this.addSql(`alter table \`compra\` add unique \`compra_id_preferencia_mp_unique\`(\`id_preferencia_mp\`);`);
    this.addSql(`alter table \`compra\` add unique \`compra_id_pago_mp_unique\`(\`id_pago_mp\`);`);

    this.addSql(`create table \`entrada\` (\`id_entrada\` int not null auto_increment primary key, \`fk_id_sector_id_sector\` int not null, \`fk_id_evento_id_evento\` int not null, \`fk_id_compra_id_compra\` int null, \`fila\` varchar(10) null, \`asiento\` varchar(10) null, \`codigo_qr\` varchar(255) not null) default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`entrada\` add index \`fk_Entradas_Sectores_idx\`(\`fk_id_sector_id_sector\`);`);
    this.addSql(`alter table \`entrada\` add index \`fk_Entradas_Eventos_idx\`(\`fk_id_evento_id_evento\`);`);
    this.addSql(`alter table \`entrada\` add index \`fk_Entradas_Compras_idx\`(\`fk_id_compra_id_compra\`);`);
    this.addSql(`alter table \`entrada\` add unique \`codigo_qr_UNIQUE\`(\`codigo_qr\`);`);

    this.addSql(`alter table \`evento\` add constraint \`evento_fk_id_club_local_foreign\` foreign key (\`fk_id_club_local\`) references \`club\` (\`id_club\`) on update cascade;`);
    this.addSql(`alter table \`evento\` add constraint \`evento_fk_id_club_visitante_foreign\` foreign key (\`fk_id_club_visitante\`) references \`club\` (\`id_club\`) on update cascade;`);
    this.addSql(`alter table \`evento\` add constraint \`evento_fk_id_estadio_id_estadio_foreign\` foreign key (\`fk_id_estadio_id_estadio\`) references \`estadio\` (\`id_estadio\`) on update cascade;`);

    this.addSql(`alter table \`sector\` add constraint \`sector_fk_id_estadio_id_estadio_foreign\` foreign key (\`fk_id_estadio_id_estadio\`) references \`estadio\` (\`id_estadio\`) on update cascade;`);

    this.addSql(`alter table \`precio_evento_sector\` add constraint \`precio_evento_sector_fk_id_evento_id_sector_foreign\` foreign key (\`fk_id_evento_id_sector\`) references \`sector\` (\`id_sector\`) on update cascade on delete cascade;`);
    this.addSql(`alter table \`precio_evento_sector\` add constraint \`precio_evento_sector_fk_id_sector_id_sector_foreign\` foreign key (\`fk_id_sector_id_sector\`) references \`sector\` (\`id_sector\`) on update cascade;`);

    this.addSql(`alter table \`compra\` add constraint \`compra_fk_usuario_id_usuario_foreign\` foreign key (\`fk_usuario_id_usuario\`) references \`usuario\` (\`id_usuario\`) on update cascade;`);

    this.addSql(`alter table \`entrada\` add constraint \`entrada_fk_id_sector_id_sector_foreign\` foreign key (\`fk_id_sector_id_sector\`) references \`sector\` (\`id_sector\`) on update cascade;`);
    this.addSql(`alter table \`entrada\` add constraint \`entrada_fk_id_evento_id_evento_foreign\` foreign key (\`fk_id_evento_id_evento\`) references \`evento\` (\`id_evento\`) on update cascade;`);
    this.addSql(`alter table \`entrada\` add constraint \`entrada_fk_id_compra_id_compra_foreign\` foreign key (\`fk_id_compra_id_compra\`) references \`compra\` (\`id_compra\`) on update cascade on delete set null;`);
  }

}
