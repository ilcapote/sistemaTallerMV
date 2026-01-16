import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const parseFechaToUtcDate = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    return new Date(Date.UTC(year, month, day));
  }
  return new Date(value);
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cliente = searchParams.get("cliente")?.trim();
    const patente = searchParams.get("patente")?.trim();
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");

    const andFilters: any[] = [];

    if (cliente) {
      andFilters.push({
        cliente: {
          OR: [
            { nombre: { contains: cliente } },
            { telefono: { contains: cliente } },
          ],
        },
      });
    }

    if (patente) {
      andFilters.push({
        vehiculo: {
          patente: { contains: patente.toUpperCase() },
        },
      });
    }

    if (desde || hasta) {
      const startDate = desde ? parseFechaToUtcDate(desde) : new Date(0);
      const endDateBase = hasta ? parseFechaToUtcDate(hasta) : new Date();
      const endDate = new Date(
        Date.UTC(
          endDateBase.getUTCFullYear(),
          endDateBase.getUTCMonth(),
          endDateBase.getUTCDate(),
          23,
          59,
          59,
          999
        )
      );
      andFilters.push({
        fecha: {
          gte: startDate,
          lte: endDate,
        },
      });
    }

    const where = andFilters.length > 0 ? { AND: andFilters } : {};

    const turnos = await prisma.turno.findMany({
      where,
      include: {
        cliente: { select: { nombre: true, telefono: true } },
        vehiculo: { select: { patente: true, marca: true, modelo: true } },
        trabajos: true,
      },
      orderBy: [{ fecha: "desc" }, { horaInicio: "asc" }],
    });

    return NextResponse.json(turnos);
  } catch (error) {
    console.error("Error fetching reportes:", error);
    return NextResponse.json({ error: "Error fetching reportes" }, { status: 500 });
  }
}
