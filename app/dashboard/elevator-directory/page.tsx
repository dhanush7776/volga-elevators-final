'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/client' // adjust path if yours differs

type Row = {
  key: string
  customer_id: string
  building_id: string | null
  elevator_id: string | null
  code: string | null
  name: string
  phone: string | null
  email: string | null
  city: string | null
  address: string | null
  gst: string | null
  active: boolean | null
  notes: string | null
  pincode: string | null
  elevator_type: string | null
  capacity_kg: number | null
  model: string | null
  last_service_date: string | null
  next_service_due: string | null
  status: string | null
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
  'phone',
  'email',
  'city',
  'address',
  'gst_number',
  'pincode',
  'elevator_type',
  'capacity_kg',
  'model',
  'status',
]

const Dash = () => <span className="text-slate-600">—</span>

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
        customer_code,
        name,
        email,
        phone,
        address,
        city,
        gst_number,
        is_active,
        notes,
        deleted_at,
        buildings (
          id,
          address,
          city,
          pincode,
          deleted_at,
          elevators (
            id,
            elevator_type,
            capacity_kg,
            model,
            last_service_date,
            next_service_due,
            status,
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

      const customerBase = {
        customer_id: c.id,
        code: c.customer_code,
        name: c.name,
        phone: c.phone,
        email: c.email,
        gst: c.gst_number,
        active: c.is_active,
        notes: c.notes,
      }

      if (activeBuildings.length === 0) {
        flat.push({
          key: `${c.id}-none`,
          ...customerBase,
          building_id: null,
          elevator_id: null,
          city: c.city,
          address: c.address,
          pincode: null,
          elevator_type: null,
          capacity_kg: null,
          model: null,
          last_service_date: null,
          next_service_due: null,
          status: null,
        })
        return
      }

      activeBuildings.forEach((b: any) => {
        const activeElevators = (b.elevators ?? []).filter((e: any) => !e.deleted_at)

        if (activeElevators.length === 0) {
          flat.push({
            key: `${c.id}-${b.id}-none`,
            ...customerBase,
            building_id: b.id,
            elevator_id: null,
            city: b.city ?? c.city,
            address: b.address ?? c.address,
            pincode: b.pincode,
            elevator_type: null,
            capacity_kg: null,
            model: null,
            last_service_date: null,
            next_service_due: null,
            status: null,
          })
          return
        }

        activeElevators.forEach((e: any) => {
          flat.push({
            key: e.id,
            ...customerBase,
            building_id: b.id,
            elevator_id: e.id,
            city: b.city ?? c.city,
            address: b.address ?? c.address,
            pincode: b.pincode,
            elevator_type: e.elevator_type,
            capacity_kg: e.capacity_kg,
            model: e.model,
            last_service_date: e.last_service_date,
            next_service_due: e.next_service_due,
            status: e.status,
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
        r.name.toLowerCase().includes(q) ||
        (r.code ?? '').toLowerCase().includes(q) ||
        (r.phone ?? '').toLowerCase().includes(q) ||
        (r.email ?? '').toLowerCase().includes(q) ||
        (r.city ?? '').toLowerCase().includes(q) ||
        (r.model ?? '').toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
  }, [rows, search, statusFilter])

  // ---------- EXPORT ----------

  function exportRowsToWorksheetData() {
    return filtered.map((r) => ({
      Code: r.code ?? '',
      Name: r.name,
      Phone: r.phone ?? '',
      Email: r.email ?? '',
      City: r.city ?? '',
      Address: r.address ?? '',
      GST: r.gst ?? '',
      Active: r.active ? 'Yes' : 'No',
      Notes: r.notes ?? '',
      Pincode: r.pincode ?? '',
      'Elevator Type': r.elevator_type ?? '',
      'Elevator Capacity (kg)': r.capacity_kg ?? '',
      'Elevator Model': r.model ?? '',
      'Last Service': r.last_service_date ?? '',
      'Next Service': r.next_service_due ?? '',
      Status: r.status ?? '',
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
      const customerCache = new Map<string, string>()

      for (let i = 0; i < parsedRows.length; i++) {
        const raw = parsedRows[i]
        const rowNum = i + 2

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
                  phone: String(raw.phone ?? '').trim() || null,
                  email: String(raw.email ?? '').trim() || null,
                  city: String(raw.city ?? '').trim() || null,
                  address: String(raw.address ?? '').trim() || null,
                  gst_number: String(raw.gst_number ?? '').trim() || null,
                })
                .select('id')
                .single()

              if (custInsertErr) throw custInsertErr
              customerId = newCustomer.id
              summary.customersCreated++
            }
            customerCache.set(customerName.toLowerCase(), customerId!)
          }

          // 2) find or create a single building for this customer (address/city/pincode)
          const address = String(raw.address ?? '').trim()
          const city = String(raw.city ?? '').trim()
          const pincode = String(raw.pincode ?? '').trim()
          let buildingId: string | null = null

          if (address || city || pincode) {
            const { data: existingBuilding, error: findBldErr } = await supabase
              .from('buildings')
              .select('id')
              .eq('customer_id', customerId)
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
                  name: `${customerName} Site`,
                  address: address || 'N/A',
                  city: city || null,
                  pincode: pincode || null,
                })
                .select('id')
                .single()

              if (bldInsertErr) throw bldInsertErr
              buildingId = newBuilding.id
              summary.buildingsCreated++
            }
          }

          // 3) create elevator if type/model/capacity/status info given
          const elevatorType = String(raw.elevator_type ?? '').trim()
          const model = String(raw.model ?? '').trim()
          const hasElevatorInfo = elevatorType || model || raw.capacity_kg

          if (buildingId && hasElevatorInfo) {
            const { error: insertErr } = await supabase.from('elevators').insert({
              building_id: buildingId,
              elevator_type: elevatorType || 'Passenger',
              model: model || null,
              capacity_kg: raw.capacity_kg ? Number(raw.capacity_kg) : null,
              status: String(raw.status ?? '').trim() || 'operational',
            })

            if (insertErr) throw insertErr
            summary.elevatorsCreated++
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
    e.target.value = ''
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
            Customer, site, and elevator details in one table
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
                <button onClick={handleExportExcel} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5">
                  Export as Excel
                </button>
                <button onClick={handleExportCSV} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5">
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
          placeholder="Search name, code, phone, email, city, model…"
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
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-white/10 text-left text-slate-400">
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">City</th>
                <th className="px-4 py-3 font-medium">Address</th>
                <th className="px-4 py-3 font-medium">GST</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3 font-medium">Notes</th>
                <th className="px-4 py-3 font-medium">Pincode</th>
                <th className="px-4 py-3 font-medium">Elevator Type</th>
                <th className="px-4 py-3 font-medium">Capacity</th>
                <th className="px-4 py-3 font-medium">Model</th>
                <th className="px-4 py-3 font-medium">Last Service</th>
                <th className="px-4 py-3 font-medium">Next Service</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={16} className="px-4 py-8 text-center text-slate-500">Loading…</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={16} className="px-4 py-8 text-center text-slate-500">No rows match your search.</td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.key} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors">
                    <td className="px-4 py-3 text-slate-300">{r.code ?? <Dash />}</td>
                    <td className="px-4 py-3 text-white font-medium">{r.name}</td>
                    <td className="px-4 py-3 text-slate-300">{r.phone ?? <Dash />}</td>
                    <td className="px-4 py-3 text-slate-300">{r.email ?? <Dash />}</td>
                    <td className="px-4 py-3 text-slate-300">{r.city ?? <Dash />}</td>
                    <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate">{r.address ?? <Dash />}</td>
                    <td className="px-4 py-3 text-slate-300">{r.gst ?? <Dash />}</td>
                    <td className="px-4 py-3">
                      {r.active ? <span className="text-emerald-300">Yes</span> : <span className="text-slate-500">No</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate">{r.notes ?? <Dash />}</td>
                    <td className="px-4 py-3 text-slate-300">{r.pincode ?? <Dash />}</td>
                    <td className="px-4 py-3 text-slate-300">{r.elevator_type ?? <Dash />}</td>
                    <td className="px-4 py-3 text-slate-300">{r.capacity_kg ?? <Dash />}</td>
                    <td className="px-4 py-3 text-slate-300">{r.model ?? <Dash />}</td>
                    <td className="px-4 py-3 text-slate-400">{r.last_service_date ?? <Dash />}</td>
                    <td className="px-4 py-3 text-slate-400">{r.next_service_due ?? <Dash />}</td>
                    <td className="px-4 py-3">
                      {r.status ? (
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs border ${STATUS_COLORS[r.status] ?? 'bg-slate-500/15 text-slate-300 border-slate-500/30'}`}>
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

      <div className="mt-3 text-xs text-slate-500 no-print">
        {filtered.length} row{filtered.length !== 1 ? 's' : ''}
      </div>

      {importOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 no-print p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d1119] p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Import Data</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Upload a .xlsx or .csv file. Matches existing customers by name.
                </p>
              </div>
              <button
                onClick={() => { setImportOpen(false); setImportSummary(null) }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <button onClick={handleDownloadTemplate} className="text-sm text-[#A7FEEB] hover:underline mb-4">
              Download import template
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={onFileSelected}
              disabled={importing}
              className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#A7FEEB]/15 file:text-[#A7FEEB] hover:file:bg-[#A7FEEB]/25"
            />

            {importing && <p className="mt-4 text-sm text-slate-400">Importing… this may take a moment.</p>}

            {importSummary && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
                <p className="text-white mb-1">
                  ✅ {importSummary.customersCreated} customers created, {importSummary.buildingsCreated} buildings created,{' '}
                  {importSummary.elevatorsCreated} elevators created.
                </p>
                {importSummary.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-rose-400 mb-1">{importSummary.errors.length} row(s) had issues:</p>
                    <ul className="text-xs text-rose-300 max-h-32 overflow-y-auto list-disc pl-4 space-y-0.5">
                      {importSummary.errors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}