'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/client' // adjust path if yours differs

type Row = {
  key: string
  customer_id: string
  customer_name: string
  customer_phone: string | null
  building_id: string | null
  building_name: string | null
  building_city: string | null
  elevator_id: string | null
  elevator_code: string | null
  elevator_type: string | null
  brand: string | null
  model: string | null
  capacity_kg: number | null
  floors_served: number | null
  status: string | null
  next_service_due: string | null
}

type ImportSummary = {
  customersCreated: number
  buildingsCreated: number
  elevatorsCreated: number
  elevatorsUpdated: number
  errors: string[]
}

const STATUS_COLORS: Record<string, string> = {
  operational: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  under_maintenance: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  out_of_service: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
}

const IMPORT_TEMPLATE_HEADERS = [
  'customer_name',
  'customer_phone',
  'customer_city',
  'building_name',
  'building_city',
  'elevator_code',
  'elevator_type',
  'brand',
  'model',
  'capacity_kg',
  'floors_served',
  'status',
]

export default function ElevatorDirectoryPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function loadData() {
    const supabase = createClient()
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
            capacity_kg,
            floors_served,
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
          customer_id: c.id,
          customer_name: c.name,
          customer_phone: c.phone,
          building_id: null,
          building_name: null,
          building_city: null,
          elevator_id: null,
          elevator_code: null,
          elevator_type: null,
          brand: null,
          model: null,
          capacity_kg: null,
          floors_served: null,
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
            customer_id: c.id,
            customer_name: c.name,
            customer_phone: c.phone,
            building_id: b.id,
            building_name: b.name,
            building_city: b.city,
            elevator_id: null,
            elevator_code: null,
            elevator_type: null,
            brand: null,
            model: null,
            capacity_kg: null,
            floors_served: null,
            status: null,
            next_service_due: null,
          })
          return
        }

        activeElevators.forEach((e: any) => {
          flat.push({
            key: e.id,
            customer_id: c.id,
            customer_name: c.name,
            customer_phone: c.phone,
            building_id: b.id,
            building_name: b.name,
            building_city: b.city,
            elevator_id: e.id,
            elevator_code: e.elevator_code,
            elevator_type: e.elevator_type,
            brand: e.brand,
            model: e.model,
            capacity_kg: e.capacity_kg,
            floors_served: e.floors_served,
            status: e.status,
            next_service_due: e.next_service_due,
          })
        })
      })
    })

    setRows(flat)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
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

  // ---------- EXPORT ----------

  function exportRowsToWorksheetData() {
    return filtered.map((r) => ({
      Customer: r.customer_name,
      'Customer Phone': r.customer_phone ?? '',
      Building: r.building_name ?? '',
      'Building City': r.building_city ?? '',
      'Elevator Code': r.elevator_code ?? '',
      'Elevator Type': r.elevator_type ?? '',
      Brand: r.brand ?? '',
      Model: r.model ?? '',
      'Capacity (kg)': r.capacity_kg ?? '',
      'Floors Served': r.floors_served ?? '',
      Status: r.status ?? '',
      'Next Service Due': r.next_service_due ?? '',
    }))
  }

  function handleExportExcel() {
    const ws = XLSX.utils.json_to_sheet(exportRowsToWorksheetData())
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Elevator Directory')
    XLSX.writeFile(wb, `elevator-directory-${new Date().toISOString().slice(0, 10)}.xlsx`)
    setExportMenuOpen(false)
  }

  function handleExportCSV() {
    const ws = XLSX.utils.json_to_sheet(exportRowsToWorksheetData())
    const csv = XLSX.utils.sheet_to_csv(ws)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `elevator-directory-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setExportMenuOpen(false)
  }

  // ---------- PRINT ----------

  function handlePrint() {
    window.print()
  }

  // ---------- IMPORT ----------

  function handleDownloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([IMPORT_TEMPLATE_HEADERS])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template')
    XLSX.writeFile(wb, 'elevator-directory-import-template.xlsx')
  }

  async function handleImportFile(file: File) {
    setImporting(true)
    setImportSummary(null)

    const summary: ImportSummary = {
      customersCreated: 0,
      buildingsCreated: 0,
      elevatorsCreated: 0,
      elevatorsUpdated: 0,
      errors: [],
    }

    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const parsedRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

      if (parsedRows.length === 0) {
        summary.errors.push('File is empty or headers did not match the template.')
        setImportSummary(summary)
        setImporting(false)
        return
      }

      const supabase = createClient()

      // in-memory caches to avoid re-querying/re-creating within this batch
      const customerCache = new Map<string, string>() // name(lowercase) -> id
      const buildingCache = new Map<string, string>() // customerId|name(lowercase) -> id

      for (let i = 0; i < parsedRows.length; i++) {
        const raw = parsedRows[i]
        const rowNum = i + 2 // account for header row

        const customerName = String(raw.customer_name ?? '').trim()
        if (!customerName) {
          summary.errors.push(`Row ${rowNum}: missing customer_name, skipped.`)
          continue
        }

        try {
          // 1) find or create customer
          let customerId = customerCache.get(customerName.toLowerCase())

          if (!customerId) {
            const { data: existingCustomer, error: findCustErr } = await supabase
              .from('customers')
              .select('id')
              .ilike('name', customerName)
              .is('deleted_at', null)
              .maybeSingle()

            if (findCustErr) throw findCustErr

            if (existingCustomer) {
              customerId = existingCustomer.id
            } else {
              const { data: newCustomer, error: custInsertErr } = await supabase
                .from('customers')
                .insert({
                  name: customerName,
                  phone: String(raw.customer_phone ?? '').trim() || null,
                  city: String(raw.customer_city ?? '').trim() || null,
                })
                .select('id')
                .single()

              if (custInsertErr) throw custInsertErr
              customerId = newCustomer.id
              summary.customersCreated++
            }
            customerCache.set(customerName.toLowerCase(), customerId!)
          }

          // 2) find or create building (only if a building_name was given)
          const buildingName = String(raw.building_name ?? '').trim()
          let buildingId: string | null = null

          if (buildingName) {
            const buildingCacheKey = `${customerId}|${buildingName.toLowerCase()}`
            buildingId = buildingCache.get(buildingCacheKey) ?? null

            if (!buildingId) {
              const { data: existingBuilding, error: findBldErr } = await supabase
                .from('buildings')
                .select('id')
                .eq('customer_id', customerId)
                .ilike('name', buildingName)
                .is('deleted_at', null)
                .maybeSingle()

              if (findBldErr) throw findBldErr

              if (existingBuilding) {
                buildingId = existingBuilding.id
              } else {
                const { data: newBuilding, error: bldInsertErr } = await supabase
                  .from('buildings')
                  .insert({
                    customer_id: customerId,
                    name: buildingName,
                    address: String(raw.building_city ?? '').trim() || 'N/A',
                    city: String(raw.building_city ?? '').trim() || null,
                  })
                  .select('id')
                  .single()

                if (bldInsertErr) throw bldInsertErr
                buildingId = newBuilding.id
                summary.buildingsCreated++
              }
              buildingCache.set(buildingCacheKey, buildingId!)
            }
          }

          // 3) find or create/update elevator (only if building exists and elevator info given)
          const elevatorType = String(raw.elevator_type ?? '').trim()
          const brand = String(raw.brand ?? '').trim()
          const elevatorCode = String(raw.elevator_code ?? '').trim()
          const hasElevatorInfo = elevatorType || brand || elevatorCode

          if (buildingId && hasElevatorInfo) {
            const elevatorPayload: Record<string, any> = {
              building_id: buildingId,
              elevator_type: elevatorType || 'Passenger',
              brand: brand || null,
              model: String(raw.model ?? '').trim() || null,
              capacity_kg: raw.capacity_kg ? Number(raw.capacity_kg) : null,
              floors_served: raw.floors_served ? Number(raw.floors_served) : null,
              status: String(raw.status ?? '').trim() || 'operational',
            }

            if (elevatorCode) {
              const { data: existingElevator, error: findElevErr } = await supabase
                .from('elevators')
                .select('id')
                .eq('elevator_code', elevatorCode)
                .maybeSingle()

              if (findElevErr) throw findElevErr

              if (existingElevator) {
                const { error: updateErr } = await supabase
                  .from('elevators')
                  .update(elevatorPayload)
                  .eq('id', existingElevator.id)

                if (updateErr) throw updateErr
                summary.elevatorsUpdated++
              } else {
                const { error: insertErr } = await supabase
                  .from('elevators')
                  .insert(elevatorPayload)

                if (insertErr) throw insertErr
                summary.elevatorsCreated++
              }
            } else {
              const { error: insertErr } = await supabase
                .from('elevators')
                .insert(elevatorPayload)

              if (insertErr) throw insertErr
              summary.elevatorsCreated++
            }
          }
        } catch (rowErr: any) {
          summary.errors.push(`Row ${rowNum}: ${rowErr.message ?? 'unknown error'}`)
        }
      }
    } catch (fileErr: any) {
      summary.errors.push(`Could not read file: ${fileErr.message ?? 'unknown error'}`)
    }

    setImportSummary(summary)
    setImporting(false)
    await loadData()
  }

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleImportFile(file)
    e.target.value = '' // allow re-selecting the same file later
  }

  return (
    <div className="min-h-screen bg-[#0a0e14] text-slate-100 p-6 print:bg-white print:text-black">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          table { color: black !important; }
          th, td { color: black !important; border-color: #ccc !important; }
        }
      `}</style>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white print:text-black">
            Elevator Directory
          </h1>
          <p className="text-sm text-slate-400 mt-1 print:text-black">
            Every customer, with their buildings and elevators
          </p>
        </div>

        <div className="flex gap-2 no-print">
          <button
            onClick={() => setImportOpen(true)}
            className="px-4 py-2 rounded-xl text-sm border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
          >
            Import
          </button>

          <div className="relative">
            <button
              onClick={() => setExportMenuOpen((v) => !v)}
              className="px-4 py-2 rounded-xl text-sm border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
            >
              Export
            </button>
            {exportMenuOpen && (
              <div className="absolute right-0 mt-2 w-40 rounded-xl border border-white/10 bg-[#111621] shadow-xl z-10 overflow-hidden">
                <button
                  onClick={handleExportExcel}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5"
                >
                  Export as Excel
                </button>
                <button
                  onClick={handleExportCSV}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5"
                >
                  Export as CSV
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl text-sm border border-[#A7FEEB]/30 bg-[#A7FEEB]/10 text-[#A7FEEB] hover:bg-[#A7FEEB]/20 transition-colors"
          >
            Print
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4 no-print">
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

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden print:border-black print:bg-white">
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
              