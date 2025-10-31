from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.catalog_routes import router as catalog_router
from dotenv import load_dotenv
import os

# Load environment variables FIRST
load_dotenv()

# Print loaded variables for debugging
print("🔍 Environment Variables Loaded:")
print(f"   TWILIO_ACCOUNT_SID: {os.getenv('TWILIO_ACCOUNT_SID')[:10] if os.getenv('TWILIO_ACCOUNT_SID') else 'NOT SET'}...")
print(f"   TWILIO_AUTH_TOKEN: {'SET' if os.getenv('TWILIO_AUTH_TOKEN') else 'NOT SET'}")
print(f"   FIREBASE_STORAGE_BUCKET: {os.getenv('FIREBASE_STORAGE_BUCKET')}")

# Create FastAPI app
app = FastAPI(
    title="WhatsApp Catalog API",
    description="API for generating and sharing product catalogs via WhatsApp Business",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(catalog_router, prefix="/api/catalog", tags=["catalog"])

@app.get("/")
async def root():
    """API Root"""
    return {
        "message": "WhatsApp Catalog API",
        "status": "running",
        "docs": "/docs",
        "version": "1.0.0",
        "endpoints": {
            "catalog": "/api/catalog"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "firebase": "connected",
        "twilio": "configured" if os.getenv('TWILIO_ACCOUNT_SID') else "not configured"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)