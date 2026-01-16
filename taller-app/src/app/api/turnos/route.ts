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
    const fecha = searchParams.get("fecha");
    const mes = searchParams.get("mes");
    const anio = searchParams.get("anio");

    let where = {};

    if (fecha) {
      const fechaDate = parseFechaToUtcDate(fecha);
      const startOfDay = new Date(
        Date.UTC(fechaDate.getUTCFullYear(), fechaDate.getUTCMonth(), fechaDate.getUTCDate(), 0, 0, 0, 0)
      );
      const endOfDay = new Date(
        Date.UTC(fechaDate.getUTCFullYear(), fechaDate.getUTCMonth(), fechaDate.getUTCDate(), 23, 59, 59, 999)
      );
      where = {
        fecha: {
          gte: startOfDay,
          lte: endOfDay,
        },
      };
    } else if (mes && anio) {
      const year = parseInt(anio);
      const month = parseInt(mes);
      const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      where = {
        fecha: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      };
    }

    const turnos = await prisma.turno.findMany({
      where,
      include: {
        cliente: { select: { id: true, nombre: true, telefono: true } },
        vehiculo: { select: { id: true, patente: true, marca: true, modelo: true } },
        trabajos: true,
      },
      orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }],
    });

    return NextResponse.json(turnos);
  } catch (error) {
    console.error("Error fetching turnos:", error);
    return NextResponse.json({ error: "Error fetching turnos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fecha, horaInicio, descripcion, clienteId, vehiculoId } = body;

    if (!fecha || !horaInicio || !descripcion || !clienteId || !vehiculoId) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    const turno = await prisma.turno.create({
      data: {
        fecha: parseFechaToUtcDate(fecha),
        horaInicio,
        descripcion,
        clienteId,
        vehiculoId,
        estado: "PENDIENTE",
      },
      include: {
        cliente: true,
        vehiculo: true,
      },
    });

    return NextResponse.json(turno, { status: 201 });
  } catch (error) {
    console.error("Error creating turno:", error);
    return NextResponse.json({ error: "Error creating turno" }, { status: 500 });
  }
}
