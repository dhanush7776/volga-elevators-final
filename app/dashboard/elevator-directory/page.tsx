'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client' // adjust path if yours differs

type Row = {
  key: string
  customer_name: string
  customer_phone: string | null
  building_name: string | null
  building_city: string | null
  elevator_code: string | null
  elevator_type: string | null
  brand: string | null
  model: string | null
  status: string | null
  next_service_due: string | null
}

const STATUS_COLORS: Record<string, string> = {
  operational: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  under_maintenance: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  out_of_service: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
}

export default function ElevatorDirectoryPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('customers')
        .select(`
          id,
          name,
          phone,
          deleted_at,
          buildings (
            id,
            name,
            city,
            deleted_at,
            elevators (
              id,
              elevator_code,
              elevator_type,
              brand,
              model,
              status,
              next_service_due,
              deleted_at
            )
          )
        `)
        .is('deleted_at', null)
        .order('name')

      if (error) {
        console.error('Failed to load elevator directory:', error)
        setLoading(false)
        return
      }

      const flat: Row[] = []

      ;(data ?? []).forEach((c: any) => {
        const activeBuildings = (c.buildings ?? []).filter((b: any) => !b.deleted_at)

        if (activeBuildings.length === 0) {
          flat.push({
            key: `${c.id}-none`,
            customer_name: c.name,
            customer_phone: c.phone,
            building_name: null,
            building_city: null,
            elevator_code: null,
            elevator_type: null,
            brand: null,
            model: null,
            status: null,
            next_service_due: null,
          })
          return
        }

        activeBuildings.forEach((b: any) => {
          const activeElevators = (b.elevators ?? []).filter((e: any) => !e.deleted_at)

          if (activeElevators.length === 0) {
            flat.push({
              key: `${c.id}-${b.id}-none`,
              customer_name: c.name,
              customer_phone: c.phone,
              building_name: b.name,
              building_city: b.city,
              elevator_code: null,
              elevator_type: null,
              brand: null,
              model: null,
              status: null,
              next_service_due: null,
            })
            return
          }

          activeElevators.forEach((e: any) => {
            flat.push({
              key: e.id,
              customer_name: c.name,
              customer_phone: c.phone,
              building_name: b.name,
              building_city: b.city,
              elevator_code: e.elevator_code,
              elevator_type: e.elevator_type,
              brand: e.brand,
              model: e.model,
              status: e.status,
              next_service_due: e.next_service_due,
            })
          })
        })
      })

      setRows(flat)
      setLoading(false)
    }

    load()
  }, [])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'none' && !r.status) ||
        r.status === statusFilter
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        (r.elevator_code ?? '').toLowerCase().includes(q) ||
        (r.building_name ?? '').toLowerCase().includes(q) ||
        r.customer_name.toLowerCase().includes(q) ||
        (r.brand ?? '').toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
  }, [rows, search, statusFilter])

  return (
    <div className="min-h-screen bg-[#0a0e14] text-slate-100 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Elevator Directory
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Every customer, with their buildings and elevators where they exist
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search elevator, building, customer, brand…"
          className="flex-1 bg-white/5 border border-white/10 backdrop-blur-md rounded-xl px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#A7FEEB]/40"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/10 backdrop-blur-md rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#A7FEEB]/40"
        >
          <option value="all">All statuses</option>
          <option value="operational">Operational</option>
          <option value="under_maintenance">Under maintenance</option>
          <option value="out_of_service">Out of service</option>
          <option value="none">No elevator yet</option>
        </select>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-slate-400">
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Building</th>
                <th className="px-4 py-3 font-medium">Elevator</th>
                <th className="px-4 py-3 font-medium">Type / Brand</th>
                <th className="px-4 py-3 font-medium">Next Service</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No rows match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr
                    key={r.key}
                    className="border-b border-white/5 hover:bg-white/[0.04] transition-colors"
                  >
                    <td className="px-4 py-3 text-white">
                      {r.customer_name}
                      {r.customer_phone && (
                        <div className="text-xs text-slate-500">{r.customer_phone}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {r.building_name ?? <span className="text-slate-600">—</span>}
                      {r.building_city && (
                        <span className="text-slate-500"> · {r.building_city}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">
                      {r.elevator_code ?? <span className="text-slate-600 font-normal">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {r.elevator_type ?? <span className="text-slate-600">—</span>}
                      {r.brand && <span className="text-slate-500"> · {r.brand}</span>}
                      {r.model && <span className="text-slate-500"> {r.model}</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {r.next_service_due ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {r.status ? (
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs border ${
                            STATUS_COLORS[r.status] ??
                            'bg-slate-500/15 text-slate-300 border-slate-500/30'
                          }`}
                        >
                          {r.status.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-1 rounded-full text-xs border bg-white/5 text-slate-500 border-white/10">
                          no elevator yet
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-500">
        {filtered.length} row{filtered.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}