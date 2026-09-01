import os
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from dotenv import load_dotenv

# Load environment variables from .env file BEFORE importing other modules
load_dotenv()

from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from sqlalchemy import or_

# Relative imports prevent import errors regardless of execution root
from . import models
from .database import engine, get_db

# Automatically create PostgreSQL / Supabase tables on startup
models.Base.metadata.create_all(bind=engine)

# Helper function for timezone-aware datetime
def utcnow():
    """Return current UTC time with timezone info"""
    return datetime.now(timezone.utc)

app = FastAPI(title="AddisFarmers API - Phase 4")

# Enable CORS for Next.js Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "addisfarmers_jwt_secret_key_2026_change_in_prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Use Argon2 for password hashing (better Windows support than bcrypt)
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# --- AUTH HELPERS ---
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.UserModel:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.UserModel).filter(models.UserModel.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def require_admin(current_user: models.UserModel = Depends(get_current_user)) -> models.UserModel:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required for this operation"
        )
    return current_user

def require_superadmin(current_user: models.UserModel = Depends(get_current_user)) -> models.UserModel:
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin privileges required for this operation"
        )
    return current_user

def require_admin_or_superadmin(current_user: models.UserModel = Depends(get_current_user)) -> models.UserModel:
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or Super admin privileges required for this operation"
        )
    return current_user


# --- PYDANTIC SCHEMAS ---
class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    phone_number: Optional[str] = None
    role: Optional[str] = "user"  # "user", "admin", or "farmer"

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    phone_number: Optional[str] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class ProductCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    price: float
    unit: Optional[str] = "kg"
    quantity_available: Optional[float] = 1.0
    farmer: str
    location: str
    imageUrl: Optional[str] = None

class ProductResponse(ProductCreate):
    id: int
    is_available: bool

    class Config:
        from_attributes = True


# --- AUTH ENDPOINTS ---
@app.post("/api/v1/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(models.UserModel).filter(models.UserModel.email == user_in.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email is already registered")

    user_role = user_in.role if user_in.role in ["user", "admin", "farmer", "superadmin"] else "user"
    
    # Admin registrations require approval (except first superadmin)
    is_approved = True
    if user_role == "admin":
        # Check if any superadmin exists
        superadmin_exists = db.query(models.UserModel).filter(models.UserModel.role == "superadmin").first()
        if superadmin_exists:
            is_approved = False  # Require approval
    
    new_user = models.UserModel(
        full_name=user_in.full_name,
        email=user_in.email,
        phone_number=user_in.phone_number,
        hashed_password=get_password_hash(user_in.password),
        role=user_role,
        is_approved=is_approved
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/v1/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.UserModel).filter(models.UserModel.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    # Check if admin user is approved
    if user.role == "admin" and not user.is_approved:
        raise HTTPException(
            status_code=403, 
            detail="Your admin account is pending approval. Please wait for a super admin to approve your request."
        )

    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


# --- OLD PRODUCT ENDPOINTS (DISABLED - USING CROPS INSTEAD) ---
# @app.get("/api/v1/products", response_model=List[ProductResponse])
# def query_products(
#     search: Optional[str] = None,
#     category: Optional[str] = None,
#     location: Optional[str] = None,
#     min_price: Optional[float] = Query(None, ge=0),
#     max_price: Optional[float] = Query(None, ge=0),
#     skip: int = Query(0, ge=0),
#     limit: int = Query(20, ge=1, le=100),
#     db: Session = Depends(get_db)
# ):
#     query = db.query(models.ProductModel)
#
#     if search:
#         query = query.filter(models.ProductModel.title.ilike(f"%{search}%"))
#     if category and category != "All":
#         query = query.filter(models.ProductModel.category == category)
#     if location and location != "All":
#         query = query.filter(models.ProductModel.location == location)
#     if min_price is not None:
#         query = query.filter(models.ProductModel.price >= min_price)
#     if max_price is not None:
#         query = query.filter(models.ProductModel.price <= max_price)
#
#     return query.offset(skip).limit(limit).all()

# @app.post("/api/v1/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
# def create_product(
#     product: ProductCreate,
#     db: Session = Depends(get_db),
#     admin_user: models.UserModel = Depends(require_admin)
# ):
#     db_product = models.ProductModel(**product.dict(), owner_id=admin_user.id)
#     db.add(db_product)
#     db.commit()
#     db.refresh(db_product)
#     return db_product


# --- SUPER ADMIN ENDPOINTS ---
class AdminRequestResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone_number: Optional[str]
    role: str
    is_approved: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ApprovalAction(BaseModel):
    user_id: int
    approved: bool

@app.get("/api/v1/superadmin/pending-admins", response_model=List[AdminRequestResponse])
def get_pending_admin_requests(
    db: Session = Depends(get_db),
    superadmin: models.UserModel = Depends(require_superadmin)
):
    """Get all pending admin registration requests"""
    pending_admins = db.query(models.UserModel).filter(
        models.UserModel.role == "admin",
        models.UserModel.is_approved == False
    ).order_by(models.UserModel.created_at.desc()).all()
    
    return pending_admins

@app.get("/api/v1/superadmin/all-admins", response_model=List[AdminRequestResponse])
def get_all_admins(
    db: Session = Depends(get_db),
    superadmin: models.UserModel = Depends(require_superadmin)
):
    """Get all admin users (approved and pending)"""
    admins = db.query(models.UserModel).filter(
        models.UserModel.role == "admin"
    ).order_by(models.UserModel.created_at.desc()).all()
    
    return admins

@app.post("/api/v1/superadmin/approve-admin")
def approve_admin_request(
    action: ApprovalAction,
    db: Session = Depends(get_db),
    superadmin: models.UserModel = Depends(require_superadmin)
):
    """Approve or deny an admin registration request"""
    user = db.query(models.UserModel).filter(
        models.UserModel.id == action.user_id,
        models.UserModel.role == "admin"
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Admin user not found")
    
    if action.approved:
        # Approve the admin
        user.is_approved = True
        db.commit()
        return {
            "success": True,
            "message": f"Admin {user.full_name} has been approved",
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name
            }
        }
    else:
        # Deny and delete the admin request
        db.delete(user)
        db.commit()
        return {
            "success": True,
            "message": f"Admin request for {user.full_name} has been denied and removed",
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name
            }
        }

@app.delete("/api/v1/superadmin/remove-admin/{user_id}")
def remove_admin(
    user_id: int,
    db: Session = Depends(get_db),
    superadmin: models.UserModel = Depends(require_superadmin)
):
    """Remove an existing admin user"""
    user = db.query(models.UserModel).filter(
        models.UserModel.id == user_id,
        models.UserModel.role == "admin"
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Admin user not found")
    
    # Prevent removing yourself if you're a superadmin acting as admin
    if user.id == superadmin.id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself")
    
    db.delete(user)
    db.commit()
    
    return {
        "success": True,
        "message": f"Admin {user.full_name} has been removed"
    }

@app.get("/api/v1/superadmin/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    superadmin: models.UserModel = Depends(require_superadmin)
):
    """Get statistics for super admin dashboard"""
    total_admins = db.query(models.UserModel).filter(models.UserModel.role == "admin").count()
    pending_admins = db.query(models.UserModel).filter(
        models.UserModel.role == "admin",
        models.UserModel.is_approved == False
    ).count()
    approved_admins = db.query(models.UserModel).filter(
        models.UserModel.role == "admin",
        models.UserModel.is_approved == True
    ).count()
    total_users = db.query(models.UserModel).filter(models.UserModel.role == "user").count()
    total_farmers = db.query(models.UserModel).filter(models.UserModel.role == "farmer").count()
    
    return {
        "total_admins": total_admins,
        "pending_admins": pending_admins,
        "approved_admins": approved_admins,
        "total_users": total_users,
        "total_farmers": total_farmers
    }


@app.get("/api/v1/admin/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: models.UserModel = Depends(require_admin_or_superadmin)
):
    """Get statistics for admin dashboard"""
    total_users = db.query(models.UserModel).count()
    total_farmers = db.query(models.UserModel).filter(models.UserModel.role == "farmer").count()
    total_buyers = db.query(models.UserModel).filter(models.UserModel.role == "user").count()
    total_admins = db.query(models.UserModel).filter(models.UserModel.role.in_(["admin", "superadmin"])).count()
    total_crops = db.query(models.CropModel).filter(models.CropModel.status == "Active").count()
    
    return {
        "total_users": total_users,
        "total_farmers": total_farmers,
        "total_buyers": total_buyers,
        "total_admins": total_admins,
        "total_crops": total_crops
    }


@app.get("/api/v1/admin/users")
def get_all_users(
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.UserModel = Depends(require_admin_or_superadmin)
):
    """Get all users (admin only) - optionally filter by role"""
    query = db.query(models.UserModel)
    
    if role and role != "all":
        query = query.filter(models.UserModel.role == role)
    
    users = query.order_by(models.UserModel.created_at.desc()).all()
    
    return [{
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone_number": user.phone_number,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at
    } for user in users]


# --- ADMIN INVITATION ENDPOINTS ---
import secrets
from datetime import timedelta

class InvitationCreate(BaseModel):
    email: EmailStr

class InvitationResponse(BaseModel):
    id: int
    email: EmailStr
    invitation_token: str
    invitation_url: str
    invited_by_email: str
    is_used: bool
    expires_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class AdminRegisterWithToken(BaseModel):
    invitation_token: str
    full_name: str
    password: str
    phone_number: Optional[str] = None

@app.post("/api/v1/superadmin/invite-admin", response_model=InvitationResponse)
def create_admin_invitation(
    invitation: InvitationCreate,
    db: Session = Depends(get_db),
    superadmin: models.UserModel = Depends(require_superadmin)
):
    """Generate an invitation link for a new admin"""
    
    # Check if email already exists as a user
    existing_user = db.query(models.UserModel).filter(models.UserModel.email == invitation.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="A user with this email already exists")
    
    # Check if there's already a pending invitation for this email
    now = utcnow()
    existing_invitation = db.query(models.AdminInvitationModel).filter(
        models.AdminInvitationModel.email == invitation.email,
        models.AdminInvitationModel.is_used == False,
        models.AdminInvitationModel.expires_at > now
    ).first()
    
    if existing_invitation:
        raise HTTPException(
            status_code=400, 
            detail="An active invitation for this email already exists"
        )
    
    # Generate secure random token
    invitation_token = secrets.token_urlsafe(32)
    
    # Create invitation (expires in 7 days)
    new_invitation = models.AdminInvitationModel(
        email=invitation.email,
        invitation_token=invitation_token,
        invited_by_id=superadmin.id,
        expires_at=utcnow() + timedelta(days=7)
    )
    
    db.add(new_invitation)
    db.commit()
    db.refresh(new_invitation)
    
    # Generate invitation URL (frontend will handle this route)
    invitation_url = f"http://localhost:3000/admin/accept-invite?token={invitation_token}"
    
    return {
        "id": new_invitation.id,
        "email": new_invitation.email,
        "invitation_token": new_invitation.invitation_token,
        "invitation_url": invitation_url,
        "invited_by_email": superadmin.email,
        "is_used": new_invitation.is_used,
        "expires_at": new_invitation.expires_at,
        "created_at": new_invitation.created_at
    }

@app.get("/api/v1/superadmin/invitations", response_model=List[InvitationResponse])
def get_all_invitations(
    db: Session = Depends(get_db),
    superadmin: models.UserModel = Depends(require_superadmin)
):
    """Get all admin invitations (active and used)"""
    invitations = db.query(models.AdminInvitationModel).order_by(
        models.AdminInvitationModel.created_at.desc()
    ).all()
    
    result = []
    for inv in invitations:
        invited_by = db.query(models.UserModel).filter(models.UserModel.id == inv.invited_by_id).first()
        invitation_url = f"http://localhost:3000/admin/accept-invite?token={inv.invitation_token}"
        
        result.append({
            "id": inv.id,
            "email": inv.email,
            "invitation_token": inv.invitation_token,
            "invitation_url": invitation_url,
            "invited_by_email": invited_by.email if invited_by else "Unknown",
            "is_used": inv.is_used,
            "expires_at": inv.expires_at,
            "created_at": inv.created_at
        })
    
    return result

@app.delete("/api/v1/superadmin/revoke-invitation/{invitation_id}")
def revoke_invitation(
    invitation_id: int,
    db: Session = Depends(get_db),
    superadmin: models.UserModel = Depends(require_superadmin)
):
    """Revoke an unused invitation"""
    invitation = db.query(models.AdminInvitationModel).filter(
        models.AdminInvitationModel.id == invitation_id
    ).first()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    if invitation.is_used:
        raise HTTPException(status_code=400, detail="Cannot revoke an invitation that has already been used")
    
    db.delete(invitation)
    db.commit()
    
    return {
        "success": True,
        "message": f"Invitation for {invitation.email} has been revoked"
    }

@app.get("/api/v1/admin/validate-invitation/{token}")
def validate_invitation_token(token: str, db: Session = Depends(get_db)):
    """Validate an invitation token and return invitation details"""
    invitation = db.query(models.AdminInvitationModel).filter(
        models.AdminInvitationModel.invitation_token == token
    ).first()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invalid invitation token")
    
    if invitation.is_used:
        raise HTTPException(status_code=400, detail="This invitation has already been used")
    
    if invitation.expires_at < utcnow():
        raise HTTPException(status_code=400, detail="This invitation has expired")
    
    return {
        "valid": True,
        "email": invitation.email,
        "expires_at": invitation.expires_at
    }

@app.post("/api/v1/admin/register-with-invite", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_admin_with_invitation(admin_data: AdminRegisterWithToken, db: Session = Depends(get_db)):
    """Register a new admin using an invitation token"""
    
    # Validate invitation token
    invitation = db.query(models.AdminInvitationModel).filter(
        models.AdminInvitationModel.invitation_token == admin_data.invitation_token
    ).first()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invalid invitation token")
    
    if invitation.is_used:
        raise HTTPException(status_code=400, detail="This invitation has already been used")
    
    if invitation.expires_at < utcnow():
        raise HTTPException(status_code=400, detail="This invitation has expired")
    
    # Check if email already exists
    existing_user = db.query(models.UserModel).filter(
        models.UserModel.email == invitation.email
    ).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    # Create admin user with approved status
    new_admin = models.UserModel(
        full_name=admin_data.full_name,
        email=invitation.email,
        phone_number=admin_data.phone_number,
        hashed_password=get_password_hash(admin_data.password),
        role="admin",
        is_approved=True  # Auto-approved since they were invited
    )
    
    db.add(new_admin)
    
    # Mark invitation as used
    invitation.is_used = True
    invitation.used_at = datetime.utcnow()
    
    db.commit()
    db.refresh(new_admin)
    
    return new_admin


# Admin Dashboard Stats Endpoint
@app.get("/api/v1/admin/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: models.UserModel = Depends(get_current_user)
):
    """Get statistics for admin dashboard"""
    
    # Check if user is admin or superadmin
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Count users by role
    total_buyers = db.query(models.UserModel).filter(models.UserModel.role == "user").count()
    total_farmers = db.query(models.UserModel).filter(models.UserModel.role == "farmer").count()
    total_admins = db.query(models.UserModel).filter(models.UserModel.role == "admin").count()
    total_users = db.query(models.UserModel).count()
    
    # Count crops (assuming crops table exists)
    try:
        # Try to get crop count from crops table
        from sqlalchemy import inspect
        inspector = inspect(db.bind)
        tables = inspector.get_table_names()
        
        if 'crops' in tables:
            total_crops = db.execute(text("SELECT COUNT(*) FROM crops")).scalar()
        else:
            total_crops = 0
    except:
        total_crops = 0
    
    return {
        "total_buyers": total_buyers,
        "total_farmers": total_farmers,
        "total_admins": total_admins,
        "total_users": total_users,
        "total_crops": total_crops,
        "active_listings": total_crops  # Same as crops for now
    }


# Get all users endpoint for admin
@app.get("/api/v1/admin/all-users")
def get_all_users(
    db: Session = Depends(get_db),
    current_user: models.UserModel = Depends(get_current_user)
):
    """Get all registered users (admin/superadmin only)"""
    
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = db.query(models.UserModel).order_by(models.UserModel.created_at.desc()).all()
    
    return users


# Image upload endpoint
import shutil
from fastapi import UploadFile, File
from pathlib import Path
import uuid

# Create uploads directory if it doesn't exist
# Backend is in 'backend/' folder, public is in project root
UPLOAD_DIR = Path(__file__).parent.parent / "public" / "images" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@app.post("/api/v1/admin/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: models.UserModel = Depends(get_current_user)
):
    """Upload an image file (admin/superadmin only)"""
    
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate unique filename
    file_extension = file.filename.split(".")[-1] if file.filename else "jpg"
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Return URL path (relative to public folder)
        image_url = f"/images/uploads/{unique_filename}"
        
        return {
            "success": True,
            "filename": unique_filename,
            "url": image_url,
            "message": "Image uploaded successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")


# --- CROPS/PRODUCTS MANAGEMENT ENDPOINTS ---

# models.CropModel is now defined in models.py

class CropCreate(BaseModel):
    name: str
    farmer: str
    location: str
    category: Optional[str] = "Crops"
    price: Optional[str] = "Contact for price"
    imageUrl: Optional[str] = "/images/ll.jpg"
    status: Optional[str] = "Pending"

class CropUpdate(BaseModel):
    name: Optional[str] = None
    farmer: Optional[str] = None
    location: Optional[str] = None
    category: Optional[str] = None
    price: Optional[str] = None
    imageUrl: Optional[str] = None
    status: Optional[str] = None

class CropResponse(BaseModel):
    id: int
    title: str
    category: str
    location: str
    price: str
    farmer: str
    imageUrl: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Create crops table
models.Base.metadata.create_all(bind=engine)

@app.get("/api/v1/admin/crops", response_model=List[CropResponse])
def get_admin_crops(
    db: Session = Depends(get_db),
    current_user: models.UserModel = Depends(get_current_user)
):
    """Get all crops (admin only)"""
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    crops = db.query(models.CropModel).order_by(models.CropModel.created_at.desc()).all()
    return crops

@app.post("/api/v1/admin/crops", response_model=CropResponse, status_code=status.HTTP_201_CREATED)
def create_crop(
    crop: CropCreate,
    db: Session = Depends(get_db),
    current_user: models.UserModel = Depends(get_current_user)
):
    """Create a new crop listing (admin only)"""
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    new_crop = models.CropModel(
        title=crop.name,
        farmer=crop.farmer,
        location=crop.location,
        category=crop.category,
        price=crop.price,
        imageUrl=crop.imageUrl,
        status=crop.status
    )
    
    db.add(new_crop)
    db.commit()
    db.refresh(new_crop)
    
    return new_crop

@app.put("/api/v1/admin/crops/{crop_id}", response_model=CropResponse)
def update_crop(
    crop_id: int,
    crop_update: CropUpdate,
    db: Session = Depends(get_db),
    current_user: models.UserModel = Depends(get_current_user)
):
    """Update a crop listing (admin only)"""
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    crop = db.query(models.CropModel).filter(models.CropModel.id == crop_id).first()
    
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    
    if crop_update.name is not None:
        crop.title = crop_update.name
    if crop_update.farmer is not None:
        crop.farmer = crop_update.farmer
    if crop_update.location is not None:
        crop.location = crop_update.location
    if crop_update.category is not None:
        crop.category = crop_update.category
    if crop_update.price is not None:
        crop.price = crop_update.price
    if crop_update.imageUrl is not None:
        crop.imageUrl = crop_update.imageUrl
    if crop_update.status is not None:
        crop.status = crop_update.status
    
    db.commit()
    db.refresh(crop)
    
    return crop

@app.delete("/api/v1/admin/crops/{crop_id}")
def delete_crop(
    crop_id: int,
    db: Session = Depends(get_db),
    current_user: models.UserModel = Depends(get_current_user)
):
    """Delete a crop listing (admin only)"""
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    crop = db.query(models.CropModel).filter(models.CropModel.id == crop_id).first()
    
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    
    db.delete(crop)
    db.commit()
    
    return {"success": True, "message": "Crop deleted successfully"}

@app.get("/api/v1/products")
def get_marketplace_products(
    search: Optional[str] = None,
    category: Optional[str] = None,
    location: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get marketplace products (public endpoint)"""
    print(f"DEBUG: search={search}, category={category}, location={location}")
    
    query = db.query(models.CropModel).filter(models.CropModel.status == "Active")
    print(f"DEBUG: Initial query: {query}")
    
    if search:
        # Search in both title, farmer name, and location
        search_filter = or_(
            models.CropModel.title.ilike(f"%{search}%"),
            models.CropModel.farmer.ilike(f"%{search}%"),
            models.CropModel.location.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
        print(f"DEBUG: After search filter")
    
    if category and category != "All":
        query = query.filter(models.CropModel.category == category)
        print(f"DEBUG: After category filter")
    
    if location and location != "All":
        query = query.filter(models.CropModel.location.ilike(f"%{location}%"))
        print(f"DEBUG: After location filter")
    
    crops = query.order_by(models.CropModel.created_at.desc()).all()
    print(f"DEBUG: Found {len(crops)} crops")
    
    # Return as dict to debug
    result = [{
        "id": c.id,
        "title": c.title,
        "category": c.category,
        "location": c.location,
        "price": c.price,
        "farmer": c.farmer,
        "imageUrl": c.imageUrl,
        "status": c.status,
        "created_at": str(c.created_at)
    } for c in crops]
    
    print(f"DEBUG: Returning {len(result)} results")
    return result


# Public stats endpoint (no authentication required)
@app.get("/api/v1/public/stats")
def get_public_stats(db: Session = Depends(get_db)):
    """Get public statistics for homepage"""
    
    total_farmers = db.query(models.UserModel).filter(models.UserModel.role == "farmer").count()
    total_users = db.query(models.UserModel).count()
    
    # Count active crops
    try:
        total_crops = db.query(models.CropModel).filter(models.CropModel.status == "Active").count()
    except:
        total_crops = 0
    
    return {
        "total_farmers": total_farmers,
        "total_users": total_users,
        "total_crops": total_crops
    }


# Debug endpoint
@app.get("/api/v1/debug/crops")
def debug_crops(db: Session = Depends(get_db)):
    """Debug endpoint to test CropModel"""
    try:
        # Try to query using SQL directly first
        from sqlalchemy import text
        result = db.execute(text("SELECT COUNT(*) FROM crops WHERE status = 'Active'"))
        count = result.scalar()
        
        # Try to query using ORM
        crops = db.query(models.CropModel).all()
        
        return {
            "sql_count": count,
            "orm_count": len(crops),
            "crops": [{"id": c.id, "title": c.title, "status": c.status} for c in crops[:5]]
        }
    except Exception as e:
        return {"error": str(e), "type": type(e).__name__}


# ==========================================
# ORDER SYSTEM ENDPOINTS
# ==========================================

class OrderCreate(BaseModel):
    crop_id: int
    quantity: float
    unit: str = "kg"
    buyer_phone: str
    delivery_address: str
    notes: Optional[str] = None

class OrderUpdate(BaseModel):
    status: Optional[str] = None
    admin_notes: Optional[str] = None

class OrderResponse(BaseModel):
    id: int
    user_id: int
    crop_id: Optional[int]
    product_name: str
    product_category: Optional[str]
    quantity: float
    unit: str
    price_per_unit: str
    total_price: Optional[str]
    buyer_name: str
    buyer_email: str
    buyer_phone: str
    delivery_address: str
    farmer_name: str
    farmer_location: str
    status: str
    notes: Optional[str]
    admin_notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


@app.post("/api/v1/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: models.UserModel = Depends(get_current_user)
):
    """Create a new order (requires authentication)"""
    
    # Get the crop/product details
    crop = db.query(models.CropModel).filter(models.CropModel.id == order_data.crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if crop.status != "Active":
        raise HTTPException(status_code=400, detail="This product is not available for order")
    
    # Calculate total price (if price is numeric)
    total_price = None
    try:
        price_value = float(crop.price.replace('Br', '').replace(',', '').strip())
        total_price = f"Br {price_value * order_data.quantity:,.2f}"
    except:
        total_price = f"{crop.price} x {order_data.quantity}"
    
    # Create order
    new_order = models.OrderModel(
        user_id=current_user.id,
        crop_id=crop.id,
        product_name=crop.title,
        product_category=crop.category,
        quantity=order_data.quantity,
        unit=order_data.unit,
        price_per_unit=crop.price,
        total_price=total_price,
        buyer_name=current_user.full_name,
        buyer_email=current_user.email,
        buyer_phone=order_data.buyer_phone,
        delivery_address=order_data.delivery_address,
        farmer_name=crop.farmer,
        farmer_location=crop.location,
        status="pending",
        notes=order_data.notes
    )
    
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    
    return new_order


@app.get("/api/v1/orders/my-orders", response_model=List[OrderResponse])
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: models.UserModel = Depends(get_current_user)
):
    """Get all orders for the current user"""
    orders = db.query(models.OrderModel).filter(
        models.OrderModel.user_id == current_user.id
    ).order_by(models.OrderModel.created_at.desc()).all()
    
    return orders


@app.get("/api/v1/admin/orders", response_model=List[OrderResponse])
def get_all_orders(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.UserModel = Depends(require_admin_or_superadmin)
):
    """Get all orders (admin only)"""
    query = db.query(models.OrderModel)
    
    if status_filter:
        query = query.filter(models.OrderModel.status == status_filter)
    
    orders = query.order_by(models.OrderModel.created_at.desc()).all()
    return orders


@app.get("/api/v1/admin/orders/{order_id}", response_model=OrderResponse)
def get_order_detail(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.UserModel = Depends(require_admin_or_superadmin)
):
    """Get order details (admin only)"""
    order = db.query(models.OrderModel).filter(models.OrderModel.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return order


@app.patch("/api/v1/admin/orders/{order_id}", response_model=OrderResponse)
def update_order(
    order_id: int,
    order_update: OrderUpdate,
    db: Session = Depends(get_db),
    current_user: models.UserModel = Depends(require_admin_or_superadmin)
):
    """Update order status or add admin notes (admin only)"""
    order = db.query(models.OrderModel).filter(models.OrderModel.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order_update.status:
        valid_statuses = ["pending", "confirmed", "in_transit", "delivered", "cancelled"]
        if order_update.status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
        order.status = order_update.status
    
    if order_update.admin_notes is not None:
        order.admin_notes = order_update.admin_notes
    
    db.commit()
    db.refresh(order)
    
    return order


@app.get("/api/v1/admin/orders/stats/summary")
def get_order_stats(
    db: Session = Depends(get_db),
    current_user: models.UserModel = Depends(require_admin_or_superadmin)
):
    """Get order statistics (admin only)"""
    total_orders = db.query(models.OrderModel).count()
    pending_orders = db.query(models.OrderModel).filter(models.OrderModel.status == "pending").count()
    confirmed_orders = db.query(models.OrderModel).filter(models.OrderModel.status == "confirmed").count()
    delivered_orders = db.query(models.OrderModel).filter(models.OrderModel.status == "delivered").count()
    cancelled_orders = db.query(models.OrderModel).filter(models.OrderModel.status == "cancelled").count()
    
    return {
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "confirmed_orders": confirmed_orders,
        "delivered_orders": delivered_orders,
        "cancelled_orders": cancelled_orders
    }
