import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const getMonthRangeUtc = (mes: string, anio: string) => {
  const year = parseInt(anio);
  const month = parseInt(mes);
  const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { startOfMonth, endOfMonth };
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get("mes");
    const anio = searchParams.get("anio");

    const fechaFiltro = mes && anio ? getMonthRangeUtc(mes, anio) : null;
    const fechaWhere = fechaFiltro
      ? {
          fecha: {
            gte: fechaFiltro.startOfMonth,
            lte: fechaFiltro.endOfMonth,
          },
        }
      : {};

    const [turnosPendientes, turnosEnProgreso, turnosCompletados, totalClientes] = await Promise.all([
      prisma.turno.count({ where: { estado: "PENDIENTE", ...fechaWhere } }),
      prisma.turno.count({ where: { estado: "EN_PROGRESO", ...fechaWhere } }),
      prisma.turno.count({ where: { estado: "COMPLETADO", ...fechaWhere } }),
      prisma.cliente.count(),
    ]);

    return NextResponse.json({
      turnosPendientes,
      turnosEnProgreso,
      turnosCompletados,
      totalClientes,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Error fetching stats" }, { status: 500 });
  }
}
