import enum
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    ForeignKey,
    DateTime,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

# Relative import fixes ModuleNotFoundError when running uvicorn backend.main:app
from .database import Base


class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"
    FARMER = "farmer"
    SUPERADMIN = "superadmin"


class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone_number = Column(String(50), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default=UserRole.USER.value, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_approved = Column(Boolean, default=True, nullable=False)  # For admin approval workflow
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    products = relationship("ProductModel", back_populates="owner", cascade="all, delete-orphan")


class ProductModel(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False, index=True)
    price = Column(Float, nullable=False, index=True)
    unit = Column(String(50), default="kg", nullable=False)
    quantity_available = Column(Float, default=1.0, nullable=False)
    farmer = Column(String(150), nullable=False)
    location = Column(String(100), nullable=False, index=True)
    imageUrl = Column(String(500), nullable=True)
    is_available = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    owner = relationship("UserModel", back_populates="products")


class AdminInvitationModel(Base):
    __tablename__ = "admin_invitations"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, index=True)
    invitation_token = Column(String(255), unique=True, nullable=False, index=True)
    invited_by_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)

    invited_by = relationship("UserModel", foreign_keys=[invited_by_id])



class CropModel(Base):
    __tablename__ = "crops"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), default="Crops")
    location = Column(String(255), nullable=False)
    price = Column(String(100), default="Contact for price")
    farmer = Column(String(255), nullable=False)
    imageUrl = Column(String(500), default="/images/ll.jpg")
    status = Column(String(50), default="Pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class OrderModel(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    crop_id = Column(Integer, ForeignKey("crops.id", ondelete="SET NULL"), nullable=True)
    
    # Order details
    product_name = Column(String(255), nullable=False)
    product_category = Column(String(100), nullable=True)
    quantity = Column(Float, nullable=False)
    unit = Column(String(50), default="kg", nullable=False)
    price_per_unit = Column(String(100), nullable=False)
    total_price = Column(String(100), nullable=True)
    
    # Buyer info
    buyer_name = Column(String(255), nullable=False)
    buyer_email = Column(String(255), nullable=False)
    buyer_phone = Column(String(50), nullable=False)
    delivery_address = Column(Text, nullable=False)
    
    # Farmer/Seller info
    farmer_name = Column(String(255), nullable=False)
    farmer_location = Column(String(255), nullable=False)
    
    # Order status and tracking
    status = Column(String(50), default=OrderStatus.PENDING.value, nullable=False, index=True)
    notes = Column(Text, nullable=True)
    admin_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("UserModel", foreign_keys=[user_id])
    crop = relationship("CropModel", foreign_keys=[crop_id])
