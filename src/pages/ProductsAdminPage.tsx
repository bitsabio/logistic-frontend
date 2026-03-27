import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import apiClient from '@/api/client'
import {
  Package,
  Plus,
  Trash2,
  Search,
  Boxes,
  Pencil
} from 'lucide-react'

interface Product {
  id: string
  name: string
  sku: string
  barcode: string
  category: string
  weight_kg: string
  dimensions_cm: {
    h: number
    l: number
    w: number
  }
  unit_cost: number
}

export default function ProductsAdminPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [open, setOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const [form, setForm] = useState<any>({})

  const fetchProducts = async () => {
    const res = await apiClient.get('/products')
    setProducts(res.data)
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const addProduct = async () => {
    if (!form.name || !form.sku || !form.category || !form.weight_kg || !form.unit_cost) {
      alert('Please fill all required fields')
      return
    }

    await apiClient.post('/products', {
      ...form,
      weight_kg: Number(form.weight_kg),
      unit_cost: Number(form.unit_cost),
      dimensions_cm: {
        h: Number(form.h),
        l: Number(form.l),
        w: Number(form.w),
      },
      is_hazardous: false,
      requires_cold_storage: false,
    })

    setForm({})
    setOpen(false)
    fetchProducts()
  }

  const updateProduct = async () => {
    if (!selectedProduct) return

    await apiClient.put(`/products/${selectedProduct.id}`, {
      ...form,
      weight_kg: Number(form.weight_kg),
      unit_cost: Number(form.unit_cost),
      dimensions_cm: {
        h: Number(form.h),
        l: Number(form.l),
        w: Number(form.w),
      },
    })

    setIsEditing(false)
    setSelectedProduct(null)
    fetchProducts()
  }

  const deleteProduct = async (id: string) => {
  const confirmDelete = window.confirm("Are you sure you want to delete this product?")

  if (!confirmDelete) return

  await apiClient.delete(`/products/${id}`)
  fetchProducts()
}

  const categories = ['All', ...new Set(products.map(p => p.category))]

  const filteredProducts = products.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())

    const matchCategory =
      categoryFilter === 'All' || p.category === categoryFilter

    return matchSearch && matchCategory
  })

  return (
    <div className="p-6 space-y-6 h-screen overflow-y-auto"> {/* ✅ SCROLL FIX */}

      {/* HEADER */}
      <div className="flex justify-between items-center bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 p-6 rounded-3xl text-white shadow-xl">
        <div className="flex items-center gap-3">
          <Package size={28} />
          <div>
            <h2 className="text-2xl font-bold">Products</h2>
            <p className="text-sm opacity-80">Manage your inventory easily</p>
          </div>
        </div>

        <Button onClick={() => { setOpen(true); setForm({}) }} className="bg-white text-orange-600">
          <Plus size={16} /> Add Product
        </Button>
      </div>

      {/* SEARCH + TOTAL */}
<div className="flex gap-4 flex-wrap items-center">

  {/* SEARCH */}
  <div className="relative max-w-md">
    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
    <Input
      placeholder="Search products..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="pl-9"
    />
  </div>

  {/* CATEGORY */}
  <select
    value={categoryFilter}
    onChange={(e) => setCategoryFilter(e.target.value)}
    className="border rounded-md px-3 py-2"
  >
    {categories.map(cat => <option key={cat}>{cat}</option>)}
  </select>

  {/* 🔥 TOTAL PRODUCTS BOX */}
  <div className="ml-auto bg-gradient-to-r from-orange-100 to-orange-200 px-5 py-3 rounded-2xl shadow flex items-center gap-3">
    <div className="bg-orange-500 text-white p-2 rounded-full">
      <Boxes size={18} />
    </div>
    <div>
      <p className="text-xs text-gray-600">Total Products</p>
      <h3 className="text-lg font-bold text-orange-700">
        {products.length}
      </h3>
    </div>
  </div>

</div>

      {/* PRODUCTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map(p => (
          <div
            key={p.id}
            onClick={() => {
              setSelectedProduct(p)
              setForm({
                ...p,
                h: p.dimensions_cm?.h,
                l: p.dimensions_cm?.l,
                w: p.dimensions_cm?.w,
              })
              setIsEditing(false)
            }}
            className="cursor-pointer group relative rounded-2xl p-5 bg-white border shadow-sm hover:shadow-2xl hover:-translate-y-1 transition"
          >
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <p className="text-sm text-gray-500">{p.sku}</p>
              <p className="text-sm">{p.category}</p>
              <p className="text-orange-600 font-bold text-lg">₹{p.unit_cost}</p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                deleteProduct(p.id)
              }}
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        ))}
      </div>

     {/* ADD MODAL */}
{open && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto">
    
    <div className="bg-white rounded-3xl p-6 w-[380px] space-y-4 shadow-2xl border">

      {/* HEADER */}
      <div className="flex items-center gap-2 border-b pb-3">
        <div className="bg-orange-100 p-2 rounded-full">
          <Plus className="text-orange-500" size={18} />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">
          Add New Product
        </h3>
      </div>

      {/* FORM */}
      <div className="space-y-3">

        <Input 
          placeholder="Product Name" 
          className="focus:ring-2 focus:ring-orange-400"
          onChange={e => setForm({ ...form, name: e.target.value })}
        />

        <Input 
          placeholder="SKU Code" 
          className="focus:ring-2 focus:ring-orange-400"
          onChange={e => setForm({ ...form, sku: e.target.value })}
        />

        <Input 
          placeholder="Barcode" 
          className="focus:ring-2 focus:ring-orange-400"
          onChange={e => setForm({ ...form, barcode: e.target.value })}
        />

        <Input 
          placeholder="Category" 
          className="focus:ring-2 focus:ring-orange-400"
          onChange={e => setForm({ ...form, category: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input 
            type="number"
            placeholder="Weight (kg)" 
            className="focus:ring-2 focus:ring-orange-400"
            onChange={e => setForm({ ...form, weight_kg: e.target.value })}
          />

          <Input 
            type="number"
            placeholder="Price ₹" 
            className="focus:ring-2 focus:ring-orange-400"
            onChange={e => setForm({ ...form, unit_cost: e.target.value })}
          />
        </div>

        {/* DIMENSIONS */}
        <div className="grid grid-cols-3 gap-2">
          <Input placeholder="H" type="number" onChange={e => setForm({ ...form, h: e.target.value })} />
          <Input placeholder="L" type="number" onChange={e => setForm({ ...form, l: e.target.value })} />
          <Input placeholder="W" type="number" onChange={e => setForm({ ...form, w: e.target.value })} />
        </div>

      </div>

      {/* BUTTONS */}
      <div className="flex justify-end gap-3 pt-4 border-t">

        <Button
          variant="ghost"
          onClick={() => setOpen(false)}
          className="hover:bg-gray-100"
        >
          Cancel
        </Button>

        <Button
          onClick={addProduct}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md"
        >
          Add Product
        </Button>

      </div>

    </div>
  </div>
)}

      {/* DETAIL + EDIT MODAL */}
{selectedProduct && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto">

    <div className="bg-white rounded-3xl w-[420px] shadow-2xl max-h-[90vh] overflow-y-auto">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-5 rounded-t-3xl flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Product Details</h3>
          <p className="text-xs opacity-80">{selectedProduct.sku}</p>
        </div>
        <Package />
      </div>

      {/* BODY */}
      <div className="p-5 space-y-3">

        {isEditing ? (
          <>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} />
            <Input value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} />
            <Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
            <Input value={form.weight_kg} onChange={e => setForm({ ...form, weight_kg: e.target.value })} />

            <div className="grid grid-cols-3 gap-2">
              <Input value={form.h} onChange={e => setForm({ ...form, h: e.target.value })} />
              <Input value={form.l} onChange={e => setForm({ ...form, l: e.target.value })} />
              <Input value={form.w} onChange={e => setForm({ ...form, w: e.target.value })} />
            </div>

            <Input value={form.unit_cost} onChange={e => setForm({ ...form, unit_cost: e.target.value })} />

            <div className="flex gap-2 pt-3">
              <Button
                onClick={updateProduct}
                className="bg-orange-500 hover:bg-orange-600 text-white w-full"
              >
                Update
              </Button>
              <Button variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2 text-sm">
              <p><b>Name:</b> {selectedProduct.name}</p>
              <p><b>SKU:</b> {selectedProduct.sku}</p>
              <p><b>Barcode:</b> {selectedProduct.barcode}</p>
              <p><b>Category:</b> {selectedProduct.category}</p>
              <p><b>Weight:</b> {selectedProduct.weight_kg} kg</p>
              <p>
                <b>Dimensions:</b> {selectedProduct.dimensions_cm?.h} × {selectedProduct.dimensions_cm?.l} × {selectedProduct.dimensions_cm?.w}
              </p>
            </div>

            {/* PRICE CARD */}
            <div className="bg-orange-50 p-4 rounded-xl text-center">
              <p className="text-xs text-gray-500">Price</p>
              <h2 className="text-2xl font-bold text-orange-600">
                ₹{selectedProduct.unit_cost}
              </h2>
            </div>

            {/* ACTIONS */}
            <div className="flex justify-between items-center pt-3">

              <button
                onClick={async () => {
                  await deleteProduct(selectedProduct.id)
                  setSelectedProduct(null)
                }}
                className="text-red-500 text-sm"
              >
                Delete
              </button>

              <div className="flex gap-2">
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <Pencil size={14} /> Edit
                </Button>
                <Button onClick={() => setSelectedProduct(null)}>
                  Close
                </Button>
              </div>

            </div>
          </>
        )}

      </div>
    </div>
  </div>
)}
    </div>
  )
}