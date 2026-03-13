import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Building, User } from 'lucide-react'

interface Customer {
  id: string
  user_id: string
  email: string
  full_name: string
  phone: string | null
  company_name: string | null
  customer_type: 'individual' | 'business'
  status: 'active' | 'suspended' | 'churned'
  created_at: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const res = await fetch('http://localhost:3000/customers', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error('Failed to fetch customers')
      const data = await res.json()
      setCustomers(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(c => 
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.company_name?.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusColor = (status: Customer['status']) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25'
      case 'suspended': return 'bg-destructive/15 text-destructive hover:bg-destructive/25'
      case 'churned': return 'bg-slate-500/15 text-slate-700 dark:text-slate-400 hover:bg-slate-500/25'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-zinc-950/50">
      <div className="p-6 border-b border-border bg-card">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Customers</h1>
        <p className="text-sm text-muted-foreground">
          {customers.length} registered clients
        </p>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-4">
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or company..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 max-w-sm bg-card hover:bg-accent/50 transition-colors focus-visible:bg-card"
            />
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">
              {error}
            </div>
          )}

          <Card className="rounded-xl border-border/50 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground bg-muted/50 border-b border-border/50 uppercase">
                    <tr>
                      <th className="px-6 py-4 font-medium tracking-wider">Client</th>
                      <th className="px-6 py-4 font-medium tracking-wider">Type</th>
                      <th className="px-6 py-4 font-medium tracking-wider">Status</th>
                      <th className="px-6 py-4 font-medium tracking-wider">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 bg-card">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground animate-pulse">
                          Loading customers...
                        </td>
                      </tr>
                    ) : filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                          {search ? 'No customers match your search.' : 'No customers found.'}
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-accent/30 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <span className="font-semibold text-primary">
                                  {customer.full_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-foreground truncate">
                                  {customer.full_name}
                                  {customer.company_name && (
                                    <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                                      {customer.company_name}
                                    </span>
                                  )}
                                </span>
                                <span className="text-xs text-muted-foreground truncate">{customer.email}</span>
                                {customer.phone && (
                                  <span className="text-[10px] text-muted-foreground/80 mt-0.5">{customer.phone}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              {customer.customer_type === 'business' ? (
                                <Building className="w-3.5 h-3.5" />
                              ) : (
                                <User className="w-3.5 h-3.5" />
                              )}
                              <span className="capitalize">{customer.customer_type}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="secondary" className={`capitalize font-medium border-0 ${getStatusColor(customer.status)}`}>
                              {customer.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                            {new Date(customer.created_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
