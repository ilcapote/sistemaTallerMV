import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get("clienteId");

    const where = clienteId ? { clienteId } : {};

    const vehiculos = await prisma.vehiculo.findMany({
      where,
      include: {
        cliente: { select: { id: true, nombre: true, telefono: true } },
      },
      orderBy: { patente: "asc" },
    });
    return NextResponse.json(vehiculos);
  } catch (error) {
    console.error("Error fetching vehiculos:", error);
    return NextResponse.json({ error: "Error fetching vehiculos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patente, marca, modelo, anio, color, clienteId } = body;

    if (!patente || !marca || !modelo || !clienteId) {
      return NextResponse.json(
        { error: "Patente, marca, modelo y cliente son requeridos" },
        { status: 400 }
      );
    }

    const vehiculo = await prisma.vehiculo.create({
      data: { patente: patente.toUpperCase(), marca, modelo, anio, color, clienteId },
      include: { cliente: true },
    });

    return NextResponse.json(vehiculo, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un vehículo con esa patente" }, { status: 400 });
    }
    console.error("Error creating vehiculo:", error);
    return NextResponse.json({ error: "Error creating vehiculo" }, { status: 500 });
  }
}
