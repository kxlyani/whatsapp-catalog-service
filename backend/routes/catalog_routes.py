"""
Feature: Pre-Saved Customer Contacts
Date: November 2025
Purpose: Improve WhatsApp sharing UX by allowing artisans to save and manage customer contacts
"""

from fastapi import APIRouter, HTTPException, Query
from firebase_admin import firestore 
from pydantic import BaseModel, validator
from typing import Optional, List

# Import after FastAPI setup to avoid circular imports
router = APIRouter()

# Import services AFTER router initialization
from services.catalog_service import CatalogService
from services.whatsapp_service import WhatsAppService

catalog_service = CatalogService()
whatsapp_service = WhatsAppService()

# ==================== EXISTING MODELS ====================
class GenerateCatalogRequest(BaseModel):
    artisan_id: str
    catalog_type: str = 'pdf'

class ShareWhatsAppRequest(BaseModel):
    artisan_id: str
    phone_number: str
    catalog_url: str
    custom_message: Optional[str] = None

class BulkShareRequest(BaseModel):
    artisan_id: str
    phone_numbers: List[str]
    catalog_url: str

# ==================== NEW CUSTOMER MODELS ====================
class AddCustomerRequest(BaseModel):
    name: str
    phone_number: str
    tags: Optional[List[str]] = []
    
    @validator('phone_number')
    def validate_phone(cls, v):
        """Ensure phone number has country code"""
        v = v.strip()
        # Remove any whatsapp: prefix
        if v.startswith('whatsapp:'):
            v = v.replace('whatsapp:', '')
        # Add +91 if no country code
        if not v.startswith('+'):
            v = '+91' + v.lstrip('0')
        # Basic validation
        if len(v) < 10:
            raise ValueError('Phone number too short')
        return v
    
    @validator('name')
    def validate_name(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters')
        return v.strip()

class UpdateCustomerRequest(BaseModel):
    name: Optional[str] = None
    phone_number: Optional[str] = None
    tags: Optional[List[str]] = None
    
    @validator('phone_number')
    def validate_phone(cls, v):
        if v is None:
            return v
        v = v.strip()
        if v.startswith('whatsapp:'):
            v = v.replace('whatsapp:', '')
        if not v.startswith('+'):
            v = '+91' + v.lstrip('0')
        if len(v) < 10:
            raise ValueError('Phone number too short')
        return v
    
    @validator('name')
    def validate_name(cls, v):
        if v is not None and len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters')
        return v.strip() if v else None

class BulkShareByCustomerRequest(BaseModel):
    artisan_id: str
    customer_ids: List[str]
    catalog_url: str
    custom_message: Optional[str] = None

# ==================== EXISTING ENDPOINTS ====================
@router.get("/")
async def catalog_root():
    """Catalog API root"""
    return {
        "message": "Catalog API is running",
        "endpoints": {
            "generate": "POST /generate",
            "share-whatsapp": "POST /share-whatsapp",
            "share-whatsapp-bulk": "POST /share-whatsapp-bulk",
            "share-whatsapp-customers": "POST /share-whatsapp-customers",
            "customers": "GET /customers/{artisan_id}",
            "add-customer": "POST /customers/{artisan_id}",
            "update-customer": "PUT /customers/{artisan_id}/{customer_id}",
            "delete-customer": "DELETE /customers/{artisan_id}/{customer_id}",
            "history": "GET /history/{artisan_id}",
            "shares": "GET /shares/{artisan_id}"
        }
    }

@router.post("/generate")
async def generate_catalog(request: GenerateCatalogRequest):
    """Generate product catalog (PDF or Image)"""
    try:
        if request.catalog_type == 'pdf':
            result = await catalog_service.generate_pdf_catalog(request.artisan_id)
        elif request.catalog_type == 'image':
            result = await catalog_service.generate_image_catalog(request.artisan_id)
        else:
            raise HTTPException(status_code=400, detail="Invalid catalog type. Use 'pdf' or 'image'")
        
        return result
    
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/share-whatsapp")
async def share_whatsapp(request: ShareWhatsAppRequest):
    """Share catalog via WhatsApp"""
    try:
        result = await whatsapp_service.send_catalog(
            request.artisan_id,
            request.phone_number,
            request.catalog_url,
            request.custom_message
        )
        return result
    
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/share-whatsapp-bulk")
async def share_whatsapp_bulk(request: BulkShareRequest):
    """Share catalog to multiple WhatsApp numbers (direct phone numbers)"""
    try:
        results = await whatsapp_service.send_bulk_catalog(
            request.artisan_id,
            request.phone_numbers,
            request.catalog_url
        )
        
        success_count = sum(1 for r in results if r['success'])
        
        return {
            'success': True,
            'total': len(results),
            'sent': success_count,
            'failed': len(results) - success_count,
            'results': results
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{artisan_id}")
async def get_catalog_history(artisan_id: str, limit: int = 10):
    """Get catalog generation history"""
    try:
        from firebase_config import db
        
        catalogs_ref = db.collection('catalogs')\
            .where('artisan_id', '==', artisan_id)\
            .order_by('created_at', direction=firestore.Query.DESCENDING)\
            .limit(limit)
        
        catalogs = []
        for doc in catalogs_ref.stream():
            catalog_data = doc.to_dict()
            catalogs.append(catalog_data)
        
        return {
            'success': True,
            'catalogs': catalogs
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/shares/{artisan_id}")
async def get_share_history(artisan_id: str, limit: int = 20):
    """Get WhatsApp share history"""
    try:
        from firebase_config import db
        from firebase_admin import firestore
        
        shares_ref = db.collection('whatsapp_shares')\
            .where('artisan_id', '==', artisan_id)\
            .order_by('created_at', direction=firestore.Query.DESCENDING)\
            .limit(limit)
        
        shares = []
        for doc in shares_ref.stream():
            share_data = doc.to_dict()
            # Mask phone number for privacy
            if 'phone_number' in share_data:
                phone = share_data['phone_number']
                share_data['phone_number'] = phone[:5] + '*****' + phone[-2:] if len(phone) > 7 else phone
            shares.append(share_data)
        
        return {
            'success': True,
            'shares': shares
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== NEW CUSTOMER MANAGEMENT ENDPOINTS ====================

@router.post("/customers/{artisan_id}")
async def add_customer(artisan_id: str, request: AddCustomerRequest):
    """
    Add a new customer contact for an artisan
    
    - Validates phone number format (adds +91 if missing)
    - Checks for duplicate phone numbers
    - Stores in Firestore subcollection: users/{artisan_id}/customers/{customer_id}
    """
    try:
        from firebase_config import db
        
        print(f"👤 Adding customer for artisan {artisan_id}")
        print(f"   Name: {request.name}")
        print(f"   Phone: {request.phone_number}")
        print(f"   Tags: {request.tags}")
        
        # Check if artisan exists
        artisan_ref = db.collection('users').document(artisan_id)
        artisan_doc = artisan_ref.get()
        if not artisan_doc.exists:
            raise HTTPException(status_code=404, detail=f"Artisan not found with ID: {artisan_id}")
        
        # Check for duplicate phone number
        existing_customers = db.collection('users').document(artisan_id)\
            .collection('customers')\
            .where('phone_number', '==', request.phone_number)\
            .limit(1)\
            .stream()
        
        if any(existing_customers):
            raise HTTPException(
                status_code=400, 
                detail=f"Customer with phone number {request.phone_number} already exists"
            )
        
        # Create new customer document
        customer_ref = db.collection('users').document(artisan_id)\
            .collection('customers').document()
        
        customer_data = {
            'id': customer_ref.id,
            'artisan_id': artisan_id,
            'name': request.name,
            'phone_number': request.phone_number,
            'tags': request.tags or [],
            'created_at': firestore.SERVER_TIMESTAMP,
            'updated_at': firestore.SERVER_TIMESTAMP,
            'total_orders': 0
        }
        
        customer_ref.set(customer_data)
        
        print(f"✅ Customer added successfully: {customer_ref.id}")
        
        return {
            'success': True,
            'customer_id': customer_ref.id,
            'message': 'Customer added successfully',
            'customer': {
                'id': customer_ref.id,
                'name': request.name,
                'phone_number': request.phone_number,
                'tags': request.tags
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error adding customer: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/customers/{artisan_id}")
async def get_customers(
    artisan_id: str,
    tag: Optional[str] = Query(None, description="Filter by tag"),
    sort: Optional[str] = Query("recent", description="Sort order: recent, name")
):
    """
    Get all customers for an artisan
    
    - Optional filters: tag
    - Optional sorting: recent (default), name
    - Returns customers ordered by created_at DESC
    """
    try:
        from firebase_config import db
        
        print(f"📋 Fetching customers for artisan {artisan_id}")
        print(f"   Filter tag: {tag}")
        print(f"   Sort by: {sort}")
        
        # Check if artisan exists
        artisan_ref = db.collection('users').document(artisan_id)
        artisan_doc = artisan_ref.get()
        if not artisan_doc.exists:
            raise HTTPException(status_code=404, detail=f"Artisan not found with ID: {artisan_id}")
        
        # Build query
        customers_ref = db.collection('users').document(artisan_id).collection('customers')
        
        # Apply tag filter if provided
        if tag:
            customers_ref = customers_ref.where('tags', 'array_contains', tag)
        
        # Apply sorting
        if sort == "name":
            customers_ref = customers_ref.order_by('name')
        else:  # Default: recent
            customers_ref = customers_ref.order_by('created_at', direction=firestore.Query.DESCENDING)
        
        # Fetch customers
        customers = []
        for doc in customers_ref.stream():
            customer_data = doc.to_dict()
            customers.append(customer_data)
        
        print(f"✅ Found {len(customers)} customers")
        
        return {
            'success': True,
            'count': len(customers),
            'customers': customers
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching customers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# @router.put("/customers/{artisan_id}/{customer_id}")
# async def update_customer(
#     artisan_id: str, 
#     customer_id: str, 
#     request: UpdateCustomerRequest
# ):
#     """
#     Update customer contact information
    
#     - Can update name, phone_number, tags
#     - Phone number uniqueness is validated if changed
#     - Updates updated_at timestamp
#     """
#     try:
#         from firebase_config import db
        
#         print(f"✏️ Updating customer {customer_id} for artisan {artisan_id}")
        
#         # Check if customer exists
#         customer_ref = db.collection('users').document(artisan_id)\
#             .collection('customers').document(customer_id)
#         customer_doc = customer_ref.get()
        
#         if not customer_doc.exists:
#             raise HTTPException(status_code=404, detail="Customer not found")
        
#         # Prepare update data
#         update_data = {
#             'updated_at': firestore.SERVER_TIMESTAMP
#         }
        
#         # Check for phone number uniqueness if being updated
#         if request.phone_number:
#             existing_customers = db.collection('users').document(artisan_id)\
#                 .collection('customers')\
#                 .where('phone_number', '==', request.phone_number)\
#                 .limit(2)\
#                 .stream()
            
#             existing_list = list(existing_customers)
#             # Allow if it's the same customer or no duplicates
#             if len(existing_list) > 0:
#                 if len(existing_list) > 1 or existing_list[0].id != customer_id:
#                     raise HTTPException(
#                         status_code=400,
#                         detail=f"Another customer with phone number {request.phone_number} already exists"
#                     )
            
#             update_data['phone_number'] = request.phone_number
#             print(f"   Updating phone: {request.phone_number}")
        
#         if request.name:
#             update_data['name'] = request.name
#             print(f"   Updating name: {request.name}")
        
#         if request.tags is not None:
#             update_data['tags'] = request.tags
#             print(f"   Updating tags: {request.tags}")
        
#         # Update customer
#         customer_ref.update(update_data)
        
#         print(f"✅ Customer updated successfully")
        
#         # Get updated customer data
#         updated_doc = customer_ref.get()
#         updated_data = updated_doc.to_dict()
        
#         return {
#             'success': True,
#             'message': 'Customer updated successfully',
#             'customer': updated_data
#         }
    
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"❌ Error updating customer: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))

# @router.delete("/customers/{artisan_id}/{customer_id}")
# async def delete_customer(artisan_id: str, customer_id: str):
    """
    Delete a customer contact
    
    - Permanently removes customer from Firestore
    - Cannot be undone
    """
    try:
        from firebase_config import db
        
        print(f"🗑️ Deleting customer {customer_id} for artisan {artisan_id}")
        
        # Check if customer exists
        customer_ref = db.collection('users').document(artisan_id)\
            .collection('customers').document(customer_id)
        customer_doc = customer_ref.get()
        
        if not customer_doc.exists:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Get customer data before deletion for response
        customer_data = customer_doc.to_dict()
        
        # Delete customer
        customer_ref.delete()
        
        print(f"✅ Customer deleted: {customer_data.get('name', 'Unknown')}")
        
        return {
            'success': True,
            'message': 'Customer deleted successfully',
            'deleted_customer': {
                'id': customer_id,
                'name': customer_data.get('name', 'Unknown')
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting customer: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/share-whatsapp-customers")
async def share_whatsapp_by_customers(request: BulkShareByCustomerRequest):
    """
    Share catalog to multiple customers using their customer IDs
    
    - Resolves phone numbers from Firestore
    - Sends WhatsApp messages via Twilio
    - Updates customer analytics (last_order_at, total_orders)
    - Returns detailed results for each customer
    """
    try:
        print(f"📤 Bulk sharing to {len(request.customer_ids)} customers")
        print(f"   Artisan: {request.artisan_id}")
        print(f"   Catalog: {request.catalog_url}")
        
        results = await whatsapp_service.send_bulk_catalog_by_customers(
            request.artisan_id,
            request.customer_ids,
            request.catalog_url,
            request.custom_message
        )
        
        success_count = sum(1 for r in results if r['success'])
        
        print(f"✅ Bulk share complete: {success_count}/{len(results)} sent successfully")
        
        return {
            'success': True,
            'total': len(results),
            'sent': success_count,
            'failed': len(results) - success_count,
            'results': results
        }
    
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"❌ Error in bulk share: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import Request

@router.post("/webhook/twilio")
async def twilio_webhook(request: Request):
    """
    Twilio WhatsApp Webhook

    Workflow:
    - Fired when ANY user sends message to Sandbox
    - Extracts phone number
    - Auto-creates customer entry as "New Lead" if not exists
    - Updates last_seen timestamp for analytics
    """
    try:
        from firebase_config import db

        form = await request.form()
        from_number = form.get("From")  # e.g. "whatsapp:+919876543210"
        message_body = form.get("Body", "")
        
        print("📩 Incoming WhatsApp Webhook:")
        print(f"   From: {from_number}")
        print(f"   Body: {message_body}")

        if not from_number:
            return {"success": False, "error": "Missing phone number"}

        # ✅ Clean phone number
        phone = from_number.replace("whatsapp:", "").strip()
        if not phone.startswith("+"):
            phone = "+91" + phone.lstrip("0")

        # ✅ TEMP artisan assignment (Sandbox only)
        # Later replace with dynamic artisan matching (based on business WhatsApp number)
        artisan_id = "test_artisan_1"  # TODO: Replace with real artisan selection logic

        customer_ref = db.collection('users').document(artisan_id)\
            .collection('customers').document(phone)

        # Check if customer exists
        customer_doc = customer_ref.get()

        if customer_doc.exists:
            print("🔄 Existing customer → updating last_seen")
            update_data = {
                "last_seen": firestore.SERVER_TIMESTAMP,
                "message_count": firestore.Increment(1)
            }
            customer_ref.update(update_data)

        else:
            print("🆕 New customer lead → creating record")
            new_customer_data = {
                "id": phone,
                "artisan_id": artisan_id,
                "name": "New Customer",
                "phone_number": phone,
                "tags": ["New Lead"],
                "created_at": firestore.SERVER_TIMESTAMP,
                "updated_at": firestore.SERVER_TIMESTAMP,
                "last_seen": firestore.SERVER_TIMESTAMP,
                "message_count": 1,
                "total_orders": 0
            }
            customer_ref.set(new_customer_data)

        print("✅ Webhook processed")
        return {"success": True}

    except Exception as e:
        print(f"❌ Webhook Error: {e}")
        return {"success": False, "error": str(e)}
