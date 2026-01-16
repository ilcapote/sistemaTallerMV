import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const repuestos = await prisma.repuesto.findMany({
      orderBy: { nombre: "asc" },
    });
    return NextResponse.json(repuestos);
  } catch (error) {
    console.error("Error fetching repuestos:", error);
    return NextResponse.json({ error: "Error fetching repuestos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, descripcion, cantidad, precioCompra, precioVenta, stockMinimo } = body;

    if (!nombre) {
      return NextResponse.json({ error: "Nombre es requerido" }, { status: 400 });
    }

    const repuesto = await prisma.repuesto.create({
      data: { nombre, descripcion, cantidad, precioCompra, precioVenta, stockMinimo },
    });

    return NextResponse.json(repuesto, { status: 201 });
  } catch (error) {
    console.error("Error creating repuesto:", error);
    return NextResponse.json({ error: "Error creating repuesto" }, { status: 500 });
  }
}
