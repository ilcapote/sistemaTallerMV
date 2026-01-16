import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { patente, marca, modelo, anio, color, clienteId } = body;

    const vehiculo = await prisma.vehiculo.update({
      where: { id: params.id },
      data: { patente: patente?.toUpperCase(), marca, modelo, anio, color, clienteId },
    });

    return NextResponse.json(vehiculo);
  } catch (error) {
    console.error("Error updating vehiculo:", error);
    return NextResponse.json({ error: "Error updating vehiculo" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.vehiculo.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting vehiculo:", error);
    return NextResponse.json({ error: "Error deleting vehiculo" }, { status: 500 });
  }
}
