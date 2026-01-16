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
    const { nombre, descripcion, cantidad, precioCompra, precioVenta, stockMinimo } = body;

    const repuesto = await prisma.repuesto.update({
      where: { id: params.id },
      data: { nombre, descripcion, cantidad, precioCompra, precioVenta, stockMinimo },
    });

    return NextResponse.json(repuesto);
  } catch (error) {
    console.error("Error updating repuesto:", error);
    return NextResponse.json({ error: "Error updating repuesto" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.repuesto.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting repuesto:", error);
    return NextResponse.json({ error: "Error deleting repuesto" }, { status: 500 });
  }
}
