import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Booking, User, Vehicle, VehicleCategory } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatEthiopianDateTime, formatEthiopianTimeOnly } from '@/lib/utils';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Car,
  Filter,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
} from 'lucide-react';

interface AvailabilityCalendarProps {
  currentUser: User;
  onSelectBooking?: (booking: Booking) => void;
  onRequestBookingWithVehicle?: (vehicle: Vehicle) => void;
}

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  currentUser,
  onSelectBooking,
  onRequestBookingWithVehicle,
}) => {
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [minCapacity, setMinCapacity] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');

  const [availabilityResults, setAvailabilityResults] = useState<any[]>([]);
  const [dayBookings, setDayBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAvailability = async () => {
    try {
      setIsLoading(true);
      const departureIso = new Date(`${selectedDate}T${startTime}:00`).toISOString();
      const returnIso = new Date(`${selectedDate}T${endTime}:00`).toISOString();

      const [avail, allBookings] = await Promise.all([
        api.getFleetAvailability(
          departureIso,
          returnIso,
          minCapacity > 0 ? minCapacity : undefined,
          categoryFilter !== 'ALL' ? (categoryFilter as VehicleCategory) : undefined
        ),
        api.getBookings({
          from: new Date(`${selectedDate}T00:00:00`).toISOString(),
          to: new Date(`${selectedDate}T23:59:59`).toISOString(),
        }),
      ]);

      setAvailabilityResults(avail);
      setDayBookings(allBookings);
    } catch (err) {
      console.error('Failed to load availability', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [selectedDate, startTime, endTime, categoryFilter, minCapacity]);

  const handleDayShift = (deltaDays: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + deltaDays);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const filteredAvailability = availabilityResults.filter((item) => {
    if (!searchTerm) return true;
    const v = item.vehicle;
    return (
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.make.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header and Date Range Navigator */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Fleet Availability & Schedules</h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time half-open interval <code className="font-mono text-slate-700">[start, end)</code> reservation calendar in Addis Ababa time.
          </p>
        </div>

        {/* Date Navigator Bar */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-subtle">
          <button
            type="button"
            onClick={() => handleDayShift(-1)}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-2 text-sm font-semibold text-slate-800">
            <CalendarIcon className="w-4 h-4 text-brand-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs sm:text-sm font-semibold text-slate-900 border-none bg-transparent focus:outline-none cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={() => handleDayShift(1)}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
            aria-label="Next day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Time Window and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Window Departure</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full text-xs sm:text-sm p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Window Return</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full text-xs sm:text-sm p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Vehicle Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full text-xs sm:text-sm p-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-brand-500"
          >
            <option value="ALL">All Categories</option>
            <option value="SUV">SUV</option>
            <option value="PICKUP">Pickup</option>
            <option value="SEDAN">Sedan</option>
            <option value="MINIBUS">Minibus</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Min. Passengers</label>
          <select
            value={minCapacity}
            onChange={(e) => setMinCapacity(parseInt(e.target.value, 10))}
            className="w-full text-xs sm:text-sm p-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-brand-500"
          >
            <option value={0}>Any capacity</option>
            <option value={4}>4+ Seats</option>
            <option value={7}>7+ Seats</option>
            <option value={14}>14+ Seats</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Search Fleet</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs sm:text-sm pl-8 pr-2 p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Availability Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAvailability.map((item) => {
          const v = item.vehicle;
          const isAvail = item.isAvailable;

          return (
            <Card
              key={v.id}
              className={`transition-all border ${
                isAvail
                  ? 'border-emerald-200/80 bg-white hover:border-emerald-400'
                  : 'border-slate-200 bg-slate-50/70 opacity-90'
              }`}
            >
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex items-start justify-between w-full">
                  <div>
                    <span className="text-[11px] font-semibold text-brand-700 uppercase tracking-wider">
                      {v.category} · {v.passengerCapacity} Seats
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5">{v.name}</h4>
                  </div>
                  <Badge status={item.availabilityStatus} size="sm" />
                </div>
              </CardHeader>

              <CardContent className="pt-3 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-mono">{v.registrationNumber}</span>
                  <span className="text-slate-400">{v.make} {v.model}</span>
                </div>

                {isAvail ? (
                  <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Free for booking during selected time window</span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-red-50 text-red-800 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block">{item.reason}</span>
                      {item.activeBookingConflict && onSelectBooking && (
                        <button
                          type="button"
                          onClick={() => onSelectBooking(item.activeBookingConflict)}
                          className="text-[11px] text-brand-700 underline font-medium mt-1 inline-block"
                        >
                          Inspect conflicting booking #{item.activeBookingConflict.bookingReference}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Day's Confirmed Trip Schedules */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-600" />
            <CardTitle className="text-sm">
              Today's Confirmed Dispatch Schedule ({selectedDate})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {dayBookings.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No bookings scheduled for this date.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {dayBookings.map((b) => (
                <div
                  key={b.id}
                  onClick={() => onSelectBooking && onSelectBooking(b)}
                  className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-brand-700">{b.bookingReference}</span>
                      <span className="text-slate-400">·</span>
                      <span className="font-semibold text-slate-900">{b.destination}</span>
                    </div>
                    <div className="text-slate-500">
                      Staff: {b.requester?.name} · Passengers: {b.passengerCount}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="font-medium text-slate-800 block">
                        {formatEthiopianTimeOnly(b.departureAt)} - {formatEthiopianTimeOnly(b.expectedReturnAt)}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {b.assignments?.[0]?.vehicle?.name || 'Unassigned'}
                      </span>
                    </div>
                    <Badge status={b.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
