import { useEffect, useState } from "react"
import { medusa } from "../medusa"
import type { AdminProductsListResponse } from "../types/medusa"

export function ProductsList() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<AdminProductsListResponse["products"]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await medusa.client.fetch<AdminProductsListResponse>("/admin/products", {
          method: "GET",
        })
        setProducts(res.products)
      } catch (err) {
        console.error(err)
        setError("Failed to load products")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <p>Loading products...</p>
  if (error) return <p style={{ color: "red" }}>{error}</p>

  return (
    <div>
      <h2>Products</h2>
      <table cellPadding={6}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.title}</td>
              <td>{p.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}