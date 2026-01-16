"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  vehiculos: Vehiculo[];
}

interface Vehiculo {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultDate?: Date | null;
}

export function NuevoTurnoDialog({ open, onOpenChange, onSuccess, defaultDate }: Props) {
  const [step, setStep] = useState(1);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [selectedVehiculo, setSelectedVehiculo] = useState<Vehiculo | null>(null);
  const [loading, setLoading] = useState(false);
  const [showNuevoCliente, setShowNuevoCliente] = useState(false);
  const [showNuevoVehiculo, setShowNuevoVehiculo] = useState(false);
  const [clienteQuery, setClienteQuery] = useState("");
  const [patenteQuery, setPatenteQuery] = useState("");

  const [nuevoCliente, setNuevoCliente] = useState({ nombre: "", telefono: "", email: "" });
  const [nuevoVehiculo, setNuevoVehiculo] = useState({ patente: "", marca: "", modelo: "", anio: "", color: "" });
  const [turnoData, setTurnoData] = useState({
    fecha: format(new Date(), "yyyy-MM-dd"),
    horaInicio: "09:00",
    descripcion: "",
  });

  useEffect(() => {
    if (open) {
      fetchClientes();
      resetForm();
    }
  }, [open]);

  const getDefaultFecha = () => format(defaultDate ?? new Date(), "yyyy-MM-dd");

  const resetForm = () => {
    setStep(1);
    setSelectedCliente(null);
    setSelectedVehiculo(null);
    setShowNuevoCliente(false);
    setShowNuevoVehiculo(false);
    setClienteQuery("");
    setPatenteQuery("");
    setNuevoCliente({ nombre: "", telefono: "", email: "" });
    setNuevoVehiculo({ patente: "", marca: "", modelo: "", anio: "", color: "" });
    setTurnoData({
      fecha: getDefaultFecha(),
      horaInicio: "09:00",
      descripcion: "",
    });
  };

  const vehiculosDisponibles = useMemo(
    () => clientes.flatMap((cliente) => cliente.vehiculos.map((vehiculo) => ({
      ...vehiculo,
      cliente,
    }))),
    [clientes]
  );

  const clienteSuggestions = useMemo(() => {
    const term = clienteQuery.trim().toLowerCase();
    if (!term) return [];
    return clientes.filter(
      (c) => c.nombre.toLowerCase().includes(term) || c.telefono.includes(term)
    );
  }, [clienteQuery, clientes]);

  const patenteSuggestions = useMemo(() => {
    const term = patenteQuery.trim().toLowerCase();
    if (!term) return [];
    return vehiculosDisponibles.filter((v) => v.patente.toLowerCase().includes(term));
  }, [patenteQuery, vehiculosDisponibles]);

  useEffect(() => {
    if (open) {
      setTurnoData((prev) => ({ ...prev, fecha: getDefaultFecha() }));
    }
  }, [defaultDate, open]);

  const fetchClientes = async () => {
    try {
      const res = await fetch("/api/clientes");
      if (res.ok) {
        const data = await res.json();
        setClientes(data);
      }
    } catch (error) {
      console.error("Error fetching clientes:", error);
    }
  };

  const crearCliente = async () => {
    if (!nuevoCliente.nombre || !nuevoCliente.telefono) return;

    setLoading(true);
    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoCliente),
      });
      if (res.ok) {
        const cliente = await res.json();
        setClientes([...clientes, { ...cliente, vehiculos: [] }]);
        setSelectedCliente({ ...cliente, vehiculos: [] });
        setShowNuevoCliente(false);
        setNuevoCliente({ nombre: "", telefono: "", email: "" });
      }
    } catch (error) {
      console.error("Error creating cliente:", error);
    } finally {
      setLoading(false);
    }
  };

  const crearVehiculo = async () => {
    if (!nuevoVehiculo.patente || !nuevoVehiculo.marca || !nuevoVehiculo.modelo || !selectedCliente) return;

    setLoading(true);
    try {
      const res = await fetch("/api/vehiculos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...nuevoVehiculo,
          anio: nuevoVehiculo.anio ? parseInt(nuevoVehiculo.anio) : null,
          clienteId: selectedCliente.id,
        }),
      });
      if (res.ok) {
        const vehiculo = await res.json();
        const updatedCliente = {
          ...selectedCliente,
          vehiculos: [...selectedCliente.vehiculos, vehiculo],
        };
        setSelectedCliente(updatedCliente);
        setSelectedVehiculo(vehiculo);
        setShowNuevoVehiculo(false);
        setNuevoVehiculo({ patente: "", marca: "", modelo: "", anio: "", color: "" });
      }
    } catch (error) {
      console.error("Error creating vehiculo:", error);
    } finally {
      setLoading(false);
    }
  };

  const crearTurno = async () => {
    if (!selectedCliente || !selectedVehiculo || !turnoData.descripcion) return;

    setLoading(true);
    try {
      const res = await fetch("/api/turnos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...turnoData,
          clienteId: selectedCliente.id,
          vehiculoId: selectedVehiculo.id,
        }),
      });
      if (res.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error creating turno:", error);
    } finally {
      setLoading(false);
    }
  };

  const horasDisponibles = Array.from({ length: 12 }, (_, i) => {
    const hora = 8 + i;
    return `${hora.toString().padStart(2, "0")}:00`;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && "Paso 1: Seleccionar Cliente"}
            {step === 2 && "Paso 2: Seleccionar Vehículo"}
            {step === 3 && "Paso 3: Datos del Turno"}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Cliente */}
        {step === 1 && (
          <div className="space-y-4">
            {!showNuevoCliente ? (
              <>
                <div className="space-y-2 relative">
                  <Label>Buscar cliente existente</Label>
                  <Input
                    placeholder="Nombre o teléfono"
                    value={clienteQuery}
                    onChange={(e) => {
                      setClienteQuery(e.target.value);
                      setSelectedCliente(null);
                      setSelectedVehiculo(null);
                    }}
                  />
                  {clienteSuggestions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg max-h-48 overflow-auto">
                      {clienteSuggestions.map((cliente) => (
                        <button
                          key={cliente.id}
                          type="button"
                          onClick={() => {
                            setSelectedCliente(cliente);
                            setSelectedVehiculo(null);
                            setClienteQuery(cliente.nombre);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100"
                        >
                          <span className="font-medium">{cliente.nombre}</span>
                          <span className="text-xs text-gray-500"> · {cliente.telefono}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2 relative">
                  <Label>Buscar por patente</Label>
                  <Input
                    placeholder="Ej: ABC123"
                    value={patenteQuery}
                    onChange={(e) => {
                      setPatenteQuery(e.target.value.toUpperCase());
                      setSelectedCliente(null);
                      setSelectedVehiculo(null);
                    }}
                  />
                  {patenteSuggestions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg max-h-48 overflow-auto">
                      {patenteSuggestions.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSelectedCliente(item.cliente);
                            setSelectedVehiculo(item);
                            setClienteQuery(item.cliente.nombre);
                            setPatenteQuery(item.patente);
                            setStep(3);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100"
                        >
                          <span className="font-medium">{item.patente}</span>
                          <span className="text-xs text-gray-500">
                            {" "}· {item.marca} {item.modelo} · {item.cliente.nombre}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-center text-sm text-gray-500">o</div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowNuevoCliente(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar nuevo cliente
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label>Nombre *</Label>
                  <Input
                    value={nuevoCliente.nombre}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
                    placeholder="Nombre completo"
                  />
                </div>
                <div>
                  <Label>Teléfono *</Label>
                  <Input
                    value={nuevoCliente.telefono}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                    placeholder="Número de teléfono"
                  />
                </div>
                <div>
                  <Label>Email (opcional)</Label>
                  <Input
                    type="email"
                    value={nuevoCliente.email}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value })}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowNuevoCliente(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={crearCliente} disabled={loading}>
                    Guardar Cliente
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Vehículo */}
        {step === 2 && selectedCliente && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-medium">{selectedCliente.nombre}</p>
              <p className="text-sm text-gray-500">{selectedCliente.telefono}</p>
            </div>

            {!showNuevoVehiculo ? (
              <>
                {selectedCliente.vehiculos.length > 0 && (
                  <div className="space-y-2">
                    <Label>Vehículos del cliente</Label>
                    <Select
                      value={selectedVehiculo?.id || ""}
                      onValueChange={(value) => {
                        const vehiculo = selectedCliente.vehiculos.find((v) => v.id === value);
                        setSelectedVehiculo(vehiculo || null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar vehículo..." />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedCliente.vehiculos.map((vehiculo) => (
                          <SelectItem key={vehiculo.id} value={vehiculo.id}>
                            {vehiculo.patente} - {vehiculo.marca} {vehiculo.modelo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowNuevoVehiculo(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar nuevo vehículo
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label>Patente *</Label>
                  <Input
                    value={nuevoVehiculo.patente}
                    onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, patente: e.target.value.toUpperCase() })}
                    placeholder="ABC123"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Marca *</Label>
                    <Input
                      value={nuevoVehiculo.marca}
                      onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, marca: e.target.value })}
                      placeholder="Ford"
                    />
                  </div>
                  <div>
                    <Label>Modelo *</Label>
                    <Input
                      value={nuevoVehiculo.modelo}
                      onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, modelo: e.target.value })}
                      placeholder="Focus"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Año</Label>
                    <Input
                      type="number"
                      value={nuevoVehiculo.anio}
                      onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, anio: e.target.value })}
                      placeholder="2020"
                    />
                  </div>
                  <div>
                    <Label>Color</Label>
                    <Input
                      value={nuevoVehiculo.color}
                      onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, color: e.target.value })}
                      placeholder="Blanco"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowNuevoVehiculo(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={crearVehiculo} disabled={loading}>
                    Guardar Vehículo
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Datos del turno */}
        {step === 3 && selectedCliente && selectedVehiculo && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg space-y-1">
              <p className="font-medium">{selectedCliente.nombre}</p>
              <p className="text-sm text-gray-500">
                {selectedVehiculo.patente} - {selectedVehiculo.marca} {selectedVehiculo.modelo}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha *</Label>
                <Input
                  type="date"
                  value={turnoData.fecha}
                  onChange={(e) => setTurnoData({ ...turnoData, fecha: e.target.value })}
                />
              </div>
              <div>
                <Label>Hora *</Label>
                <Select
                  value={turnoData.horaInicio}
                  onValueChange={(value) => setTurnoData({ ...turnoData, horaInicio: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {horasDisponibles.map((hora) => (
                      <SelectItem key={hora} value={hora}>
                        {hora}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Descripción del trabajo *</Label>
              <Textarea
                value={turnoData.descripcion}
                onChange={(e) => setTurnoData({ ...turnoData, descripcion: e.target.value })}
                placeholder="Describir el trabajo a realizar..."
                rows={4}
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Atrás
            </Button>
          )}
          {step < 3 && (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !selectedCliente) ||
                (step === 2 && !selectedVehiculo)
              }
            >
              Siguiente
            </Button>
          )}
          {step === 3 && (
            <Button
              onClick={crearTurno}
              disabled={loading || !turnoData.descripcion}
            >
              Crear Turno
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
