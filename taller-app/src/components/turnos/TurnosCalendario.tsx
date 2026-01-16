"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TurnoDetalle } from "./TurnoDetalle";

interface Turno {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin?: string;
  descripcion: string;
  estado: "PENDIENTE" | "EN_PROGRESO" | "COMPLETADO" | "CANCELADO";
  cliente: { id: string; nombre: string; telefono: string };
  vehiculo: { id: string; patente: string; marca: string; modelo: string };
  trabajos: { id: string; descripcion: string; precio: number }[];
}

interface Props {
  onRefresh: () => void;
  refreshToken?: number;
  onMonthChange?: (month: Date) => void;
  onDateSelect?: (date: Date) => void;
  onCreateTurno?: () => void;
}

export function TurnosCalendario({
  onRefresh,
  refreshToken,
  onMonthChange,
  onDateSelect,
  onCreateTurno,
}: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedTurno, setSelectedTurno] = useState<Turno | null>(null);
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTurnos();
  }, [currentMonth, refreshToken]);

  useEffect(() => {
    onMonthChange?.(currentMonth);
  }, [currentMonth, onMonthChange]);

  const fetchTurnos = async () => {
    setLoading(true);
    try {
      const mes = currentMonth.getMonth() + 1;
      const anio = currentMonth.getFullYear();
      const res = await fetch(`/api/turnos?mes=${mes}&anio=${anio}`);
      if (res.ok) {
        const data = await res.json();
        setTurnos(data);
      }
    } catch (error) {
      console.error("Error fetching turnos:", error);
    } finally {
      setLoading(false);
    }
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const normalizeTurnoDate = (fecha: string) => {
    const d = new Date(fecha);
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  };

  const getTurnosForDay = (day: Date) => {
    return turnos.filter((t) => isSameDay(normalizeTurnoDate(t.fecha), day));
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "PENDIENTE": return "bg-yellow-500";
      case "EN_PROGRESO": return "bg-blue-500";
      case "COMPLETADO": return "bg-green-500";
      case "CANCELADO": return "bg-gray-500";
      default: return "bg-gray-300";
    }
  };

  const getEstadoBorderColor = (estado: string) => {
    switch (estado) {
      case "PENDIENTE": return "border-yellow-500";
      case "EN_PROGRESO": return "border-blue-500";
      case "COMPLETADO": return "border-green-500";
      case "CANCELADO": return "border-gray-500";
      default: return "border-gray-300";
    }
  };

  const turnosDelDia = selectedDate
    ? getTurnosForDay(selectedDate).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
    : [];

  return (
    <div className="space-y-4">
      {/* Navegación del mes */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: es })}
        </h2>
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const today = new Date();
            setCurrentMonth(today);
            setSelectedDate(today);
            onDateSelect?.(today);
          }}
        >
          Hoy
        </Button>
      </div>

      {loading && (
        <p className="text-center text-xs text-gray-500">Cargando turnos...</p>
      )}

      {/* Calendario */}
      <Card className="border-primary/20 shadow-sm">
        <CardContent className="p-2">
          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Días del mes */}
          <div className="grid grid-cols-7 gap-1">
            {/* Espacios vacíos para el inicio del mes */}
            {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="h-20 md:h-24" />
            ))}

            {days.map((day) => {
              const dayTurnos = getTurnosForDay(day).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => {
                    setSelectedDate(day);
                    onDateSelect?.(day);
                    setDayModalOpen(true);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedDate(day);
                      onDateSelect?.(day);
                      setDayModalOpen(true);
                    }
                  }}
                  className={`h-20 md:h-24 p-1 rounded-lg transition-colors relative overflow-hidden ${
                    isSelected
                      ? "bg-primary text-white"
                      : isToday
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-sm font-medium">{format(day, "d")}</span>
                    {dayTurnos.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {dayTurnos.slice(0, 3).map((t) => (
                          <div
                            key={t.id}
                            className={`w-1.5 h-1.5 rounded-full ${getEstadoColor(t.estado)}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {dayTurnos.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {dayTurnos.slice(0, 2).map((t) => (
                        <div
                          key={t.id}
                          role="presentation"
                          className={`w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded border-l-2 ${
                            isSelected
                              ? `bg-white/20 text-white ${getEstadoBorderColor(t.estado)}`
                              : `bg-gray-100 text-gray-700 ${getEstadoBorderColor(t.estado)}`
                          }`}
                          title={`${t.horaInicio} - ${t.cliente.nombre}`}
                        >
                          <span className="flex items-center gap-1 min-w-0">
                            <span className="opacity-70">{t.horaInicio}</span>
                            <span className="font-medium truncate">{t.cliente.nombre}</span>
                          </span>
                        </div>
                      ))}
                      {dayTurnos.length > 2 && (
                        <div className={`px-1 text-[10px] ${isSelected ? "text-white/80" : "text-gray-500"}`}>
                          +{dayTurnos.length - 2} más
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-3 justify-center text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span>Pendiente</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>En Progreso</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Completado</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gray-500" />
          <span>Cancelado</span>
        </div>
      </div>

      {/* Modal de turnos del día */}
      <Dialog open={dayModalOpen} onOpenChange={setDayModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedDate
                ? `Turnos del ${format(selectedDate, "d 'de' MMMM", { locale: es })}`
                : "Turnos del día"}
            </DialogTitle>
          </DialogHeader>
          {turnosDelDia.length === 0 ? (
            <div className="space-y-3">
              <p className="text-gray-500 text-sm">No hay turnos para este día</p>
              <Button
                className="w-full"
                onClick={() => {
                  setDayModalOpen(false);
                  onCreateTurno?.();
                }}
              >
                Agregar turno
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {turnosDelDia.map((turno) => (
                <Card
                  key={turno.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setSelectedTurno(turno);
                    setDayModalOpen(false);
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{turno.horaInicio}</span>
                          <Badge
                            variant={
                              turno.estado === "PENDIENTE" ? "pending" :
                              turno.estado === "EN_PROGRESO" ? "inProgress" :
                              turno.estado === "COMPLETADO" ? "completed" : "cancelled"
                            }
                            className="text-xs"
                          >
                            {turno.estado.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium mt-1">{turno.cliente.nombre}</p>
                        <p className="text-xs text-gray-500">
                          {turno.vehiculo.marca} {turno.vehiculo.modelo} - {turno.vehiculo.patente}
                        </p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{turno.descripcion}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de detalle del turno */}
      {selectedTurno && (
        <TurnoDetalle
          turno={selectedTurno}
          open={!!selectedTurno}
          onOpenChange={(open) => !open && setSelectedTurno(null)}
          onUpdate={() => {
            fetchTurnos();
            onRefresh();
            setSelectedTurno(null);
          }}
        />
      )}
    </div>
  );
}
