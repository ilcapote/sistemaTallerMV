import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const turno = await prisma.turno.findUnique({
      where: { id: params.id },
      include: {
        cliente: true,
        vehiculo: true,
        trabajos: true,
      },
    });

    if (!turno) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }

    return NextResponse.json(turno);
  } catch (error) {
    console.error("Error fetching turno:", error);
    return NextResponse.json({ error: "Error fetching turno" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { fecha, horaInicio, horaFin, descripcion, estado, clienteId, vehiculoId } = body;

    const updateData: any = {};
    if (fecha) updateData.fecha = parseFechaToUtcDate(fecha);
    if (horaInicio) updateData.horaInicio = horaInicio;
    if (horaFin !== undefined) updateData.horaFin = horaFin;
    if (descripcion) updateData.descripcion = descripcion;
    if (estado) updateData.estado = estado;
    if (clienteId) updateData.clienteId = clienteId;
    if (vehiculoId) updateData.vehiculoId = vehiculoId;

    const turno = await prisma.turno.update({
      where: { id: params.id },
      data: updateData,
      include: {
        cliente: true,
        vehiculo: true,
        trabajos: true,
      },
    });

    return NextResponse.json(turno);
  } catch (error) {
    console.error("Error updating turno:", error);
    return NextResponse.json({ error: "Error updating turno" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.turno.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting turno:", error);
    return NextResponse.json({ error: "Error deleting turno" }, { status: 500 });
  }
}
