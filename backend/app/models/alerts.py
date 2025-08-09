 from __future__ import annotations

from sqlalchemy import String, ForeignKey, Enum, Integer, Numeric, DateTime, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from app.db.base import Base


# Alert severity enum
AlertSeverity = Enum(
    "info",
    "warning", 
    "critical",
    "emergency",
    name="alert_severity_enum",
)

# Alert status enum
AlertStatus = Enum(
    "new",
    "acknowledged",
    "investigating",
    "resolved",
    "closed",
    "false_alarm",
    name="alert_status_enum",
)

# Alert type enum
AlertType = Enum(
    "production_deviance",
    "equipment_failure",
    "threshold_breach",
    "status_change",
    "maintenance_due",
    "safety_violation",
    "process_upset",
    "constraint_detected",
    name="alert_type_enum",
)

# Downtime reason enum
DowntimeReason = Enum(
    "planned_maintenance",
    "unplanned_trip",
    "equipment_failure",
    "process_upset",
    "safety_shutdown",
    "external_constraint",
    "power_outage",
    "operator_action",
    name="downtime_reason_enum",
)


class PerformanceAlert(Base):
    """Operational alerts for any piece of equipment or system component"""
    __tablename__ = "performance_alert"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    alert_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)  # Human-readable ID
    
    # Equipment/Entity reference
    equipment_id: Mapped[str | None] = mapped_column(ForeignKey("equipment.id", ondelete="CASCADE"), index=True, nullable=True)
    facility_id: Mapped[str | None] = mapped_column(ForeignKey("dim_facility.id", ondelete="CASCADE"), index=True, nullable=True)
    well_id: Mapped[str | None] = mapped_column(ForeignKey("dim_well.id", ondelete="CASCADE"), index=True, nullable=True)
    
    # Alert classification
    alert_type: Mapped[str] = mapped_column(AlertType, nullable=False)
    severity: Mapped[str] = mapped_column(AlertSeverity, nullable=False)
    priority: Mapped[int] = mapped_column(Integer, nullable=False, default=5)  # 1-10 scale
    
    # Alert content
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    recommendation: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Alert lifecycle
    status: Mapped[str] = mapped_column(AlertStatus, nullable=False, default="new")
    alert_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    acknowledged_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Technical details
    threshold_id: Mapped[int | None] = mapped_column(ForeignKey("kpi_threshold.id"), nullable=True)
    measured_value: Mapped[float | None] = mapped_column(Numeric(18, 6), nullable=True)
    threshold_value: Mapped[float | None] = mapped_column(Numeric(18, 6), nullable=True)
    measurement_unit: Mapped[str | None] = mapped_column(String, nullable=True)
    
    # Impact assessment
    production_impact_bpd: Mapped[float | None] = mapped_column(Numeric(12, 3), nullable=True)
    estimated_downtime_hours: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    safety_critical: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # User actions
    acknowledged_by: Mapped[str | None] = mapped_column(String, nullable=True)
    resolved_by: Mapped[str | None] = mapped_column(String, nullable=True)
    resolution_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Metadata
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    equipment: Mapped["BaseEquipment"] = relationship("BaseEquipment")
    facility: Mapped["Facility"] = relationship("Facility")
    well: Mapped["Well"] = relationship("Well")
    threshold: Mapped["KPIThreshold"] = relationship("KPIThreshold", back_populates="alerts")


class KPIThreshold(Base):
    """Configurable operational limits for automated alert generation"""
    __tablename__ = "kpi_threshold"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    threshold_name: Mapped[str] = mapped_column(String, nullable=False)
    
    # Equipment/Entity reference
    equipment_id: Mapped[str | None] = mapped_column(ForeignKey("equipment.id", ondelete="CASCADE"), index=True, nullable=True)
    facility_id: Mapped[str | None] = mapped_column(ForeignKey("dim_facility.id", ondelete="CASCADE"), index=True, nullable=True)
    well_id: Mapped[str | None] = mapped_column(ForeignKey("dim_well.id", ondelete="CASCADE"), index=True, nullable=True)
    
    # KPI definition
    kpi_name: Mapped[str] = mapped_column(String, nullable=False)  # e.g., "flow_rate", "pressure", "efficiency"
    kpi_description: Mapped[str | None] = mapped_column(String, nullable=True)
    measurement_unit: Mapped[str | None] = mapped_column(String, nullable=True)
    
    # Threshold values
    upper_limit: Mapped[float | None] = mapped_column(Numeric(18, 6), nullable=True)
    lower_limit: Mapped[float | None] = mapped_column(Numeric(18, 6), nullable=True)
    target_value: Mapped[float | None] = mapped_column(Numeric(18, 6), nullable=True)
    
    # Alert configuration
    alert_severity: Mapped[str] = mapped_column(AlertSeverity, nullable=False, default="warning")
    hysteresis_percentage: Mapped[float | None] = mapped_column(Numeric(6, 3), nullable=True)  # Prevent alert flapping
    minimum_duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)  # Must breach for X minutes
    
    # Operational parameters
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    effective_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    effective_to: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Configuration metadata
    created_by: Mapped[str | None] = mapped_column(String, nullable=True)
    approved_by: Mapped[str | None] = mapped_column(String, nullable=True)
    comments: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Metadata
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    equipment: Mapped["BaseEquipment"] = relationship("BaseEquipment")
    facility: Mapped["Facility"] = relationship("Facility")
    well: Mapped["Well"] = relationship("Well")
    alerts: Mapped[list[PerformanceAlert]] = relationship("PerformanceAlert", back_populates="threshold")


class DowntimeEvent(Base):
    """Equipment stoppage tracking for reliability analysis and root cause investigation"""
    __tablename__ = "downtime_event"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    downtime_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)  # Human-readable ID
    
    # Equipment reference
    equipment_id: Mapped[str] = mapped_column(ForeignKey("equipment.id", ondelete="CASCADE"), index=True)
    
    # Downtime period
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    end_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    duration_hours: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    
    # Downtime classification
    downtime_reason: Mapped[str] = mapped_column(DowntimeReason, nullable=False)
    planned: Mapped[bool] = mapped_column(Boolean, nullable=False)
    safety_related: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Impact assessment
    production_loss_bpd: Mapped[float | None] = mapped_column(Numeric(12, 3), nullable=True)
    production_loss_mscfd: Mapped[float | None] = mapped_column(Numeric(12, 3), nullable=True)
    financial_impact_usd: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    
    # Root cause analysis
    primary_cause: Mapped[str | None] = mapped_column(String, nullable=True)
    secondary_cause: Mapped[str | None] = mapped_column(String, nullable=True)
    root_cause_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    contributing_factors: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Response and resolution
    detection_method: Mapped[str | None] = mapped_column(String, nullable=True)  # alarm, operator, inspection
    response_time_minutes: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    repair_time_hours: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    corrective_actions: Mapped[str | None] = mapped_column(Text, nullable=True)
    preventive_actions: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Personnel
    reported_by: Mapped[str | None] = mapped_column(String, nullable=True)
    investigated_by: Mapped[str | None] = mapped_column(String, nullable=True)
    approved_by: Mapped[str | None] = mapped_column(String, nullable=True)
    
    # Work order integration
    work_order_number: Mapped[str | None] = mapped_column(String, nullable=True)
    maintenance_type: Mapped[str | None] = mapped_column(String, nullable=True)
    
    # Metadata
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    equipment: Mapped["BaseEquipment"] = relationship("BaseEquipment")


class AlertRule(Base):
    """Configurable rules for automated alert generation beyond simple thresholds"""
    __tablename__ = "alert_rule"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    rule_name: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    
    # Rule definition
    rule_type: Mapped[str] = mapped_column(String, nullable=False)  # threshold, trend, pattern, correlation
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Scope
    equipment_type: Mapped[str | None] = mapped_column(String, nullable=True)  # apply to equipment type
    facility_type: Mapped[str | None] = mapped_column(String, nullable=True)  # apply to facility type
    network_type: Mapped[str | None] = mapped_column(String, nullable=True)  # apply to network type
    
    # Rule logic (stored as JSON or structured format)
    condition_logic: Mapped[str] = mapped_column(Text, nullable=False)  # JSON or expression
    evaluation_window_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    evaluation_frequency_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    
    # Alert generation
    alert_severity: Mapped[str] = mapped_column(AlertSeverity, nullable=False)
    alert_title_template: Mapped[str] = mapped_column(String, nullable=False)
    alert_description_template: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Rule management
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    priority: Mapped[int] = mapped_column(Integer, default=5)  # Rule evaluation priority
    
    # Metadata
    created_by: Mapped[str | None] = mapped_column(String, nullable=True)
    approved_by: Mapped[str | None] = mapped_column(String, nullable=True)
    effective_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    effective_to: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class AlertNotification(Base):
    """Tracks alert notifications sent to users (email, SMS, etc.)"""
    __tablename__ = "alert_notification"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    alert_id: Mapped[int] = mapped_column(ForeignKey("performance_alert.id", ondelete="CASCADE"), index=True)
    
    # Notification details
    notification_type: Mapped[str] = mapped_column(String, nullable=False)  # email, sms, push, teams
    recipient: Mapped[str] = mapped_column(String, nullable=False)  # email address, phone number, user ID
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    delivery_status: Mapped[str] = mapped_column(String, nullable=False)  # sent, delivered, failed, bounced
    
    # Message content
    subject: Mapped[str | None] = mapped_column(String, nullable=True)
    message_body: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Delivery tracking
    delivery_attempted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    delivery_confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    failure_reason: Mapped[str | None] = mapped_column(String, nullable=True)
    
    # Relationships
    alert: Mapped[PerformanceAlert] = relationship("PerformanceAlert")


class AlertEscalation(Base):
    """Tracks alert escalation rules and escalation history"""
    __tablename__ = "alert_escalation"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    alert_id: Mapped[int] = mapped_column(ForeignKey("performance_alert.id", ondelete="CASCADE"), index=True)
    
    # Escalation details
    escalation_level: Mapped[int] = mapped_column(Integer, nullable=False)  # 1, 2, 3, etc.
    escalated_to: Mapped[str] = mapped_column(String, nullable=False)  # user, role, or group
    escalated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    escalated_by: Mapped[str | None] = mapped_column(String, nullable=True)  # system or user
    
    # Escalation reason
    escalation_reason: Mapped[str] = mapped_column(String, nullable=False)  # timeout, manual, severity_increase
    time_since_alert_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Response tracking
    acknowledged_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    response_time_minutes: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    
    # Relationships
    alert: Mapped[PerformanceAlert] = relationship("PerformanceAlert")