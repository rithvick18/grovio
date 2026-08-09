import asyncio
from fastapi.testclient import TestClient
from app.main import app
from app.dependencies import get_current_user
from app.routers.orders import get_supabase_client
import uuid

def run_test():
    supabase = get_supabase_client()
    res = supabase.table('profiles').select('id').limit(1).execute()
    customer_id = res.data[0]['id'] if res.data else str(uuid.uuid4())

    mock_user = {
        "user_id": customer_id,
        "email": "test@example.com",
        "role": "customer"
    }
    app.dependency_overrides[get_current_user] = lambda: mock_user
    client = TestClient(app)

    print("Fetching inventory...")
    res = client.get("/inventory")
    inventory = res.json()
    first_item = inventory[0]
    store_id = first_item['store_id']
    product_id = first_item['product_id']
    initial_stock = first_item['stock_count']

    print(f"Product: {product_id} in Store: {store_id}")
    print(f"Initial Stock: {initial_stock}")

    print("\nPlacing order via /orders/checkout (simulating Customer App)...")
    checkout_data = {
        "customer_id": mock_user["user_id"],
        "store_id": store_id,
        "items": [
            {
                "product_id": product_id,
                "quantity": 1,
                "price": first_item['price']
            }
        ]
    }
    res_checkout = client.post("/orders/checkout", json=checkout_data)
    if res_checkout.status_code != 201:
        print(f"Checkout failed: {res_checkout.text}")
        return
    order_id = res_checkout.json()["order"]["id"]
    print(f"Order created successfully! ID: {order_id}")

    print("\nVerifying inventory decremented...")
    res_inv2 = client.get("/inventory")
    new_inventory = res_inv2.json()
    new_stock = next((item['stock_count'] for item in new_inventory if item['product_id'] == product_id and item['store_id'] == store_id), None)

    print(f"New Stock: {new_stock}")
    assert new_stock == initial_stock - 1, f"Expected {initial_stock - 1}, got {new_stock}"
    print("✅ Inventory correctly decremented in database")

    print("\nVerifying order is available for Delivery App...")
    order_res = supabase.table("orders").select("*").eq("id", order_id).execute()
    order = order_res.data[0]
    print(f"Order Status in DB: {order['status']}")
    assert order["status"] == "pending", f"Expected order status to be 'pending', got '{order['status']}'"
    print("✅ Order is 'pending' and visible to shoppers in the Delivery App")

if __name__ == "__main__":
    run_test()
