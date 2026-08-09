import os
from supabase import create_client

SUPABASE_URL = "https://idiqnfrpbslnagkmuvck.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkaXFuZnJwYnNsbmFna211dmNrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTc0NTg3MCwiZXhwIjoyMTAxMzIxODcwfQ.SoL82AINtVf6LTGLS4VvOlXg0i1upjWb5bjversndk8"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# 1. Clear existing profiles
res = supabase.table("profiles").select("id").execute()
for p in res.data:
    supabase.table("profiles").delete().eq("id", p["id"]).execute()

# 2. Get existing users and delete them
# Wait, list_users() failed before. Let's just create them with fixed emails. If they exist, we might get an error, but we can catch it.
# Actually we can try to use delete_user on the ids we got from profiles, but they might not be auth users if they were mocked.
for p in res.data:
    try:
        supabase.auth.admin.delete_user(p["id"])
    except:
        pass

users_to_create = [
    {
        "email": "customer@grovio.app",
        "password": "password123",
        "role": "customer",
        "name": "Customer User"
    },
    {
        "email": "shopper@grovio.app",
        "password": "password123",
        "role": "shopper",
        "name": "Delivery Shopper"
    },
    {
        "email": "admin@grovio.app",
        "password": "password123",
        "role": "admin",
        "name": "Store Admin"
    }
]

for u in users_to_create:
    try:
        # Create auth user
        user = supabase.auth.admin.create_user({
            "email": u["email"],
            "password": u["password"],
            "email_confirm": True,
            "user_metadata": {
                "full_name": u["name"],
                "role": u["role"]
            },
            "app_metadata": {
                "role": u["role"]
            }
        })
        user_id = user.user.id
        print(f"Created user {u['email']} with id {user_id}")
        
        # Insert profile
        supabase.table("profiles").insert({
            "id": user_id,
            "full_name": u["name"],
            "email": u["email"]
        }).execute()
        print(f"Created profile for {u['email']}")
        
    except Exception as e:
        print(f"Error for {u['email']}: {e}")

print("All done!")
