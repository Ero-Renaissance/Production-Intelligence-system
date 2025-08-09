from fastapi import APIRouter, HTTPException, Depends, Query

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import datetime

from app.db.session import get_db
from app.models.equipment import BaseEquipment, EquipmentConnection, EquipmentPerformance

router = APIRouter(prefix="/equipment", tags=["equipment"])


@router.get("/facilities/{facility_id}/equipment")
async def get_facility_equipment(
    facility_id: str,
    equipment_type: Optional[str] = Query(None, description="Filter by equipment type"),
    status: Optional[str] = Query(None, description="Filter by equipment status"),
    db: Session = Depends(get_db)
):
    """Get all equipment for a specific facility"""
    query = db.query(BaseEquipment).filter(BaseEquipment.facility_id == facility_id)
    
    if equipment_type:
        query = query.filter(BaseEquipment.equipment_type == equipment_type)
    
    if status:
        query = query.filter(BaseEquipment.status == status)
    
    equipment = query.all()
    
    return {
        "facility_id": facility_id,
        "equipment_count": len(equipment),
        "equipment": [
            {
                "id": eq.id,
                "name": eq.name,
                "type": eq.equipment_type,
                "tag_number": eq.tag_number,
                "status": eq.status,
                "is_critical": eq.is_critical,
                "design_capacity": eq.design_capacity,
                "current_throughput": eq.current_throughput,
                "efficiency": eq.efficiency,
                "capacity_unit": eq.capacity_unit,
                "last_maintenance_date": eq.last_maintenance_date,
                "next_maintenance_date": eq.next_maintenance_date,
                "updated_at": eq.updated_at
            }
            for eq in equipment
        ]
    }


@router.get("/{equipment_id}")
async def get_equipment_details(
    equipment_id: str,
    include_connections: bool = Query(False, description="Include equipment connections"),
    include_performance: bool = Query(False, description="Include recent performance data"),
    db: Session = Depends(get_db)
):
    """Get detailed information for a specific piece of equipment"""
    equipment = db.query(BaseEquipment).filter(BaseEquipment.id == equipment_id).first()
    
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    result = {
        "id": equipment.id,
        "facility_id": equipment.facility_id,
        "type": equipment.equipment_type,
        "name": equipment.name,
        "tag_number": equipment.tag_number,
        "status": equipment.status,
        "is_critical": equipment.is_critical,
        "design_capacity": equipment.design_capacity,
        "current_throughput": equipment.current_throughput,
        "efficiency": equipment.efficiency,
        "capacity_unit": equipment.capacity_unit,
        "location_description": equipment.location_description,
        "elevation": equipment.elevation,
        "last_maintenance_date": equipment.last_maintenance_date,
        "next_maintenance_date": equipment.next_maintenance_date,
        "commissioned_date": equipment.commissioned_date,
        "created_at": equipment.created_at,
        "updated_at": equipment.updated_at
    }
    
    if include_connections:
        # Get upstream connections (equipment feeding into this one)
        upstream = db.query(EquipmentConnection).filter(
            EquipmentConnection.target_equipment_id == equipment_id
        ).all()
        
        # Get downstream connections (equipment this one feeds into)
        downstream = db.query(EquipmentConnection).filter(
            EquipmentConnection.source_equipment_id == equipment_id
        ).all()
        
        result["connections"] = {
            "upstream": [
                {
                    "source_equipment_id": conn.source_equipment_id,
                    "connection_type": conn.connection_type,
                    "network_type": conn.network_type,
                    "max_capacity": conn.max_capacity,
                    "current_flow": conn.current_flow,
                    "capacity_unit": conn.capacity_unit,
                    "is_active": conn.is_active
                }
                for conn in upstream
            ],
            "downstream": [
                {
                    "target_equipment_id": conn.target_equipment_id,
                    "connection_type": conn.connection_type,
                    "network_type": conn.network_type,
                    "max_capacity": conn.max_capacity,
                    "current_flow": conn.current_flow,
                    "capacity_unit": conn.capacity_unit,
                    "is_active": conn.is_active
                }
                for conn in downstream
            ]
        }
    
    if include_performance:
        # Get recent performance data (last 24 hours)
        recent_performance = db.query(EquipmentPerformance).filter(
            and_(
                EquipmentPerformance.equipment_id == equipment_id,
                EquipmentPerformance.timestamp >= datetime.utcnow().replace(hour=0, minute=0, second=0)
            )
        ).order_by(EquipmentPerformance.timestamp.desc()).limit(24).all()
        
        result["performance"] = {
            "recent_data_points": len(recent_performance),
            "latest": recent_performance[0].__dict__ if recent_performance else None,
            "hourly_data": [
                {
                    "timestamp": perf.timestamp,
                    "throughput": perf.throughput,
                    "efficiency": perf.efficiency,
                    "availability": perf.availability,
                    "pressure": perf.pressure,
                    "temperature": perf.temperature,
                    "flow_rate": perf.flow_rate,
                    "data_quality": perf.data_quality
                }
                for perf in recent_performance
            ]
        }
    
    return result


@router.get("/")
async def list_equipment(
    equipment_type: Optional[str] = Query(None, description="Filter by equipment type"),
    status: Optional[str] = Query(None, description="Filter by equipment status"),
    facility_id: Optional[str] = Query(None, description="Filter by facility"),
    is_critical: Optional[bool] = Query(None, description="Filter by critical equipment"),
    limit: int = Query(100, description="Maximum number of results"),
    offset: int = Query(0, description="Number of results to skip"),
    db: Session = Depends(get_db)
):
    """List equipment with optional filters"""
    query = db.query(BaseEquipment)
    
    if equipment_type:
        query = query.filter(BaseEquipment.equipment_type == equipment_type)
    
    if status:
        query = query.filter(BaseEquipment.status == status)
    
    if facility_id:
        query = query.filter(BaseEquipment.facility_id == facility_id)
    
    if is_critical is not None:
        query = query.filter(BaseEquipment.is_critical == is_critical)
    
    total_count = query.count()
    equipment = query.offset(offset).limit(limit).all()
    
    return {
        "total_count": total_count,
        "returned_count": len(equipment),
        "offset": offset,
        "limit": limit,
        "equipment": [
            {
                "id": eq.id,
                "facility_id": eq.facility_id,
                "type": eq.equipment_type,
                "name": eq.name,
                "tag_number": eq.tag_number,
                "status": eq.status,
                "is_critical": eq.is_critical,
                "current_throughput": eq.current_throughput,
                "efficiency": eq.efficiency,
                "capacity_unit": eq.capacity_unit,
                "updated_at": eq.updated_at
            }
            for eq in equipment
        ]
    }


@router.get("/flow-path/{source_equipment_id}")
async def trace_flow_path(
    source_equipment_id: str,
    network_type: Optional[str] = Query(None, description="Filter by network type"),
    max_depth: int = Query(10, description="Maximum path depth to trace"),
    db: Session = Depends(get_db)
):
    """Trace the flow path from a source equipment through the network"""
    
    def trace_connections(equipment_id: str, visited: set, depth: int) -> List:
        if depth >= max_depth or equipment_id in visited:
            return []
        
        visited.add(equipment_id)
        
        query = db.query(EquipmentConnection).filter(
            EquipmentConnection.source_equipment_id == equipment_id
        )
        
        if network_type:
            query = query.filter(EquipmentConnection.network_type == network_type)
        
        connections = query.all()
        
        path = []
        for conn in connections:
            equipment = db.query(BaseEquipment).filter(
                BaseEquipment.id == conn.target_equipment_id
            ).first()
            
            if equipment:
                connection_info = {
                    "equipment_id": equipment.id,
                    "equipment_name": equipment.name,
                    "equipment_type": equipment.equipment_type,
                    "connection_type": conn.connection_type,
                    "network_type": conn.network_type,
                    "max_capacity": conn.max_capacity,
                    "current_flow": conn.current_flow,
                    "is_active": conn.is_active,
                    "depth": depth + 1
                }
                
                # Recursively trace downstream connections
                downstream = trace_connections(equipment.id, visited.copy(), depth + 1)
                if downstream:
                    connection_info["downstream"] = downstream
                
                path.append(connection_info)
        
        return path
    
    # Get source equipment info
    source_equipment = db.query(BaseEquipment).filter(
        BaseEquipment.id == source_equipment_id
    ).first()
    
    if not source_equipment:
        raise HTTPException(status_code=404, detail="Source equipment not found")
    
    # Trace the flow path
    flow_path = trace_connections(source_equipment_id, set(), 0)
    
    return {
        "source_equipment": {
            "id": source_equipment.id,
            "name": source_equipment.name,
            "type": source_equipment.equipment_type,
            "status": source_equipment.status
        },
        "network_type": network_type,
        "max_depth": max_depth,
        "flow_path": flow_path
    }