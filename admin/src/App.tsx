import { useAuth } from "./context/AuthContext"
import { Login } from "./Login"
import { ProductsList } from "./components/ProductsList"

function Dashboard() {
  const { user, logout } = useAuth()

  return (
    <div style={{ fontFamily: "system-ui", padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1>Medusa Admin</h1>
          <p>Signed in as {user?.email}</p>
        </div>
        <button onClick={logout}>Logout</button>
      </header>

      <main>
        <ProductsList />
      </main>
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return <p>Loading session...</p>
  if (!user) return <Login />

  return <Dashboard />
}