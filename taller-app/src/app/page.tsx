"use client";

import { useState, useEffect } from "react";
import { Calendar, Users, Car, Package, Plus, Wrench, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TurnosCalendario } from "@/components/turnos/TurnosCalendario";
import { NuevoTurnoDialog } from "@/components/turnos/NuevoTurnoDialog";
import { ClientesPage } from "@/components/clientes/ClientesPage";
import { VehiculosPage } from "@/components/vehiculos/VehiculosPage";
import { RepuestosPage } from "@/components/repuestos/RepuestosPage";
import { ReportesPage } from "@/components/reportes/ReportesPage";

type Tab = "turnos" | "clientes" | "vehiculos" | "repuestos" | "reportes";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("turnos");
  const [showNuevoTurno, setShowNuevoTurno] = useState(false);
  const [turnosRefreshToken, setTurnosRefreshToken] = useState(0);
  const [statsMonth, setStatsMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [stats, setStats] = useState({
    turnosPendientes: 0,
    turnosEnProgreso: 0,
    turnosCompletados: 0,
    totalClientes: 0,
  });

  useEffect(() => {
    fetchStats(statsMonth);
  }, [statsMonth]);

  const fetchStats = async (monthDate: Date) => {
    try {
      const mes = monthDate.getMonth() + 1;
      const anio = monthDate.getFullYear();
      const res = await fetch(`/api/stats?mes=${mes}&anio=${anio}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const tabs = [
    { id: "turnos" as Tab, label: "Turnos", icon: Calendar },
    { id: "clientes" as Tab, label: "Clientes", icon: Users },
    { id: "vehiculos" as Tab, label: "Vehículos", icon: Car },
    { id: "repuestos" as Tab, label: "Repuestos", icon: Package },
    { id: "reportes" as Tab, label: "Reportes", icon: FileText },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-primary to-primary/80 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Wrench className="h-8 w-8" />
            <h1 className="text-xl font-bold">Taller MV</h1>
          </div>
          {activeTab === "turnos" && (
            <Button
              onClick={() => setShowNuevoTurno(true)}
              variant="secondary"
              size="sm"
              className="hidden md:flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Nuevo Turno
            </Button>
          )}
        </div>
      </header>

      {/* Stats Cards - Solo visible en turnos */}
      {activeTab === "turnos" && (
        <div className="p-4 max-w-7xl mx-auto">
          <p className="text-xs text-gray-500 mb-2">
            Turnos del mes de {format(statsMonth, "MMMM yyyy", { locale: es })}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-gradient-to-br from-yellow-100 to-yellow-50 border-yellow-200 shadow-sm">
              <CardContent className="p-3">
                <div className="text-2xl font-bold text-yellow-800">{stats.turnosPendientes}</div>
                <div className="text-xs text-yellow-700">Pendientes</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-100 to-blue-50 border-blue-200 shadow-sm">
              <CardContent className="p-3">
                <div className="text-2xl font-bold text-blue-800">{stats.turnosEnProgreso}</div>
                <div className="text-xs text-blue-700">En Progreso</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-100 to-emerald-50 border-emerald-200 shadow-sm">
              <CardContent className="p-3">
                <div className="text-2xl font-bold text-emerald-800">{stats.turnosCompletados}</div>
                <div className="text-xs text-emerald-700">Completados</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-slate-100 to-slate-50 border-slate-200 shadow-sm">
              <CardContent className="p-3">
                <div className="text-2xl font-bold text-slate-800">{stats.totalClientes}</div>
                <div className="text-xs text-slate-700">Clientes</div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 max-w-7xl mx-auto pb-24">
        {activeTab === "turnos" && (
          <TurnosCalendario
            onRefresh={() => fetchStats(statsMonth)}
            refreshToken={turnosRefreshToken}
            onMonthChange={setStatsMonth}
            onDateSelect={setSelectedDate}
            onCreateTurno={() => setShowNuevoTurno(true)}
          />
        )}
        {activeTab === "clientes" && <ClientesPage />}
        {activeTab === "vehiculos" && <VehiculosPage />}
        {activeTab === "repuestos" && <RepuestosPage />}
        {activeTab === "reportes" && <ReportesPage />}
      </div>

      {activeTab === "turnos" && (
        <Button
          onClick={() => setShowNuevoTurno(true)}
          className="fixed bottom-24 right-4 h-14 w-14 rounded-full p-0 shadow-lg md:hidden"
          aria-label="Nuevo turno"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      {/* Bottom Navigation - Mobile First */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950 text-white border-t border-slate-900 shadow-lg">
        <div className="flex justify-around max-w-7xl mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center py-3 px-4 flex-1 transition-colors ${
                  activeTab === tab.id
                    ? "text-white bg-primary/80"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs mt-1">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Dialog Nuevo Turno */}
      <NuevoTurnoDialog
        open={showNuevoTurno}
        onOpenChange={setShowNuevoTurno}
        defaultDate={selectedDate}
        onSuccess={() => {
          setShowNuevoTurno(false);
          fetchStats(statsMonth);
          setTurnosRefreshToken((t) => t + 1);
        }}
      />
    </main>
  );
}
