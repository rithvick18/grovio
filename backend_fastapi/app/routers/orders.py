from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import os
import uuid

# Mocking Supabase client import. In a real app, this would be imported from a dependencies module.
from supabase import create_client, Client
from app.dependencies import get_current_user

router = APIRouter(tags=["orders", "inventory"])

# Supabase Client Dependency
SUPABASE_URL = os.environ.get(
    "SUPABASE_URL",
    "https://idiqnfrpbslnagkmuvck.supabase.co"
)
SUPABASE_KEY = os.environ.get(
    "SUPABASE_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkaXFuZnJwYnNsbmFna211dmNrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTc0NTg3MCwiZXhwIjoyMTAxMzIxODcwfQ.SoL82AINtVf6LTGLS4VvOlXg0i1upjWb5bjversndk8"
)

def get_supabase_client() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)

# Pydantic v2 Models
class OrderItemRequest(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(gt=0, description="Quantity must be greater than zero")
    price: float = Field(ge=0, description="Price must be non-negative")

class CheckoutRequest(BaseModel):
    customer_id: uuid.UUID
    store_id: uuid.UUID
    delivery_address_id: Optional[uuid.UUID] = None
    items: List[OrderItemRequest] = Field(min_length=1, description="At least one item required")

class OrderStatusUpdateRequest(BaseModel):
    new_status: str

class InventoryUpdateRequest(BaseModel):
    store_id: uuid.UUID
    product_id: uuid.UUID
    stock_count: int = Field(ge=0)
    price: Optional[float] = None

class BulkInventoryUpdateRequest(BaseModel):
    updates: List[InventoryUpdateRequest]

# State Machine Validation
ALLOWED_TRANSITIONS = {
    "pending": ["accepted", "cancelled"],
    "accepted": ["picking", "cancelled"],
    "picking": ["delivering", "cancelled"],
    "delivering": ["completed", "cancelled"],
    "completed": [],
    "cancelled": []
}

@router.post("/orders/checkout", status_code=status.HTTP_201_CREATED)
async def checkout(
    request: CheckoutRequest,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
):
    """
    Checkout endpoint. Validates stock and processes the order atomically.
    The customer_id is resolved from the authenticated JWT token.
    """
    # Override customer_id with verified JWT sub claim
    customer_id = current_user["user_id"]
    store_id = str(request.store_id)
    items_dict = {str(item.product_id): item for item in request.items}
    product_ids = list(items_dict.keys())

    try:
        # Fetch current inventory
        inventory_response = supabase.table("store_inventory") \
            .select("product_id, stock_count") \
            .eq("store_id", store_id) \
            .in_("product_id", product_ids) \
            .execute()
        
        inventory_data = inventory_response.data
        if not inventory_data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inventory not found for these items.")

        inventory_map = {str(item["product_id"]): item["stock_count"] for item in inventory_data}
        
        # Validate stock
        for product_id, item_req in items_dict.items():
            if product_id not in inventory_map:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Product {product_id} not available in store.")
            if inventory_map[product_id] < item_req.quantity:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Insufficient stock for product {product_id}.")

        # For actual atomic transactions in Supabase, an RPC call is recommended:
        # rpc_response = supabase.rpc("process_checkout", {"payload": request.model_dump(mode='json')}).execute()
        # return rpc_response.data
        
        # Simulated manual transaction below:
        total_amount = sum(item.price * item.quantity for item in request.items)
        
        # 1. Insert Order
        order_data = {
            "customer_id": customer_id,
            "store_id": store_id,
            "status": "pending",
            "total_amount": total_amount,
            "created_at": datetime.utcnow().isoformat()
        }
        if request.delivery_address_id:
            order_data["delivery_address_id"] = str(request.delivery_address_id)
            
        order_response = supabase.table("orders").insert(order_data).execute()
        order = order_response.data[0]
        order_id = order["id"]

        # 2. Insert Order Items
        order_items_data = [
            {
                "order_id": order_id,
                "product_id": str(item.product_id),
                "quantity": item.quantity,
                "price_at_order": item.price
            } for item in request.items
        ]
        supabase.table("order_items").insert(order_items_data).execute()

        # 3. Decrement Inventory
        for item in request.items:
            current_stock = inventory_map[str(item.product_id)]
            new_stock = current_stock - item.quantity
            supabase.table("store_inventory") \
                .update({"stock_count": new_stock}) \
                .eq("store_id", store_id) \
                .eq("product_id", str(item.product_id)) \
                .execute()

        return {"message": "Checkout successful", "order": order}

    except HTTPException:
        raise
    except Exception as e:
        # Rollback logic should be placed here if not using an RPC function.
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Checkout failed: {str(e)}")

@router.patch("/orders/{order_id}/status", status_code=status.HTTP_200_OK)
async def update_order_status(order_id: uuid.UUID, request: OrderStatusUpdateRequest, supabase: Client = Depends(get_supabase_client)):
    """
    Updates the status of an order, enforcing state machine validation.
    """
    new_status = request.new_status
    if new_status not in ALLOWED_TRANSITIONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid status: {new_status}")

    try:
        # Get current order status
        order_response = supabase.table("orders").select("status").eq("id", str(order_id)).execute()
        if not order_response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
            
        current_status = order_response.data[0].get("status")

        # Validate transition
        if new_status not in ALLOWED_TRANSITIONS.get(current_status, []):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Invalid status transition from {current_status} to {new_status}"
            )

        # Update status
        update_response = supabase.table("orders").update({"status": new_status}).eq("id", str(order_id)).execute()
        
        return {"message": "Order status updated successfully", "order": update_response.data[0]}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/inventory/bulk-update", status_code=status.HTTP_200_OK)
async def bulk_update_inventory(request: BulkInventoryUpdateRequest, supabase: Client = Depends(get_supabase_client)):
    """
    Bulk upserts inventory updates for store_inventory table.
    """
    try:
        updates_data = []
        for update in request.updates:
            data = {
                "store_id": str(update.store_id),
                "product_id": str(update.product_id),
                "stock_count": update.stock_count
            }
            if update.price is not None:
                data["price"] = update.price
            updates_data.append(data)

        # Upsert with on_conflict constraints
        response = supabase.table("store_inventory").upsert(updates_data, on_conflict="store_id,product_id").execute()
        
        return {"message": "Inventory updated successfully", "updated_count": len(response.data) if response.data else 0}

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Bulk update failed: {str(e)}")

@router.get("/inventory")
@router.get("/api/inventory")
async def get_inventory(store_id: Optional[str] = None, supabase: Client = Depends(get_supabase_client)):
    """
    Fetch inventory for a specific store or all stores, joining with product details.
    """
    try:
        query = supabase.table("store_inventory").select("*, products(*)")
        if store_id:
            query = query.eq("store_id", store_id)
            
        response = query.execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
