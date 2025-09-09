// src/repositories/CompraRepository.ts
import { EntityRepository } from "@mikro-orm/mysql";
import { Compra, EstadoPago } from "../entities/Compra.entity";

export class CompraRepository extends EntityRepository<Compra> {
  async findByUsuario(usuarioId: number): Promise<Compra[]> {
    return this.find(
      { fkIdUsuario: usuarioId },
      {
        populate: ["entradas", "entradas.evento", "entradas.sector"],
      }
    );
  }

  async findWithEntradas(id: number): Promise<Compra | null> {
    return this.findOne(
      { id },
      {
        populate: ["entradas", "entradas.evento", "entradas.sector", "usuario"],
      }
    );
  }

  async findByEstado(estado: EstadoPago): Promise<Compra[]> {
    return this.find({ estadoPago: estado });
  }

  async findByPreferenciaMP(preferenciaId: string): Promise<Compra | null> {
    return this.findOne({ idPreferenciaMP: preferenciaId });
  }
}
