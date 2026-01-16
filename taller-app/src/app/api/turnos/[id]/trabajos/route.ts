import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { descripcion, precio } = body;

    if (!descripcion || precio === undefined) {
      return NextResponse.json(
        { error: "Descripción y precio son requeridos" },
        { status: 400 }
      );
    }

    const trabajo = await prisma.trabajo.create({
      data: {
        descripcion,
        precio: parseFloat(precio),
        turnoId: params.id,
      },
    });

    return NextResponse.json(trabajo, { status: 201 });
  } catch (error) {
    console.error("Error creating trabajo:", error);
    return NextResponse.json({ error: "Error creating trabajo" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const trabajoId = searchParams.get("trabajoId");

    if (!trabajoId) {
      return NextResponse.json({ error: "trabajoId es requerido" }, { status: 400 });
    }

    await prisma.trabajo.delete({ where: { id: trabajoId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting trabajo:", error);
    return NextResponse.json({ error: "Error deleting trabajo" }, { status: 500 });
  }
}
