"use client";

import { useMemo, useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Search, FileDown, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Trabajo {
  id: string;
  descripcion: string;
  precio: number;
}

interface ClienteItem {
  id: string;
  nombre: string;
  telefono: string;
}

interface VehiculoItem {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  cliente: { nombre: string; telefono: string };
}

interface TurnoReporte {
  id: string;
  fecha: string;
  horaInicio: string;
  descripcion: string;
  estado: "PENDIENTE" | "EN_PROGRESO" | "COMPLETADO" | "CANCELADO";
  cliente: { nombre: string; telefono: string };
  vehiculo: { patente: string; marca: string; modelo: string };
  trabajos: Trabajo[];
}

const normalizeTurnoDate = (fecha: string) => {
  const d = new Date(fecha);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};

export function ReportesPage() {
  const [cliente, setCliente] = useState("");
  const [patente, setPatente] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState<TurnoReporte[]>([]);
  const [buscado, setBuscado] = useState(false);
  const [clientes, setClientes] = useState<ClienteItem[]>([]);
  const [vehiculos, setVehiculos] = useState<VehiculoItem[]>([]);
  const [groupBy, setGroupBy] = useState<"none" | "cliente" | "vehiculo">("none");

  useEffect(() => {
    const fetchFiltros = async () => {
      try {
        const [clientesRes, vehiculosRes] = await Promise.all([
          fetch("/api/clientes"),
          fetch("/api/vehiculos"),
        ]);

        if (clientesRes.ok) {
          const data = await clientesRes.json();
          setClientes(data);
        }

        if (vehiculosRes.ok) {
          const data = await vehiculosRes.json();
          setVehiculos(data);
        }
      } catch (error) {
        console.error("Error fetching filtros:", error);
      }
    };

    fetchFiltros();
  }, []);

  const buscarHistorial = async () => {
    if (!cliente && !patente && !desde && !hasta) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (cliente) params.set("cliente", cliente);
      if (patente) params.set("patente", patente);
      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta);

      const res = await fetch(`/api/reportes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResultados(data);
        setBuscado(true);
      }
    } catch (error) {
      console.error("Error fetching reportes:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportarCsv = () => {
    if (resultados.length === 0) return;
    const headers = [
      "Fecha",
      "Hora",
      "Estado",
      "Cliente",
      "Teléfono",
      "Vehículo",
      "Patente",
      "Descripción",
      "Trabajos",
      "Total trabajos",
    ];
    const rows = resultados.map((turno) => {
      const total = turno.trabajos.reduce((sum, t) => sum + t.precio, 0);
      const trabajos = turno.trabajos.map((t) => `${t.descripcion} ($${t.precio})`).join(" | ");
      return [
        format(normalizeTurnoDate(turno.fecha), "dd/MM/yyyy", { locale: es }),
        turno.horaInicio,
        turno.estado,
        turno.cliente.nombre,
        turno.cliente.telefono,
        `${turno.vehiculo.marca} ${turno.vehiculo.modelo}`,
        turno.vehiculo.patente,
        turno.descripcion,
        trabajos,
        total.toFixed(2),
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "historial_turnos.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const imprimirReporte = () => {
    if (resultados.length === 0) return;
    window.print();
  };

  const clienteSuggestions = useMemo(() => {
    if (!cliente) return [];
    const term = cliente.toLowerCase();
    return clientes.filter(
      (c) => c.nombre.toLowerCase().includes(term) || c.telefono.includes(term)
    );
  }, [cliente, clientes]);

  const vehiculoSuggestions = useMemo(() => {
    if (!patente) return [];
    const term = patente.toLowerCase();
    return vehiculos.filter((v) => v.patente.toLowerCase().includes(term));
  }, [patente, vehiculos]);

  const resultadosAgrupados = useMemo(() => {
    if (groupBy === "none") return { "": resultados };
    return resultados.reduce<Record<string, TurnoReporte[]>>((acc, turno) => {
      const key =
        groupBy === "cliente"
          ? `${turno.cliente.nombre} · ${turno.cliente.telefono}`
          : `${turno.vehiculo.patente} · ${turno.vehiculo.marca} ${turno.vehiculo.modelo}`;
      acc[key] = acc[key] || [];
      acc[key].push(turno);
      return acc;
    }, {});
  }, [resultados, groupBy]);

  return (
    <div className="space-y-4">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Reportes de historial</CardTitle>
          <p className="text-xs text-gray-500">
            Buscá por cliente o por patente y filtrá por rango de fechas.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 relative">
              <Label>Cliente</Label>
              <Input
                placeholder="Nombre o teléfono"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
              />
              {clienteSuggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg max-h-48 overflow-auto">
                  {clienteSuggestions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCliente(c.nombre)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100"
                    >
                      <span className="font-medium">{c.nombre}</span>
                      <span className="text-xs text-gray-500"> · {c.telefono}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2 relative">
              <Label>Patente</Label>
              <Input
                placeholder="Ej: ABC123"
                value={patente}
                onChange={(e) => setPatente(e.target.value.toUpperCase())}
              />
              {vehiculoSuggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg max-h-48 overflow-auto">
                  {vehiculoSuggestions.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setPatente(v.patente)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100"
                    >
                      <span className="font-medium">{v.patente}</span>
                      <span className="text-xs text-gray-500">
                        {" "}· {v.marca} {v.modelo}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Desde</Label>
              <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Hasta</Label>
              <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-3">
            <Button className="w-full" onClick={buscarHistorial} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Buscar historial
            </Button>
            <Button className="w-full" variant="outline" onClick={exportarCsv} disabled={resultados.length === 0}>
              <FileDown className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button className="w-full" variant="outline" onClick={imprimirReporte} disabled={resultados.length === 0}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir / PDF
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={groupBy === "none" ? "default" : "outline"}
              size="sm"
              onClick={() => setGroupBy("none")}
            >
              Sin agrupar
            </Button>
            <Button
              type="button"
              variant={groupBy === "cliente" ? "default" : "outline"}
              size="sm"
              onClick={() => setGroupBy("cliente")}
            >
              Agrupar por cliente
            </Button>
            <Button
              type="button"
              variant={groupBy === "vehiculo" ? "default" : "outline"}
              size="sm"
              onClick={() => setGroupBy("vehiculo")}
            >
              Agrupar por vehículo
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && <p className="text-sm text-gray-500">Buscando historial...</p>}

      {buscado && resultados.length === 0 && !loading && (
        <p className="text-sm text-gray-500">No se encontraron turnos con esos filtros.</p>
      )}

      {resultados.length > 0 && (
        <div className="space-y-3">
          {Object.entries(resultadosAgrupados).map(([groupKey, items]) => (
            <div key={groupKey || "sin-grupo"} className="space-y-3">
              {groupKey && (
                <div className="text-sm font-semibold text-slate-700">{groupKey}</div>
              )}
              {items.map((turno) => {
                const total = turno.trabajos.reduce((sum, t) => sum + t.precio, 0);
                return (
                  <Card key={turno.id} className="border-slate-200">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">
                          {format(normalizeTurnoDate(turno.fecha), "dd/MM/yyyy", { locale: es })}
                        </span>
                        <span className="text-xs text-gray-500">{turno.horaInicio}</span>
                        <Badge
                          variant={
                            turno.estado === "PENDIENTE"
                              ? "pending"
                              : turno.estado === "EN_PROGRESO"
                              ? "inProgress"
                              : turno.estado === "COMPLETADO"
                              ? "completed"
                              : "cancelled"
                          }
                          className="text-xs"
                        >
                          {turno.estado.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="text-sm font-medium">{turno.cliente.nombre}</div>
                      <div className="text-xs text-gray-500">{turno.cliente.telefono}</div>
                      <div className="text-sm text-gray-600">
                        {turno.vehiculo.marca} {turno.vehiculo.modelo} · {turno.vehiculo.patente}
                      </div>
                      <p className="text-sm text-gray-700">{turno.descripcion}</p>
                      {turno.trabajos.length > 0 ? (
                        <div className="space-y-1 text-sm text-gray-600">
                          <span className="font-medium">Trabajos realizados:</span>
                          <ul className="list-disc list-inside">
                            {turno.trabajos.map((t) => (
                              <li key={t.id}>
                                {t.descripcion} <span className="text-xs">(${t.precio.toFixed(2)})</span>
                              </li>
                            ))}
                          </ul>
                          <div className="font-medium">Total trabajos: ${total.toFixed(2)}</div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">Sin trabajos asociados.</div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
