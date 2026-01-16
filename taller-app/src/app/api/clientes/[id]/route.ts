import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: params.id },
      include: { vehiculos: true },
    });

    if (!cliente) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    return NextResponse.json(cliente);
  } catch (error) {
    console.error("Error fetching cliente:", error);
    return NextResponse.json({ error: "Error fetching cliente" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { nombre, telefono, email, direccion } = body;

    const cliente = await prisma.cliente.update({
      where: { id: params.id },
      data: { nombre, telefono, email, direccion },
    });

    return NextResponse.json(cliente);
  } catch (error) {
    console.error("Error updating cliente:", error);
    return NextResponse.json({ error: "Error updating cliente" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.cliente.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting cliente:", error);
    return NextResponse.json({ error: "Error deleting cliente" }, { status: 500 });
  }
}
