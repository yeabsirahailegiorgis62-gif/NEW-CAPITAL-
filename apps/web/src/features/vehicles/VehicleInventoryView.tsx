import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Vehicle, User, VehicleCategory, VehicleOperationalStatus } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { VehicleModal } from './VehicleModal';
import {
  Car,
  Search,
  Filter,
  Plus,
  Edit,
  Wrench,
  Users,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface VehicleInventoryViewProps {
  currentUser: User;
  onReportIssue?: (vehicle: Vehicle) => void;
}

export const VehicleInventoryView: React.FC<VehicleInventoryViewProps> = ({
  currentUser,
  onReportIssue,
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isLogisticsOrAdmin =
    currentUser.role === 'LOGISTICS_ADMIN' || currentUser.role === 'SYSTEM_ADMIN';

  const fetchVehicles = async () => {
    try {
      setIsLoading(true);
      const data = await api.getVehicles();
      setVehicles(data);
    } catch (err) {
      console.error('Failed to load fleet', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleSaveVehicle = async (data: Partial<Vehicle>) => {
    if (editingVehicle) {
      await api.updateVehicle(editingVehicle.id, data);
    } else {
      await api.createVehicle(data);
    }
    await fetchVehicles();
  };

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || v.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || v.operationalStatus === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header with Title and Add Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Fleet Inventory & Management</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse company vehicles, review maintenance readiness, and configure fleet units.
          </p>
        </div>

        {isLogisticsOrAdmin && (
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setEditingVehicle(null);
              setIsModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add New Vehicle
          </Button>
        )}
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, make, model, or plate #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="ALL">All Categories</option>
            <option value="SUV">SUV</option>
            <option value="PICKUP">Pickup</option>
            <option value="SEDAN">Sedan</option>
            <option value="MINIBUS">Minibus</option>
            <option value="OTHER">Other</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Operational</option>
            <option value="MAINTENANCE">Under Maintenance</option>
            <option value="OUT_OF_SERVICE">Out of Service</option>
            <option value="INACTIVE">Deactivated</option>
          </select>
        </div>
      </div>

      {/* Vehicle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map((v) => {
          const carImg = v.imageUrl || (
            v.category === 'SUV' ? '/vehicles/prado.png' :
            v.category === 'PICKUP' ? (
              (v.name + ' ' + (v.model || '')).toLowerCase().includes('ranger') ? '/vehicles/ranger.png' :
              (v.name + ' ' + (v.model || '')).toLowerCase().includes('d-max') || (v.name + ' ' + (v.model || '')).toLowerCase().includes('dmax') ? '/vehicles/dmax.png' :
              '/vehicles/hilux.png'
            ) :
            v.category === 'MINIBUS' ? '/vehicles/hiace.png' :
            '/vehicles/corolla.png'
          );

          return (
            <Card key={v.id} className="overflow-hidden flex flex-col justify-between group">
              <div>
                {/* Car Photo Banner */}
                <div className="relative aspect-[16/10] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <img
                    src={carImg}
                    alt={v.name}
                    className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />
                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900/80 text-white backdrop-blur-md shadow-xs">
                      {v.category}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge status={v.operationalStatus} size="sm" />
                  </div>
                </div>

                <CardHeader className="pb-2 pt-3">
                  <div className="w-full">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors">
                      {v.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{v.make} {v.model}</p>
                  </div>
                </CardHeader>

                <CardContent className="pt-2 space-y-3">
                  <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 font-mono">Plate Registration:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-brand-300">{v.registrationNumber}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Passenger Capacity:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{v.passengerCapacity} Persons</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Transmission & Fuel:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{v.transmission || 'Automatic'} • {v.fuelLevel ? `${v.fuelLevel}% Fuel` : 'Diesel'}</span>
                    </div>
                  </div>

                  {v.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 pt-1">{v.description}</p>
                  )}
                </CardContent>
              </div>

              {/* Card Actions */}
              {isLogisticsOrAdmin && (
                <div className="p-3 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  {onReportIssue && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onReportIssue(v)}
                      leftIcon={<Wrench className="w-3.5 h-3.5 text-slate-500" />}
                      className="h-[38px] px-3 font-semibold text-xs border-slate-300 dark:border-slate-700"
                    >
                      Report Issue
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setEditingVehicle(v);
                      setIsModalOpen(true);
                    }}
                    leftIcon={<Edit className="w-3.5 h-3.5" />}
                    className="h-[38px] px-3.5 font-bold text-xs"
                  >
                    Edit Vehicle
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <VehicleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        vehicle={editingVehicle}
        onSave={handleSaveVehicle}
      />
    </div>
  );
};
