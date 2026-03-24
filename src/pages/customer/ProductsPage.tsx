import { useEffect, useState, useCallback } from 'react'
import { ShoppingCart, Search, Package, Plus, Minus, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { customerApi, type Product, type CartItem } from '@/api/customer'

interface ProductsPageProps {
  cart: CartItem[]
  onCartChange: (cart: CartItem[]) => void
  onGoToCart: () => void
}

export default function ProductsPage({ cart, onCartChange, onGoToCart }: ProductsPageProps) {
  const [products, setProducts]   = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [search, setSearch]       = useState('')
  const [category, setCategory]   = useState('')
  const [page, setPage]           = useState(1)
  const [meta, setMeta]           = useState({ total: 0, pages: 1 })
  const [addedMap, setAddedMap]   = useState<Record<string, boolean>>({})

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await customerApi.getProducts({
        page,
        limit: 12,
        search: search || undefined,
        category: category || undefined,
      })
      setProducts(res.data)
      setMeta({ total: res.meta.total, pages: res.meta.pages })
    } catch {
      setError('Failed to load products. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [page, search, category])

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [search, category])
  useEffect(() => { fetchProducts() }, [fetchProducts])

  useEffect(() => {
    customerApi.getCategories().then(setCategories).catch(() => {})
  }, [])
  
const [isOpen, setIsOpen] = useState(false)

const [formData, setFormData] = useState({
  name: "",
  sku: "",
  category: "",
  cost: "",
  weight: "",
  barcode: ""
})
  function getCartQty(productId: string): number {
    return cart.find(i => i.product.id === productId)?.quantity ?? 0
  }

  function addToCart(product: Product) {
    const existing = cart.find(i => i.product.id === product.id)
    if (existing) {
      onCartChange(cart.map(i =>
        i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
      ))
    } else {
      onCartChange([...cart, { product, quantity: 1 }])
    }
    // Flash feedback
    setAddedMap(m => ({ ...m, [product.id]: true }))
    setTimeout(() => setAddedMap(m => ({ ...m, [product.id]: false })), 800)
  }

  function adjustQty(productId: string, delta: number) {
    onCartChange(
      cart
        .map(i => i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i)
        .filter(i => i.quantity > 0)
    )
  }
// ADD PRODUCT FUNCTION
async function handleAddProduct() {
  try {
  await (customerApi as any).createProduct({
  sku: formData.sku,
  name: formData.name,
  category: formData.category,
  weight_kg: Number(formData.weight),
  unit_cost: Number(formData.cost),
  barcode: formData.barcode
})
    fetchProducts()
    setIsOpen(false)

setFormData({
  name: "",
  sku: "",
  category: "",
  cost: "",
  weight: "",
  barcode: ""
})
  } catch (err) {
    console.error(err)
  }
}

// DELETE PRODUCT FUNCTION
async function handleDeleteProduct(id: string) {
  try {
    await (customerApi as any).deleteProduct(id)
    fetchProducts()
  } catch (err) {
    console.error(err)
  }
}
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-card flex items-center justify-between gap-4">
        <Button
  onClick={() => setIsOpen(true)}
  className="bg-green-600 hover:bg-green-600 text-white"
>
  Add Product
</Button>
{/* ✅ STYLED POPUP */}
{isOpen && (
  <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
    <div className="bg-white rounded-xl shadow-xl w-[400px] p-6 space-y-4 animate-in fade-in zoom-in-95">

      <h2 className="text-xl font-semibold text-gray-800 text-center">
        Add Product
      </h2>

      {/* FORM FIELDS */}
      <div className="space-y-3">

        <div>
          <label className="text-sm font-medium text-gray-600">Product Name</label>
          <input
            className="w-full mt-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            value={formData.name}
            placeholder="Enter product name"
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">SKU</label>
          <input
            className="w-full mt-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            value={formData.sku}
            placeholder="Enter SKU"
            onChange={(e) => setFormData({...formData, sku: e.target.value})}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">Category</label>
          <input
            className="w-full mt-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            value={formData.category}
            placeholder="Enter category"
            onChange={(e) => setFormData({...formData, category: e.target.value})}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">Cost</label>
          <input
            className="w-full mt-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            value={formData.cost}
            placeholder="Enter cost"
            onChange={(e) => setFormData({...formData, cost: e.target.value})}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">Weight (kg)</label>
          <input
            className="w-full mt-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            value={formData.weight}
            placeholder="Enter weight"
            onChange={(e) => setFormData({...formData, weight: e.target.value})}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">Barcode</label>
          <input
            className="w-full mt-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            value={formData.barcode}
            placeholder="Enter barcode"
            onChange={(e) => setFormData({...formData, barcode: e.target.value})}
          />
        </div>

      </div>

      {/* BUTTONS */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleAddProduct}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-md font-medium transition"
        >
          Add Product
        </button>

        <button
          onClick={() => setIsOpen(false)}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-md font-medium transition"
        >
          Cancel
        </button>
      </div>

    </div>
  </div>
)}
        <div>
          <h1 className="text-xl font-semibold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Browse and add items to your order</p>
        </div>
        {cartCount > 0 && (
          <Button
            onClick={onGoToCart}
            className="bg-orange-500 hover:bg-orange-600 text-white gap-2 shrink-0"
          >
            <ShoppingCart className="w-4 h-4" />
            View Cart
            <span className="bg-white/20 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {cartCount}
            </span>
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-border bg-background flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setCategory('')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              category === ''
                ? 'bg-orange-500 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat === category ? '' : cat)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                category === cat
                  ? 'bg-orange-500 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {error && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive text-sm mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                <div className="h-3 bg-muted rounded w-1/2 mb-6" />
                <div className="h-6 bg-muted rounded w-1/3 mb-3" />
                <div className="h-8 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-foreground">No products found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {search || category ? 'Try adjusting your filters.' : 'No products available yet.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map(product => {
                const qty = getCartQty(product.id)
                const justAdded = addedMap[product.id]
                return (
                  <div
                    key={product.id}
                    className="rounded-xl border bg-card p-4 flex flex-col gap-3 hover:shadow-md transition-shadow"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-sm leading-snug truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{product.sku}</p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`shrink-0 text-[10px] font-medium border-0 ${
                          product.in_stock
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                            : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {product.in_stock ? 'In Stock' : 'Out of Stock'}
                      </Badge>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {product.category && <span>{product.category}</span>}
                      {product.weight_kg && <span>{product.weight_kg} kg</span>}
                      {product.dimensions_cm && (
                        <span>
                          {['l','w','h']
                            .map(k => (product.dimensions_cm as Record<string,number>)[k])
                            .filter(Boolean)
                            .join(' × ')} cm
                        </span>
                      )}
                    </div>

                    {/* Price */}
                    <p className="text-lg font-bold text-foreground">
                      {product.unit_price != null
                        ? `$${product.unit_price.toFixed(2)}`
                        : <span className="text-muted-foreground text-sm font-normal">Price on request</span>
                      }
                    </p>

                    {/* Cart controls */}
                    {qty === 0 ? (
                        <>
                          <Button
                            size="sm"
                            disabled={!product.in_stock}
                            onClick={() => addToCart(product)}
                            className={`w-full transition-all ${
                              justAdded
                                ? 'bg-emerald-500 hover:bg-emerald-500 text-white'
                                : 'bg-orange-500 hover:bg-orange-600 text-white'
                            }`}
                          >
                            {justAdded ? '✓ Added' : 'Add to Cart'}
                          </Button>

                          {/* ✅ DELETE BUTTON FOR ALL PRODUCTS */}
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="w-full mt-2 bg-orange-300 hover:bg-red-600 text-white text-sm rounded-md"
                          >
                            Delete Product
                          </button>
                        </>
                      ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => adjustQty(product.id, -1)}
                          className="w-8 h-8 rounded-md border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="flex-1 text-center text-sm font-semibold">{qty}</span>
                        <button
                          onClick={() => adjustQty(product.id, +1)}
                          disabled={qty >= product.quantity_available}
                          className="w-8 h-8 rounded-md border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {meta.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Page {page} of {meta.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === meta.pages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
