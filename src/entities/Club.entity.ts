// src/entities/Club.entity.ts
import {
  Entity,
  PrimaryKey,
  Property,
  Unique,
  OneToMany,
  Collection,
} from "@mikro-orm/core";
import { Socio } from "./Socio.entity.js";
import { Evento } from "./Evento.entity.js";
import { ClubRepository } from "../repositories/ClubRepository.js";

@Entity({ tableName: "clubes", repository: () => ClubRepository })
export class Club {
  @PrimaryKey({ fieldName: "id_club" })
  id!: number;

  @Property({ length: 100 })
  @Unique()
  nombre!: string;

  @Property({ length: 10 })
  @Unique()
  prefijo!: string;

  @Property({ fieldName: "logo_url", length: 255, nullable: true })
  logoUrl?: string;

  @Property({ fieldName: "created_at", defaultRaw: "CURRENT_TIMESTAMP" })
  createdAt: Date = new Date();

  @Property({
    fieldName: "updated_at",
    defaultRaw: "CURRENT_TIMESTAMP",
    onUpdate: () => new Date(),
  })
  updatedAt: Date = new Date();

  // Relaciones
  @OneToMany(() => Socio, (socio) => socio.club)
  socios = new Collection<Socio>(this);

  @OneToMany(() => Evento, (evento) => evento.clubLocal)
  eventosLocales = new Collection<Evento>(this);

  @OneToMany(() => Evento, (evento) => evento.clubVisitante)
  eventosVisitante = new Collection<Evento>(this);

  constructor(data: Partial<Club> = {}) {
    Object.assign(this, data);
  }

  // Método helper para generar próximo número de socio
  async getProximoNumeroSocio(): Promise<string> {
    // Advertencia: this.socios.length solo funciona si la colección está cargada.
    // Es más seguro llamar a un método del repositorio.
    const totalSocios = this.socios.isInitialized() ? this.socios.length : 0;
    return `${this.prefijo}-${totalSocios + 1}`;
  }
}
