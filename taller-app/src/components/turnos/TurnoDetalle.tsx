"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Phone, Car, Plus, Trash2, Play, CheckCircle, Share2, Download, Pencil, Save, MessageCircle } from "lucide-react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Trabajo {
  id: string;
  descripcion: string;
  precio: number;
}

interface Turno {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin?: string;
  descripcion: string;
  estado: "PENDIENTE" | "EN_PROGRESO" | "COMPLETADO" | "CANCELADO";
  cliente: { id: string; nombre: string; telefono: string };
  vehiculo: { id: string; patente: string; marca: string; modelo: string };
  trabajos: Trabajo[];
}

interface Props {
  turno: Turno;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

const normalizeTurnoDate = (fecha: string) => {
  const d = new Date(fecha);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};

export function TurnoDetalle({ turno, open, onOpenChange, onUpdate }: Props) {
  const [loading, setLoading] = useState(false);
  const [nuevoTrabajo, setNuevoTrabajo] = useState({ descripcion: "", precio: "" });
  const [trabajos, setTrabajos] = useState<Trabajo[]>(turno.trabajos);
  const cardRef = useRef<HTMLDivElement>(null);

  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    fecha: format(normalizeTurnoDate(turno.fecha), "yyyy-MM-dd"),
    horaInicio: turno.horaInicio,
    horaFin: turno.horaFin || "",
    descripcion: turno.descripcion,
  });

  const [showFinalizarConCosto, setShowFinalizarConCosto] = useState(false);
  const [finalTrabajo, setFinalTrabajo] = useState({ descripcion: "", precio: "" });

  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  const total = trabajos.reduce((sum, t) => sum + t.precio, 0);

  const mensajeWhatsapp = `🔧 Taller MV\n\nHola ${turno.cliente.nombre}, te recordamos el turno para tu vehículo: 🚗\n${turno.vehiculo.marca} ${turno.vehiculo.modelo} (${turno.vehiculo.patente})\n\n📅 Fecha: ${format(
    normalizeTurnoDate(turno.fecha),
    "EEEE dd/MM/yyyy",
    { locale: es }
  )}\n🕒 Hora: ${turno.horaInicio}\n🛠️ Trabajo: ${turno.descripcion}\n\n¡Te esperamos!`;

  const cambiarEstado = async (nuevoEstado: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/turnos/${turno.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (res.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error updating turno:", error);
    } finally {
      setLoading(false);
    }
  };

  const compartirWhatsapp = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 0.95 });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `turno-${turno.vehiculo.patente}.png`, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Turno Taller MV",
          text: mensajeWhatsapp,
        });
        return;
      }

      if (navigator.share) {
        await navigator.share({
          title: "Turno Taller MV",
          text: mensajeWhatsapp,
        });
        return;
      }

      const telefono = turno.cliente.telefono.replace(/\D/g, "");
      const texto = encodeURIComponent(mensajeWhatsapp);
      window.open(`https://wa.me/${telefono}?text=${texto}`, "_blank");
    } catch (error) {
      console.error("Error sharing WhatsApp:", error);
    }
  };

  const confirmarCambioEstado = (nuevoEstado: string, mensaje: string) => {
    if (!window.confirm(mensaje)) return;
    cambiarEstado(nuevoEstado);
  };

  const agregarTrabajo = async () => {
    if (!nuevoTrabajo.descripcion || !nuevoTrabajo.precio) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/turnos/${turno.id}/trabajos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descripcion: nuevoTrabajo.descripcion,
          precio: parseFloat(nuevoTrabajo.precio),
        }),
      });
      if (res.ok) {
        const trabajo = await res.json();
        setTrabajos([...trabajos, trabajo]);
        setNuevoTrabajo({ descripcion: "", precio: "" });
      }
    } catch (error) {
      console.error("Error adding trabajo:", error);
    } finally {
      setLoading(false);
    }
  };

  const eliminarTrabajo = async (trabajoId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/turnos/${turno.id}/trabajos?trabajoId=${trabajoId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setTrabajos(trabajos.filter((t) => t.id !== trabajoId));
      }
    } catch (error) {
      console.error("Error deleting trabajo:", error);
    } finally {
      setLoading(false);
    }
  };

  const guardarCambios = async () => {
    if (!editData.fecha || !editData.horaInicio || !editData.descripcion) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/turnos/${turno.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: editData.fecha,
          horaInicio: editData.horaInicio,
          horaFin: editData.horaFin ? editData.horaFin : null,
          descripcion: editData.descripcion,
        }),
      });
      if (res.ok) {
        setEditMode(false);
        onUpdate();
      }
    } catch (error) {
      console.error("Error updating turno:", error);
    } finally {
      setLoading(false);
    }
  };

  const finalizarTurno = async () => {
    if (trabajos.length === 0) {
      setShowFinalizarConCosto(true);
      setFinalTrabajo({ descripcion: turno.descripcion, precio: "" });
      return;
    }
    await cambiarEstado("COMPLETADO");
  };

  const guardarCostoYFinalizar = async () => {
    if (!finalTrabajo.precio) return;

    setLoading(true);
    try {
      const resTrabajo = await fetch(`/api/turnos/${turno.id}/trabajos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descripcion: finalTrabajo.descripcion || "Trabajo",
          precio: parseFloat(finalTrabajo.precio),
        }),
      });

      if (!resTrabajo.ok) return;

      const trabajoCreado = await resTrabajo.json();
      setTrabajos([...trabajos, trabajoCreado]);

      const resTurno = await fetch(`/api/turnos/${turno.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "COMPLETADO" }),
      });
      if (resTurno.ok) {
        setShowFinalizarConCosto(false);
        onUpdate();
      }
    } catch (error) {
      console.error("Error finalizing turno:", error);
    } finally {
      setLoading(false);
    }
  };

  const generarImagen = async () => {
    if (!cardRef.current) return;

    try {
      const dataUrl = await toPng(cardRef.current, { quality: 0.95 });
      
      if (navigator.share) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `turno-${turno.vehiculo.patente}.png`, { type: "image/png" });
        await navigator.share({
          files: [file],
          title: "Turno Taller MV",
          text: `Turno para ${turno.cliente.nombre}`,
        });
      } else {
        const link = document.createElement("a");
        link.download = `turno-${turno.vehiculo.patente}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (error) {
      console.error("Error generating image:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalle del Turno</span>
            <Badge
              variant={
                turno.estado === "PENDIENTE" ? "pending" :
                turno.estado === "EN_PROGRESO" ? "inProgress" :
                turno.estado === "COMPLETADO" ? "completed" : "cancelled"
              }
            >
              {turno.estado.replace("_", " ")}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setEditMode(!editMode);
              setShowFinalizarConCosto(false);
            }}
          >
            <Pencil className="h-4 w-4 mr-1" />
            {editMode ? "Cancelar edición" : "Editar"}
          </Button>
          <Button variant="outline" className="flex-1" onClick={generarImagen}>
            {canShare ? <Share2 className="h-4 w-4 mr-1" /> : <Download className="h-4 w-4 mr-1" />}
            {canShare ? "Compartir imagen" : "Descargar imagen"}
          </Button>
        </div>

        <Button className="w-full" onClick={compartirWhatsapp}>
          <MessageCircle className="h-4 w-4 mr-2" />
          Enviar por WhatsApp
        </Button>

        {editMode && (
          <div className="space-y-3 border rounded-lg p-3 bg-gray-50">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={editData.fecha}
                  onChange={(e) => setEditData({ ...editData, fecha: e.target.value })}
                />
              </div>
              <div>
                <Label>Hora</Label>
                <Input
                  type="time"
                  value={editData.horaInicio}
                  onChange={(e) => setEditData({ ...editData, horaInicio: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Hora fin (opcional)</Label>
              <Input
                type="time"
                value={editData.horaFin}
                onChange={(e) => setEditData({ ...editData, horaFin: e.target.value })}
              />
            </div>

            <div>
              <Label>Descripción</Label>
              <Textarea
                value={editData.descripcion}
                onChange={(e) => setEditData({ ...editData, descripcion: e.target.value })}
                rows={3}
              />
            </div>

            <Button className="w-full" onClick={guardarCambios} disabled={loading}>
              <Save className="h-4 w-4 mr-1" />
              Guardar cambios
            </Button>
          </div>
        )}

        {/* Card para generar imagen */}
        <div ref={cardRef} className="bg-white p-4 rounded-lg space-y-3">
          <div className="text-center border-b pb-2">
            <h3 className="font-bold text-lg text-primary">Taller MV</h3>
            <p className="text-xs text-gray-500">Comprobante de Turno</p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Fecha:</span>
              <span className="font-medium">
                {format(normalizeTurnoDate(turno.fecha), "dd/MM/yyyy", { locale: es })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Hora:</span>
              <span className="font-medium">{turno.horaInicio}</span>
            </div>
          </div>

          <div className="border-t pt-2 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{turno.cliente.nombre}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Phone className="h-3 w-3" />
              <span>{turno.cliente.telefono}</span>
            </div>
          </div>

          <div className="border-t pt-2 space-y-1">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-gray-500" />
              <span className="font-medium">{turno.vehiculo.patente}</span>
            </div>
            <p className="text-sm text-gray-500">
              {turno.vehiculo.marca} {turno.vehiculo.modelo}
            </p>
          </div>

          <div className="border-t pt-2">
            <p className="text-sm font-medium">Trabajo a realizar:</p>
            <p className="text-sm text-gray-600">{turno.descripcion}</p>
          </div>

          {trabajos.length > 0 && (
            <div className="border-t pt-2">
              <p className="text-sm font-medium mb-1">Trabajos realizados:</p>
              {trabajos.map((t) => (
                <div key={t.id} className="flex justify-between text-sm">
                  <span>{t.descripcion}</span>
                  <span className="font-medium">${t.precio.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t">
                <span>TOTAL:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Agregar trabajo (solo si está en progreso o completado) */}
        {(turno.estado === "EN_PROGRESO" || turno.estado === "COMPLETADO") && (
          <div className="space-y-2 border-t pt-3">
            <Label className="text-sm font-medium">Agregar trabajo</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Descripción"
                value={nuevoTrabajo.descripcion}
                onChange={(e) => setNuevoTrabajo({ ...nuevoTrabajo, descripcion: e.target.value })}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Precio"
                value={nuevoTrabajo.precio}
                onChange={(e) => setNuevoTrabajo({ ...nuevoTrabajo, precio: e.target.value })}
                className="w-24"
              />
              <Button size="icon" onClick={agregarTrabajo} disabled={loading}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {trabajos.length > 0 && (
              <div className="space-y-1">
                {trabajos.map((t) => (
                  <div key={t.id} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                    <span>{t.descripcion}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">${t.precio.toFixed(2)}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => eliminarTrabajo(t.id)}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {showFinalizarConCosto && turno.estado === "EN_PROGRESO" && (
          <div className="space-y-2 border-t pt-3">
            <Label className="text-sm font-medium">Costo para finalizar</Label>
            <Input
              placeholder="Descripción (opcional)"
              value={finalTrabajo.descripcion}
              onChange={(e) => setFinalTrabajo({ ...finalTrabajo, descripcion: e.target.value })}
            />
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Precio"
                value={finalTrabajo.precio}
                onChange={(e) => setFinalTrabajo({ ...finalTrabajo, precio: e.target.value })}
              />
              <Button onClick={guardarCostoYFinalizar} disabled={loading || !finalTrabajo.precio}>
                Finalizar
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {/* Botones de estado */}
          <div className="flex gap-2 w-full">
            {turno.estado === "PENDIENTE" && (
              <Button
                className="flex-1 bg-blue-500 hover:bg-blue-600"
                onClick={() =>
                  confirmarCambioEstado("EN_PROGRESO", "¿Iniciar este turno? Esta acción se puede deshacer.")
                }
                disabled={loading}
              >
                <Play className="h-4 w-4 mr-1" />
                Iniciar
              </Button>
            )}
            {turno.estado === "EN_PROGRESO" && (
              <Button
                className="flex-1 bg-green-500 hover:bg-green-600"
                onClick={finalizarTurno}
                disabled={loading}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Finalizar
              </Button>
            )}
            {(turno.estado === "PENDIENTE" || turno.estado === "EN_PROGRESO") && (
              <Button
                className="flex-1"
                variant="destructive"
                onClick={() =>
                  confirmarCambioEstado(
                    "CANCELADO",
                    "¿Cancelar este turno? Esta acción no se puede deshacer."
                  )
                }
                disabled={loading}
              >
                Cancelar
              </Button>
            )}
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Salir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
