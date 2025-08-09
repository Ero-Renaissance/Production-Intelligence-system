from fastapi import APIRouter, HTTPException, Depends, Query

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from typing import List, Optional
from datetime import datetime, timedelta

from app.db.session import get_db
from app.models.alerts import PerformanceAlert, KPIThreshold, DowntimeEvent, AlertRule

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/")
async def list_alerts(
    status: Optional[str] = Query(None, description="Filter by alert status"),
    severity: Optional[str] = Query(None, description="Filter by alert severity"),
    alert_type: Optional[str] = Query(None, description="Filter by alert type"),
    facility_id: Optional[str] = Query(None, description="Filter by facility"),
    equipment_id: Optional[str] = Query(None, description="Filter by equipment"),
    safety_critical: Optional[bool] = Query(None, description="Filter by safety critical alerts"),
    hours_back: int = Query(24, description="Hours to look back for alerts"),
    limit: int = Query(100, description="Maximum number of results"),
    offset: int = Query(0, description="Number of results to skip"),
    db: Session = Depends(get_db)
):
    """List performance alerts with optional filters"""
    
    # Calculate time threshold
    time_threshold = datetime.utcnow() - timedelta(hours=hours_back)
    
    query = db.query(PerformanceAlert).filter(
        PerformanceAlert.alert_timestamp >= time_threshold
    )
    
    if status:
        query = query.filter(PerformanceAlert.status == status)
    
    if severity:
        query = query.filter(PerformanceAlert.severity == severity)
    
    if alert_type:
        query = query.filter(PerformanceAlert.alert_type == alert_type)
    
    if facility_id:
        query = query.filter(PerformanceAlert.facility_id == facility_id)
    
    if equipment_id:
        query = query.filter(PerformanceAlert.equipment_id == equipment_id)
    
    if safety_critical is not None:
        query = query.filter(PerformanceAlert.safety_critical == safety_critical)
    
    # Order by priority and timestamp
    query = query.order_by(desc(PerformanceAlert.priority), desc(PerformanceAlert.alert_timestamp))
    
    total_count = query.count()
    alerts = query.offset(offset).limit(limit).all()
    
    return {
        "total_count": total_count,
        "returned_count": len(alerts),
        "hours_back": hours_back,
        "filters": {
            "status": status,
            "severity": severity,
            "alert_type": alert_type,
            "facility_id": facility_id,
            "equipment_id": equipment_id,
            "safety_critical": safety_critical
        },
        "alerts": [
            {
                "id": alert.id,
                "alert_id": alert.alert_id,
                "equipment_id": alert.equipment_id,
                "facility_id": alert.facility_id,
                "well_id": alert.well_id,
                "alert_type": alert.alert_type,
                "severity": alert.severity,
                "priority": alert.priority,
                "title": alert.title,
                "description": alert.description,
                "status": alert.status,
                "alert_timestamp": alert.alert_timestamp,
                "acknowledged_at": alert.acknowledged_at,
                "resolved_at": alert.resolved_at,
                "production_impact_bpd": alert.production_impact_bpd,
                "estimated_downtime_hours": alert.estimated_downtime_hours,
                "safety_critical": alert.safety_critical,
                "acknowledged_by": alert.acknowledged_by,
                "resolved_by": alert.resolved_by
            }
            for alert in alerts
        ]
    }


@router.get("/{alert_id}")
async def get_alert_details(
    alert_id: str,
    db: Session = Depends(get_db)
):
    """Get detailed information for a specific alert"""
    alert = db.query(PerformanceAlert).filter(PerformanceAlert.alert_id == alert_id).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    result = {
        "id": alert.id,
        "alert_id": alert.alert_id,
        "equipment_id": alert.equipment_id,
        "facility_id": alert.facility_id,
        "well_id": alert.well_id,
        "alert_type": alert.alert_type,
        "severity": alert.severity,
        "priority": alert.priority,
        "title": alert.title,
        "description": alert.description,
        "recommendation": alert.recommendation,
        "status": alert.status,
        "alert_timestamp": alert.alert_timestamp,
        "acknowledged_at": alert.acknowledged_at,
        "resolved_at": alert.resolved_at,
        "threshold_id": alert.threshold_id,
        "measured_value": alert.measured_value,
        "threshold_value": alert.threshold_value,
        "measurement_unit": alert.measurement_unit,
        "production_impact_bpd": alert.production_impact_bpd,
        "estimated_downtime_hours": alert.estimated_downtime_hours,
        "safety_critical": alert.safety_critical,
        "acknowledged_by": alert.acknowledged_by,
        "resolved_by": alert.resolved_by,
        "resolution_notes": alert.resolution_notes,
        "created_at": alert.created_at,
        "updated_at": alert.updated_at
    }
    
    # Include threshold information if applicable
    if alert.threshold_id:
        threshold = db.query(KPIThreshold).filter(KPIThreshold.id == alert.threshold_id).first()
        if threshold:
            result["threshold_details"] = {
                "threshold_name": threshold.threshold_name,
                "kpi_name": threshold.kpi_name,
                "kpi_description": threshold.kpi_description,
                "upper_limit": threshold.upper_limit,
                "lower_limit": threshold.lower_limit,
                "target_value": threshold.target_value,
                "measurement_unit": threshold.measurement_unit
            }
    
    return result


@router.get("/summary/dashboard")
async def get_alerts_dashboard(
    hours_back: int = Query(24, description="Hours to look back for summary"),
    db: Session = Depends(get_db)
):
    """Get dashboard summary of alerts for the specified time period"""
    
    time_threshold = datetime.utcnow() - timedelta(hours=hours_back)
    
    # Base query for alerts in time window
    base_query = db.query(PerformanceAlert).filter(
        PerformanceAlert.alert_timestamp >= time_threshold
    )
    
    # Count alerts by severity
    severity_counts = {}
    for severity in ["info", "warning", "critical", "emergency"]:
        count = base_query.filter(PerformanceAlert.severity == severity).count()
        severity_counts[severity] = count
    
    # Count alerts by status
    status_counts = {}
    for status in ["new", "acknowledged", "investigating", "resolved", "closed"]:
        count = base_query.filter(PerformanceAlert.status == status).count()
        status_counts[status] = count
    
    # Count safety critical alerts
    safety_critical_count = base_query.filter(PerformanceAlert.safety_critical == True).count()
    
    # Top equipment with most alerts
    equipment_alert_counts = db.execute("""
        SELECT equipment_id, COUNT(*) as alert_count
        FROM performance_alert 
        WHERE alert_timestamp >= :time_threshold 
        AND equipment_id IS NOT NULL
        GROUP BY equipment_id 
        ORDER BY alert_count DESC 
        LIMIT 10
    """, {"time_threshold": time_threshold}).fetchall()
    
    # Production impact summary
    production_impact = db.execute("""
        SELECT 
            SUM(production_impact_bpd) as total_production_impact_bpd,
            SUM(estimated_downtime_hours) as total_estimated_downtime_hours,
            COUNT(*) as alerts_with_impact
        FROM performance_alert 
        WHERE alert_timestamp >= :time_threshold 
        AND (production_impact_bpd IS NOT NULL OR estimated_downtime_hours IS NOT NULL)
    """, {"time_threshold": time_threshold}).fetchone()
    
    return {
        "time_period": {
            "hours_back": hours_back,
            "from_timestamp": time_threshold,
            "to_timestamp": datetime.utcnow()
        },
        "summary": {
            "total_alerts": base_query.count(),
            "severity_distribution": severity_counts,
            "status_distribution": status_counts,
            "safety_critical_alerts": safety_critical_count
        },
        "top_equipment_alerts": [
            {"equipment_id": row[0], "alert_count": row[1]} 
            for row in equipment_alert_counts
        ],
        "production_impact": {
            "total_production_impact_bpd": production_impact[0] if production_impact[0] else 0,
            "total_estimated_downtime_hours": production_impact[1] if production_impact[1] else 0,
            "alerts_with_impact": production_impact[2] if production_impact[2] else 0
        }
    }


@router.get("/downtime/events")
async def list_downtime_events(
    equipment_id: Optional[str] = Query(None, description="Filter by equipment"),
    planned: Optional[bool] = Query(None, description="Filter by planned/unplanned"),
    downtime_reason: Optional[str] = Query(None, description="Filter by downtime reason"),
    days_back: int = Query(7, description="Days to look back for events"),
    limit: int = Query(50, description="Maximum number of results"),
    offset: int = Query(0, description="Number of results to skip"),
    db: Session = Depends(get_db)
):
    """List downtime events with optional filters"""
    
    time_threshold = datetime.utcnow() - timedelta(days=days_back)
    
    query = db.query(DowntimeEvent).filter(
        DowntimeEvent.start_time >= time_threshold
    )
    
    if equipment_id:
        query = query.filter(DowntimeEvent.equipment_id == equipment_id)
    
    if planned is not None:
        query = query.filter(DowntimeEvent.planned == planned)
    
    if downtime_reason:
        query = query.filter(DowntimeEvent.downtime_reason == downtime_reason)
    
    query = query.order_by(desc(DowntimeEvent.start_time))
    
    total_count = query.count()
    events = query.offset(offset).limit(limit).all()
    
    return {
        "total_count": total_count,
        "returned_count": len(events),
        "days_back": days_back,
        "filters": {
            "equipment_id": equipment_id,
            "planned": planned,
            "downtime_reason": downtime_reason
        },
        "downtime_events": [
            {
                "id": event.id,
                "downtime_id": event.downtime_id,
                "equipment_id": event.equipment_id,
                "start_time": event.start_time,
                "end_time": event.end_time,
                "duration_hours": event.duration_hours,
                "downtime_reason": event.downtime_reason,
                "planned": event.planned,
                "safety_related": event.safety_related,
                "production_loss_bpd": event.production_loss_bpd,
                "production_loss_mscfd": event.production_loss_mscfd,
                "financial_impact_usd": event.financial_impact_usd,
                "primary_cause": event.primary_cause,
                "secondary_cause": event.secondary_cause,
                "detection_method": event.detection_method,
                "response_time_minutes": event.response_time_minutes,
                "repair_time_hours": event.repair_time_hours,
                "work_order_number": event.work_order_number
            }
            for event in events
        ]
    }


@router.get("/downtime/{downtime_id}")
async def get_downtime_details(
    downtime_id: str,
    db: Session = Depends(get_db)
):
    """Get detailed information for a specific downtime event"""
    event = db.query(DowntimeEvent).filter(DowntimeEvent.downtime_id == downtime_id).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Downtime event not found")
    
    return {
        "id": event.id,
        "downtime_id": event.downtime_id,
        "equipment_id": event.equipment_id,
        "start_time": event.start_time,
        "end_time": event.end_time,
        "duration_hours": event.duration_hours,
        "downtime_reason": event.downtime_reason,
        "planned": event.planned,
        "safety_related": event.safety_related,
        "production_loss_bpd": event.production_loss_bpd,
        "production_loss_mscfd": event.production_loss_mscfd,
        "financial_impact_usd": event.financial_impact_usd,
        "primary_cause": event.primary_cause,
        "secondary_cause": event.secondary_cause,
        "root_cause_description": event.root_cause_description,
        "contributing_factors": event.contributing_factors,
        "detection_method": event.detection_method,
        "response_time_minutes": event.response_time_minutes,
        "repair_time_hours": event.repair_time_hours,
        "corrective_actions": event.corrective_actions,
        "preventive_actions": event.preventive_actions,
        "reported_by": event.reported_by,
        "investigated_by": event.investigated_by,
        "approved_by": event.approved_by,
        "work_order_number": event.work_order_number,
        "maintenance_type": event.maintenance_type,
        "created_at": event.created_at,
        "updated_at": event.updated_at
    }


@router.get("/thresholds/")
async def list_kpi_thresholds(
    equipment_id: Optional[str] = Query(None, description="Filter by equipment"),
    facility_id: Optional[str] = Query(None, description="Filter by facility"),
    kpi_name: Optional[str] = Query(None, description="Filter by KPI name"),
    is_active: Optional[bool] = Query(True, description="Filter by active thresholds"),
    limit: int = Query(100, description="Maximum number of results"),
    offset: int = Query(0, description="Number of results to skip"),
    db: Session = Depends(get_db)
):
    """List KPI thresholds with optional filters"""
    
    query = db.query(KPIThreshold)
    
    if equipment_id:
        query = query.filter(KPIThreshold.equipment_id == equipment_id)
    
    if facility_id:
        query = query.filter(KPIThreshold.facility_id == facility_id)
    
    if kpi_name:
        query = query.filter(KPIThreshold.kpi_name == kpi_name)
    
    if is_active is not None:
        query = query.filter(KPIThreshold.is_active == is_active)
    
    # Filter by effective date
    now = datetime.utcnow()
    query = query.filter(
        and_(
            KPIThreshold.effective_from <= now,
            or_(KPIThreshold.effective_to.is_(None), KPIThreshold.effective_to >= now)
        )
    )
    
    total_count = query.count()
    thresholds = query.offset(offset).limit(limit).all()
    
    return {
        "total_count": total_count,
        "returned_count": len(thresholds),
        "thresholds": [
            {
                "id": threshold.id,
                "threshold_name": threshold.threshold_name,
                "equipment_id": threshold.equipment_id,
                "facility_id": threshold.facility_id,
                "well_id": threshold.well_id,
                "kpi_name": threshold.kpi_name,
                "kpi_description": threshold.kpi_description,
                "measurement_unit": threshold.measurement_unit,
                "upper_limit": threshold.upper_limit,
                "lower_limit": threshold.lower_limit,
                "target_value": threshold.target_value,
                "alert_severity": threshold.alert_severity,
                "is_active": threshold.is_active,
                "effective_from": threshold.effective_from,
                "effective_to": threshold.effective_to,
                "created_by": threshold.created_by,
                "approved_by": threshold.approved_by
            }
            for threshold in thresholds
        ]
    }