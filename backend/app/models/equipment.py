from __future__ import annotations

from sqlalchemy import String, ForeignKey, Enum, Integer, Numeric, DateTime, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from app.db.base import Base


# Equipment status enum
EquipmentStatus = Enum(
    "online",
    "offline", 
    "maintenance",
    "startup",
    "shutdown",
    "bypassed",
    name="equipment_status_enum",
)

# Equipment types enum
EquipmentType = Enum(
    "well",
    "flowline", 
    "manifold",
    "separator",
    "pump",
    "compressor",
    "meter",
    "pipeline",
    "storage_tank",
    "gas_plant",
    "dehydration_unit",
    name="equipment_type_enum",
)

# Connection types enum  
ConnectionType = Enum(
    "physical",
    "logical", 
    "control",
    "bypass",
    name="connection_type_enum",
)

# Network types enum
NetworkType = Enum(
    "oil",
    "domestic_gas",
    "export_gas", 
    "flared_gas",
    "water",
    "mixed",
    name="network_type_enum",
)


class BaseEquipment(Base):
    """Base equipment class with common attributes for all equipment types"""
    __tablename__ = "equipment"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    facility_id: Mapped[str | None] = mapped_column(ForeignKey("dim_facility.id", ondelete="CASCADE"), index=True, nullable=True)
    equipment_type: Mapped[str] = mapped_column(EquipmentType, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    tag_number: Mapped[str | None] = mapped_column(String, nullable=True, unique=True)
    
    # Operational status
    status: Mapped[str] = mapped_column(EquipmentStatus, nullable=False, default="offline")
    is_critical: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Capacity and performance
    design_capacity: Mapped[float | None] = mapped_column(Numeric(18, 3), nullable=True)
    current_throughput: Mapped[float | None] = mapped_column(Numeric(18, 3), nullable=True)
    efficiency: Mapped[float | None] = mapped_column(Numeric(6, 3), nullable=True)  # percentage
    capacity_unit: Mapped[str | None] = mapped_column(String, nullable=True)
    
    # Physical properties
    location_description: Mapped[str | None] = mapped_column(String, nullable=True)
    elevation: Mapped[float | None] = mapped_column(Numeric(10, 3), nullable=True)
    
    # Maintenance
    last_maintenance_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    next_maintenance_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    commissioned_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    facility: Mapped["Facility"] = relationship("Facility", back_populates="equipment")
    source_connections: Mapped[list["EquipmentConnection"]] = relationship(
        "EquipmentConnection", back_populates="source_equipment", foreign_keys="EquipmentConnection.source_equipment_id"
    )
    target_connections: Mapped[list["EquipmentConnection"]] = relationship(
        "EquipmentConnection", back_populates="target_equipment", foreign_keys="EquipmentConnection.target_equipment_id"
    )
    performance_data: Mapped[list["EquipmentPerformance"]] = relationship("EquipmentPerformance", back_populates="equipment")
    
    # Polymorphic identity
    __mapper_args__ = {
        "polymorphic_identity": "base",
        "polymorphic_on": equipment_type,
    }


class Flowline(BaseEquipment):
    """Flowline connecting wells to manifolds"""
    __tablename__ = "equipment_flowline"
    
    id: Mapped[str] = mapped_column(ForeignKey("equipment.id"), primary_key=True)
    
    # Flowline specific attributes
    length_km: Mapped[float | None] = mapped_column(Numeric(10, 3), nullable=True)
    diameter_inches: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    material: Mapped[str | None] = mapped_column(String, nullable=True)
    
    # Pressure characteristics  
    inlet_pressure: Mapped[float | None] = mapped_column(Numeric(10, 3), nullable=True)
    outlet_pressure: Mapped[float | None] = mapped_column(Numeric(10, 3), nullable=True)
    max_operating_pressure: Mapped[float | None] = mapped_column(Numeric(10, 3), nullable=True)
    
    __mapper_args__ = {"polymorphic_identity": "flowline"}


class Manifold(BaseEquipment):
    """Manifold collecting multiple flowlines"""
    __tablename__ = "equipment_manifold"
    
    id: Mapped[str] = mapped_column(ForeignKey("equipment.id"), primary_key=True)
    
    # Manifold specific attributes
    header_pressure: Mapped[float | None] = mapped_column(Numeric(10, 3), nullable=True)
    header_temperature: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    number_of_inlets: Mapped[int | None] = mapped_column(Integer, nullable=True)
    
    __mapper_args__ = {"polymorphic_identity": "manifold"}


class Separator(BaseEquipment):
    """Separator vessel for oil/gas/water separation"""
    __tablename__ = "equipment_separator"
    
    id: Mapped[str] = mapped_column(ForeignKey("equipment.id"), primary_key=True)
    
    # Separator specific attributes
    operating_pressure: Mapped[float | None] = mapped_column(Numeric(10, 3), nullable=True)
    operating_temperature: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    liquid_level: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)  # percentage
    vessel_volume: Mapped[float | None] = mapped_column(Numeric(10, 3), nullable=True)
    
    # Separation efficiency
    oil_recovery_efficiency: Mapped[float | None] = mapped_column(Numeric(6, 3), nullable=True)
    gas_recovery_efficiency: Mapped[float | None] = mapped_column(Numeric(6, 3), nullable=True)
    
    __mapper_args__ = {"polymorphic_identity": "separator"}


class Pump(BaseEquipment):
    """Pump for liquid movement"""
    __tablename__ = "equipment_pump"
    
    id: Mapped[str] = mapped_column(ForeignKey("equipment.id"), primary_key=True)
    
    # Pump specific attributes
    discharge_pressure: Mapped[float | None] = mapped_column(Numeric(10, 3), nullable=True)
    suction_pressure: Mapped[float | None] = mapped_column(Numeric(10, 3), nullable=True)
    flow_rate: Mapped[float | None] = mapped_column(Numeric(12, 3), nullable=True)
    
    # Mechanical health
    vibration_level: Mapped[float | None] = mapped_column(Numeric(8, 3), nullable=True)
    bearing_temperature: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    motor_current: Mapped[float | None] = mapped_column(Numeric(8, 3), nullable=True)
    
    __mapper_args__ = {"polymorphic_identity": "pump"}


class Compressor(BaseEquipment):
    """Gas compressor for pressure boosting"""
    __tablename__ = "equipment_compressor"
    
    id: Mapped[str] = mapped_column(ForeignKey("equipment.id"), primary_key=True)
    
    # Compressor specific attributes
    suction_pressure: Mapped[float | None] = mapped_column(Numeric(10, 3), nullable=True)
    discharge_pressure: Mapped[float | None] = mapped_column(Numeric(10, 3), nullable=True)
    compression_ratio: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    gas_flow_rate: Mapped[float | None] = mapped_column(Numeric(12, 3), nullable=True)
    
    # Performance metrics
    power_consumption: Mapped[float | None] = mapped_column(Numeric(10, 3), nullable=True)
    compressor_efficiency: Mapped[float | None] = mapped_column(Numeric(6, 3), nullable=True)
    
    __mapper_args__ = {"polymorphic_identity": "compressor"}


class Pipeline(BaseEquipment):
    """Major pipeline between facilities"""
    __tablename__ = "equipment_pipeline"
    
    id: Mapped[str] = mapped_column(ForeignKey("equipment.id"), primary_key=True)
    
    # Pipeline specific attributes
    length_km: Mapped[float | None] = mapped_column(Numeric(12, 3), nullable=True)
    diameter_inches: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    material: Mapped[str | None] = mapped_column(String, nullable=True)
    
    # Operational parameters
    inlet_pressure: Mapped[float | None] = mapped_column(Numeric(10, 3), nullable=True)
    outlet_pressure: Mapped[float | None] = mapped_column(Numeric(10, 3), nullable=True)
    flow_rate: Mapped[float | None] = mapped_column(Numeric(12, 3), nullable=True)
    
    # Safety and monitoring
    leak_detection_status: Mapped[str | None] = mapped_column(String, nullable=True)
    cathodic_protection_status: Mapped[str | None] = mapped_column(String, nullable=True)
    
    __mapper_args__ = {"polymorphic_identity": "pipeline"}


class StorageTank(BaseEquipment):
    """Storage tank at terminals"""
    __tablename__ = "equipment_storage_tank"
    
    id: Mapped[str] = mapped_column(ForeignKey("equipment.id"), primary_key=True)
    
    # Tank specific attributes
    total_capacity: Mapped[float | None] = mapped_column(Numeric(15, 3), nullable=True)
    current_volume: Mapped[float | None] = mapped_column(Numeric(15, 3), nullable=True)
    usable_capacity: Mapped[float | None] = mapped_column(Numeric(15, 3), nullable=True)
    
    # Product quality
    api_gravity: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    bsw_content: Mapped[float | None] = mapped_column(Numeric(6, 3), nullable=True)
    temperature: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    
    # Tank status
    filling_rate: Mapped[float | None] = mapped_column(Numeric(12, 3), nullable=True)
    emptying_rate: Mapped[float | None] = mapped_column(Numeric(12, 3), nullable=True)
    
    __mapper_args__ = {"polymorphic_identity": "storage_tank"}


class FlowMeter(BaseEquipment):
    """Flow measurement device"""
    __tablename__ = "equipment_meter"
    
    id: Mapped[str] = mapped_column(ForeignKey("equipment.id"), primary_key=True)
    
    # Meter specific attributes
    meter_type: Mapped[str | None] = mapped_column(String, nullable=True)  # orifice, turbine, ultrasonic
    accuracy_percentage: Mapped[float | None] = mapped_column(Numeric(6, 3), nullable=True)
    calibration_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Current readings
    instantaneous_flow: Mapped[float | None] = mapped_column(Numeric(12, 3), nullable=True)
    totalizer_reading: Mapped[float | None] = mapped_column(Numeric(18, 3), nullable=True)
    data_quality: Mapped[str | None] = mapped_column(String, nullable=True)  # good, suspect, bad
    
    __mapper_args__ = {"polymorphic_identity": "meter"}


class EquipmentConnection(Base):
    """Models connections between equipment for flow path analysis"""
    __tablename__ = "equipment_connection"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source_equipment_id: Mapped[str] = mapped_column(ForeignKey("equipment.id", ondelete="CASCADE"), index=True)
    target_equipment_id: Mapped[str] = mapped_column(ForeignKey("equipment.id", ondelete="CASCADE"), index=True)
    
    # Connection characteristics
    connection_type: Mapped[str] = mapped_column(ConnectionType, nullable=False)
    network_type: Mapped[str] = mapped_column(NetworkType, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Flow characteristics
    max_capacity: Mapped[float | None] = mapped_column(Numeric(12, 3), nullable=True)
    current_flow: Mapped[float | None] = mapped_column(Numeric(12, 3), nullable=True)
    capacity_unit: Mapped[str | None] = mapped_column(String, nullable=True)
    
    # Physical connection details
    connection_point_source: Mapped[str | None] = mapped_column(String, nullable=True)
    connection_point_target: Mapped[str | None] = mapped_column(String, nullable=True)
    
    # Metadata
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    source_equipment: Mapped[BaseEquipment] = relationship(
        "BaseEquipment", back_populates="source_connections", foreign_keys=[source_equipment_id]
    )
    target_equipment: Mapped[BaseEquipment] = relationship(
        "BaseEquipment", back_populates="target_connections", foreign_keys=[target_equipment_id]
    )


class EquipmentPerformance(Base):
    """Real-time and historical performance data for equipment"""
    __tablename__ = "equipment_performance"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    equipment_id: Mapped[str] = mapped_column(ForeignKey("equipment.id", ondelete="CASCADE"), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    
    # Performance metrics (flexible JSON-like structure)
    throughput: Mapped[float | None] = mapped_column(Numeric(12, 3), nullable=True)
    efficiency: Mapped[float | None] = mapped_column(Numeric(6, 3), nullable=True)
    availability: Mapped[float | None] = mapped_column(Numeric(6, 3), nullable=True)
    
    # Operational parameters
    pressure: Mapped[float | None] = mapped_column(Numeric(10, 3), nullable=True)
    temperature: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    flow_rate: Mapped[float | None] = mapped_column(Numeric(12, 3), nullable=True)
    
    # Quality indicators
    data_quality: Mapped[str | None] = mapped_column(String, nullable=True)
    measurement_source: Mapped[str | None] = mapped_column(String, nullable=True)
    
    # Units
    throughput_unit: Mapped[str | None] = mapped_column(String, nullable=True)
    pressure_unit: Mapped[str | None] = mapped_column(String, nullable=True)
    temperature_unit: Mapped[str | None] = mapped_column(String, nullable=True)
    flow_unit: Mapped[str | None] = mapped_column(String, nullable=True)
    
    # Relationships
    equipment: Mapped[BaseEquipment] = relationship("BaseEquipment", back_populates="performance_data") 