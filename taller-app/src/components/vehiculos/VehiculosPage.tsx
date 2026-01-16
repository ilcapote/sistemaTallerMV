"use client";

import { useState, useEffect } from "react";
import { Plus, Car, User, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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

interface Vehiculo {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  anio?: number;
  color?: string;
  cliente: { id: string; nombre: string; telefono: string };
}

interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
}

export function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState<Vehiculo | null>(null);
  const [formData, setFormData] = useState({
    patente: "",
    marca: "",
    modelo: "",
    anio: "",
    color: "",
    clienteId: "",
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchVehiculos();
    fetchClientes();
  }, []);

  const fetchVehiculos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vehiculos");
      if (res.ok) {
        const data = await res.json();
        setVehiculos(data);
      }
    } catch (error) {
      console.error("Error fetching vehiculos:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmit = async () => {
    if (!formData.patente || !formData.marca || !formData.modelo || !formData.clienteId) return;

    setLoading(true);
    try {
      const url = editingVehiculo ? `/api/vehiculos/${editingVehiculo.id}` : "/api/vehiculos";
      const method = editingVehiculo ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          anio: formData.anio ? parseInt(formData.anio) : null,
        }),
      });

      if (res.ok) {
        fetchVehiculos();
        closeDialog();
      }
    } catch (error) {
      console.error("Error saving vehiculo:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este vehículo?")) return;

    try {
      const res = await fetch(`/api/vehiculos/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchVehiculos();
      }
    } catch (error) {
      console.error("Error deleting vehiculo:", error);
    }
  };

  const openEditDialog = (vehiculo: Vehiculo) => {
    setEditingVehiculo(vehiculo);
    setFormData({
      patente: vehiculo.patente,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      anio: vehiculo.anio?.toString() || "",
      color: vehiculo.color || "",
      clienteId: vehiculo.cliente.id,
    });
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingVehiculo(null);
    setFormData({ patente: "", marca: "", modelo: "", anio: "", color: "", clienteId: "" });
  };

  const filteredVehiculos = vehiculos.filter(
    (v) =>
      v.patente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Buscar vehículo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Nuevo
        </Button>
      </div>

      <div className="space-y-2">
        {filteredVehiculos.map((vehiculo) => (
          <Card key={vehiculo.id}>
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{vehiculo.patente}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {vehiculo.marca} {vehiculo.modelo}
                    {vehiculo.anio && ` (${vehiculo.anio})`}
                    {vehiculo.color && ` - ${vehiculo.color}`}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                    <User className="h-3 w-3" />
                    <span>{vehiculo.cliente.nombre}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEditDialog(vehiculo)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(vehiculo.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredVehiculos.length === 0 && (
          <p className="text-center text-gray-500 py-8">No hay vehículos</p>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingVehiculo ? "Editar Vehículo" : "Nuevo Vehículo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Cliente *</Label>
              <Select
                value={formData.clienteId}
                onValueChange={(value) => setFormData({ ...formData, clienteId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nombre} - {cliente.telefono}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Patente *</Label>
              <Input
                value={formData.patente}
                onChange={(e) => setFormData({ ...formData, patente: e.target.value.toUpperCase() })}
                placeholder="ABC123"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Marca *</Label>
                <Input
                  value={formData.marca}
                  onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                  placeholder="Ford"
                />
              </div>
              <div>
                <Label>Modelo *</Label>
                <Input
                  value={formData.modelo}
                  onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                  placeholder="Focus"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Año</Label>
                <Input
                  type="number"
                  value={formData.anio}
                  onChange={(e) => setFormData({ ...formData, anio: e.target.value })}
                  placeholder="2020"
                />
              </div>
              <div>
                <Label>Color</Label>
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="Blanco"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {editingVehiculo ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
