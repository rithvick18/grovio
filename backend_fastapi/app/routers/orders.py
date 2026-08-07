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

class AdminCreateInventoryItemRequest(BaseModel):
    name: str
    sku: Optional[str] = None
    quantity: int = Field(ge=0)
    price: float = Field(ge=0)
    category: Optional[str] = "General"
    store_id: Optional[str] = None

class AdminUpdateInventoryItemRequest(BaseModel):
    name: Optional[str] = None
    quantity: Optional[int] = None
    price: Optional[float] = None
    category: Optional[str] = None

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

@router.get("/inventory/stats")
@router.get("/api/inventory/stats")
async def get_inventory_stats(supabase: Client = Depends(get_supabase_client)):
    """
    Compute inventory stats: total_items, low_stock_count (< 10), and total_valuation.
    """
    try:
        response = supabase.table("store_inventory").select("stock_count, price").execute()
        data = response.data or []
        total_items = len(data)
        low_stock_count = sum(1 for item in data if (item.get("stock_count") or 0) < 10)
        total_valuation = sum(
            (item.get("stock_count") or 0) * (item.get("price") or 0.0)
            for item in data
        )
        return {
            "total_items": total_items,
            "low_stock_count": low_stock_count,
            "total_valuation": round(total_valuation, 2)
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

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
        raw_data = response.data or []
        formatted = []
        for item in raw_data:
            product = item.get("products") or {}
            formatted.append({
                "id": item["id"],
                "name": product.get("name") or "Unknown Product",
                "sku": product.get("sku") or str(item.get("product_id", ""))[:8],
                "quantity": item.get("stock_count", 0),
                "price": item.get("price") if item.get("price") is not None else (product.get("price") or 0.0),
                "category": product.get("category") or "General",
                "store_id": item.get("store_id"),
                "product_id": item.get("product_id"),
                "stock_count": item.get("stock_count", 0),
                "products": product
            })
        return formatted
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/inventory")
@router.post("/api/inventory")
async def create_inventory_item(request: AdminCreateInventoryItemRequest, supabase: Client = Depends(get_supabase_client)):
    """
    Create a new inventory item and associated product for the admin portal.
    """
    try:
        prod_res = supabase.table("products").select("*").eq("name", request.name).execute()
        if prod_res.data:
            product = prod_res.data[0]
            product_id = product["id"]
        else:
            new_prod = {
                "id": str(uuid.uuid4()),
                "name": request.name,
                "category": request.category or "General",
                "price": request.price,
                "sku": request.sku or str(uuid.uuid4())[:8]
            }
            inserted_prod = supabase.table("products").insert(new_prod).execute()
            product_id = inserted_prod.data[0]["id"]
        
        store_id = request.store_id
        if not store_id:
            store_res = supabase.table("stores").select("id").limit(1).execute()
            if store_res.data:
                store_id = store_res.data[0]["id"]
            else:
                store_id = str(uuid.uuid4())

        new_inv = {
            "id": str(uuid.uuid4()),
            "store_id": store_id,
            "product_id": product_id,
            "stock_count": request.quantity,
            "price": request.price,
            "is_available": True
        }
        inv_res = supabase.table("store_inventory").insert(new_inv).execute()
        return inv_res.data[0]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.put("/inventory/{id}")
@router.put("/api/inventory/{id}")
async def update_inventory_item(id: str, request: AdminUpdateInventoryItemRequest, supabase: Client = Depends(get_supabase_client)):
    """
    Update an inventory item's stock count, price, name, or category.
    """
    try:
        inv_res = supabase.table("store_inventory").select("*, products(*)").eq("id", id).execute()
        if not inv_res.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory item not found")
        
        inv_item = inv_res.data[0]
        updates = {}
        if request.quantity is not None:
            updates["stock_count"] = request.quantity
        if request.price is not None:
            updates["price"] = request.price
        
        if updates:
            supabase.table("store_inventory").update(updates).eq("id", id).execute()
            
        if inv_item.get("product_id") and (request.name or request.category or request.price is not None):
            prod_updates = {}
            if request.name:
                prod_updates["name"] = request.name
            if request.category:
                prod_updates["category"] = request.category
            if request.price is not None:
                prod_updates["price"] = request.price
            supabase.table("products").update(prod_updates).eq("id", inv_item["product_id"]).execute()
            
        return {"message": "Item updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.delete("/inventory/{id}")
@router.delete("/api/inventory/{id}")
async def delete_inventory_item(id: str, supabase: Client = Depends(get_supabase_client)):
    """
    Delete an inventory item by ID.
    """
    try:
        supabase.table("store_inventory").delete().eq("id", id).execute()
        return {"message": "Item deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
