import os
from supabase import create_client

SUPABASE_URL = "https://idiqnfrpbslnagkmuvck.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkaXFuZnJwYnNsbmFna211dmNrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTc0NTg3MCwiZXhwIjoyMTAxMzIxODcwfQ.SoL82AINtVf6LTGLS4VvOlXg0i1upjWb5bjversndk8"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Fetch all orders
orders_res = supabase.table("orders").select("id").execute()
orders = orders_res.data
print(f"Found {len(orders)} orders.")

for order in orders:
    try:
        supabase.table("orders").delete().eq("id", order["id"]).execute()
        print(f"Deleted order {order['id']}")
    except Exception as e:
        print(f"Error deleting order {order['id']}: {e}")

print("Done.")
