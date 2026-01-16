"use client";

import { useState, useEffect } from "react";
import { Plus, Package, Trash2, Edit2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Repuesto {
  id: string;
  nombre: string;
  descripcion?: string;
  cantidad: number;
  precioCompra?: number;
  precioVenta?: number;
  stockMinimo: number;
}

export function RepuestosPage() {
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRepuesto, setEditingRepuesto] = useState<Repuesto | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    cantidad: "0",
    precioCompra: "",
    precioVenta: "",
    stockMinimo: "1",
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchRepuestos();
  }, []);

  const fetchRepuestos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/repuestos");
      if (res.ok) {
        const data = await res.json();
        setRepuestos(data);
      }
    } catch (error) {
      console.error("Error fetching repuestos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.nombre) return;

    setLoading(true);
    try {
      const url = editingRepuesto ? `/api/repuestos/${editingRepuesto.id}` : "/api/repuestos";
      const method = editingRepuesto ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.nombre,
          descripcion: formData.descripcion || null,
          cantidad: parseInt(formData.cantidad) || 0,
          precioCompra: formData.precioCompra ? parseFloat(formData.precioCompra) : null,
          precioVenta: formData.precioVenta ? parseFloat(formData.precioVenta) : null,
          stockMinimo: parseInt(formData.stockMinimo) || 1,
        }),
      });

      if (res.ok) {
        fetchRepuestos();
        closeDialog();
      }
    } catch (error) {
      console.error("Error saving repuesto:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este repuesto?")) return;

    try {
      const res = await fetch(`/api/repuestos/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchRepuestos();
      }
    } catch (error) {
      console.error("Error deleting repuesto:", error);
    }
  };

  const openEditDialog = (repuesto: Repuesto) => {
    setEditingRepuesto(repuesto);
    setFormData({
      nombre: repuesto.nombre,
      descripcion: repuesto.descripcion || "",
      cantidad: repuesto.cantidad.toString(),
      precioCompra: repuesto.precioCompra?.toString() || "",
      precioVenta: repuesto.precioVenta?.toString() || "",
      stockMinimo: repuesto.stockMinimo.toString(),
    });
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingRepuesto(null);
    setFormData({
      nombre: "",
      descripcion: "",
      cantidad: "0",
      precioCompra: "",
      precioVenta: "",
      stockMinimo: "1",
    });
  };

  const filteredRepuestos = repuestos.filter((r) =>
    r.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockCount = repuestos.filter((r) => r.cantidad <= r.stockMinimo).length;

  return (
    <div className="space-y-4">
      {lowStockCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <span className="text-sm text-yellow-700">
            {lowStockCount} repuesto(s) con stock bajo
          </span>
        </div>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Buscar repuesto..."
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
        {filteredRepuestos.map((repuesto) => {
          const isLowStock = repuesto.cantidad <= repuesto.stockMinimo;
          return (
            <Card key={repuesto.id} className={isLowStock ? "border-yellow-300" : ""}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{repuesto.nombre}</span>
                      {isLowStock && (
                        <Badge variant="pending" className="text-xs">
                          Stock bajo
                        </Badge>
                      )}
                    </div>
                    {repuesto.descripcion && (
                      <p className="text-sm text-gray-500 mt-1">{repuesto.descripcion}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-gray-500">Cantidad:</span>{" "}
                        <span className={`font-medium ${isLowStock ? "text-yellow-600" : ""}`}>
                          {repuesto.cantidad}
                        </span>
                      </div>
                      {repuesto.precioVenta && (
                        <div>
                          <span className="text-gray-500">Precio:</span>{" "}
                          <span className="font-medium">${repuesto.precioVenta.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEditDialog(repuesto)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(repuesto.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredRepuestos.length === 0 && (
          <p className="text-center text-gray-500 py-8">No hay repuestos</p>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRepuesto ? "Editar Repuesto" : "Nuevo Repuesto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre del repuesto"
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Input
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción opcional"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  value={formData.cantidad}
                  onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Stock mínimo</Label>
                <Input
                  type="number"
                  value={formData.stockMinimo}
                  onChange={(e) => setFormData({ ...formData, stockMinimo: e.target.value })}
                  placeholder="1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Precio compra</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.precioCompra}
                  onChange={(e) => setFormData({ ...formData, precioCompra: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Precio venta</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.precioVenta}
                  onChange={(e) => setFormData({ ...formData, precioVenta: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {editingRepuesto ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
