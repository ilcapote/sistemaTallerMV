import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const clientes = await prisma.cliente.findMany({
      include: {
        vehiculos: true,
        _count: { select: { turnos: true } },
      },
      orderBy: { nombre: "asc" },
    });
    return NextResponse.json(clientes);
  } catch (error) {
    console.error("Error fetching clientes:", error);
    return NextResponse.json({ error: "Error fetching clientes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, telefono, email, direccion } = body;

    if (!nombre || !telefono) {
      return NextResponse.json(
        { error: "Nombre y teléfono son requeridos" },
        { status: 400 }
      );
    }

    const cliente = await prisma.cliente.create({
      data: { nombre, telefono, email, direccion },
    });

    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    console.error("Error creating cliente:", error);
    return NextResponse.json({ error: "Error creating cliente" }, { status: 500 });
  }
}
