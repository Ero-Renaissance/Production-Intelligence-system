"""Equipment infrastructure and alerting system

Revision ID: 20250809_000002
Revises: 20250809_000001_initial
Create Date: 2025-08-09 00:00:02.000000

"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20250809_000002"
down_revision = "20250809_000001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create equipment-related enums
    equipment_status_enum = sa.Enum(
        "online", "offline", "maintenance", "startup", "shutdown", "bypassed",
        name="equipment_status_enum"
    )
    equipment_type_enum = sa.Enum(
        "well", "flowline", "manifold", "separator", "pump", "compressor",
        "meter", "pipeline", "storage_tank", "gas_plant", "dehydration_unit",
        name="equipment_type_enum"
    )
    connection_type_enum = sa.Enum(
        "physical", "logical", "control", "bypass",
        name="connection_type_enum"
    )
    network_type_enum = sa.Enum(
        "oil", "domestic_gas", "export_gas", "flared_gas", "water", "mixed",
        name="network_type_enum"
    )
    
    # Create alerting enums
    alert_severity_enum = sa.Enum(
        "info", "warning", "critical", "emergency",
        name="alert_severity_enum"
    )
    alert_status_enum = sa.Enum(
        "new", "acknowledged", "investigating", "resolved", "closed", "false_alarm",
        name="alert_status_enum"
    )
    alert_type_enum = sa.Enum(
        "production_deviance", "equipment_failure", "threshold_breach", "status_change",
        "maintenance_due", "safety_violation", "process_upset", "constraint_detected",
        name="alert_type_enum"
    )
    downtime_reason_enum = sa.Enum(
        "planned_maintenance", "unplanned_trip", "equipment_failure", "process_upset",
        "safety_shutdown", "external_constraint", "power_outage", "operator_action",
        name="downtime_reason_enum"
    )
    
    # Create enums
    equipment_status_enum.create(op.get_bind(), checkfirst=True)
    equipment_type_enum.create(op.get_bind(), checkfirst=True)
    connection_type_enum.create(op.get_bind(), checkfirst=True)
    network_type_enum.create(op.get_bind(), checkfirst=True)
    alert_severity_enum.create(op.get_bind(), checkfirst=True)
    alert_status_enum.create(op.get_bind(), checkfirst=True)
    alert_type_enum.create(op.get_bind(), checkfirst=True)
    downtime_reason_enum.create(op.get_bind(), checkfirst=True)

    # Base equipment table
    op.create_table(
        "equipment",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("facility_id", sa.String(), sa.ForeignKey("dim_facility.id", ondelete="CASCADE"), nullable=True, index=True),
        sa.Column("equipment_type", postgresql.ENUM(name="equipment_type_enum", create_type=False), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("tag_number", sa.String(), nullable=True, unique=True),
        
        # Operational status
        sa.Column("status", postgresql.ENUM(name="equipment_status_enum", create_type=False), nullable=False, server_default="offline"),
        sa.Column("is_critical", sa.Boolean(), default=False),
        
        # Capacity and performance
        sa.Column("design_capacity", sa.Numeric(18, 3), nullable=True),
        sa.Column("current_throughput", sa.Numeric(18, 3), nullable=True),
        sa.Column("efficiency", sa.Numeric(6, 3), nullable=True),
        sa.Column("capacity_unit", sa.String(), nullable=True),
        
        # Physical properties
        sa.Column("location_description", sa.String(), nullable=True),
        sa.Column("elevation", sa.Numeric(10, 3), nullable=True),
        
        # Maintenance
        sa.Column("last_maintenance_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("next_maintenance_date", sa.DateTime(timezone=True), nullable=True),
        
        # Metadata
        sa.Column("commissioned_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # Equipment-specific tables
    op.create_table(
        "equipment_flowline",
        sa.Column("id", sa.String(), sa.ForeignKey("equipment.id"), primary_key=True),
        sa.Column("length_km", sa.Numeric(10, 3), nullable=True),
        sa.Column("diameter_inches", sa.Numeric(6, 2), nullable=True),
        sa.Column("material", sa.String(), nullable=True),
        sa.Column("inlet_pressure", sa.Numeric(10, 3), nullable=True),
        sa.Column("outlet_pressure", sa.Numeric(10, 3), nullable=True),
        sa.Column("max_operating_pressure", sa.Numeric(10, 3), nullable=True),
    )

    op.create_table(
        "equipment_manifold",
        sa.Column("id", sa.String(), sa.ForeignKey("equipment.id"), primary_key=True),
        sa.Column("header_pressure", sa.Numeric(10, 3), nullable=True),
        sa.Column("header_temperature", sa.Numeric(8, 2), nullable=True),
        sa.Column("number_of_inlets", sa.Integer(), nullable=True),
    )

    op.create_table(
        "equipment_separator",
        sa.Column("id", sa.String(), sa.ForeignKey("equipment.id"), primary_key=True),
        sa.Column("operating_pressure", sa.Numeric(10, 3), nullable=True),
        sa.Column("operating_temperature", sa.Numeric(8, 2), nullable=True),
        sa.Column("liquid_level", sa.Numeric(6, 2), nullable=True),
        sa.Column("vessel_volume", sa.Numeric(10, 3), nullable=True),
        sa.Column("oil_recovery_efficiency", sa.Numeric(6, 3), nullable=True),
        sa.Column("gas_recovery_efficiency", sa.Numeric(6, 3), nullable=True),
    )

    op.create_table(
        "equipment_pump",
        sa.Column("id", sa.String(), sa.ForeignKey("equipment.id"), primary_key=True),
        sa.Column("discharge_pressure", sa.Numeric(10, 3), nullable=True),
        sa.Column("suction_pressure", sa.Numeric(10, 3), nullable=True),
        sa.Column("flow_rate", sa.Numeric(12, 3), nullable=True),
        sa.Column("vibration_level", sa.Numeric(8, 3), nullable=True),
        sa.Column("bearing_temperature", sa.Numeric(8, 2), nullable=True),
        sa.Column("motor_current", sa.Numeric(8, 3), nullable=True),
    )

    op.create_table(
        "equipment_compressor",
        sa.Column("id", sa.String(), sa.ForeignKey("equipment.id"), primary_key=True),
        sa.Column("suction_pressure", sa.Numeric(10, 3), nullable=True),
        sa.Column("discharge_pressure", sa.Numeric(10, 3), nullable=True),
        sa.Column("compression_ratio", sa.Numeric(6, 2), nullable=True),
        sa.Column("gas_flow_rate", sa.Numeric(12, 3), nullable=True),
        sa.Column("power_consumption", sa.Numeric(10, 3), nullable=True),
        sa.Column("compressor_efficiency", sa.Numeric(6, 3), nullable=True),
    )

    op.create_table(
        "equipment_pipeline",
        sa.Column("id", sa.String(), sa.ForeignKey("equipment.id"), primary_key=True),
        sa.Column("length_km", sa.Numeric(12, 3), nullable=True),
        sa.Column("diameter_inches", sa.Numeric(6, 2), nullable=True),
        sa.Column("material", sa.String(), nullable=True),
        sa.Column("inlet_pressure", sa.Numeric(10, 3), nullable=True),
        sa.Column("outlet_pressure", sa.Numeric(10, 3), nullable=True),
        sa.Column("flow_rate", sa.Numeric(12, 3), nullable=True),
        sa.Column("leak_detection_status", sa.String(), nullable=True),
        sa.Column("cathodic_protection_status", sa.String(), nullable=True),
    )

    op.create_table(
        "equipment_storage_tank",
        sa.Column("id", sa.String(), sa.ForeignKey("equipment.id"), primary_key=True),
        sa.Column("total_capacity", sa.Numeric(15, 3), nullable=True),
        sa.Column("current_volume", sa.Numeric(15, 3), nullable=True),
        sa.Column("usable_capacity", sa.Numeric(15, 3), nullable=True),
        sa.Column("api_gravity", sa.Numeric(6, 2), nullable=True),
        sa.Column("bsw_content", sa.Numeric(6, 3), nullable=True),
        sa.Column("temperature", sa.Numeric(8, 2), nullable=True),
        sa.Column("filling_rate", sa.Numeric(12, 3), nullable=True),
        sa.Column("emptying_rate", sa.Numeric(12, 3), nullable=True),
    )

    op.create_table(
        "equipment_meter",
        sa.Column("id", sa.String(), sa.ForeignKey("equipment.id"), primary_key=True),
        sa.Column("meter_type", sa.String(), nullable=True),
        sa.Column("accuracy_percentage", sa.Numeric(6, 3), nullable=True),
        sa.Column("calibration_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("instantaneous_flow", sa.Numeric(12, 3), nullable=True),
        sa.Column("totalizer_reading", sa.Numeric(18, 3), nullable=True),
        sa.Column("data_quality", sa.String(), nullable=True),
    )

    # Equipment connections
    op.create_table(
        "equipment_connection",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("source_equipment_id", sa.String(), sa.ForeignKey("equipment.id", ondelete="CASCADE"), index=True),
        sa.Column("target_equipment_id", sa.String(), sa.ForeignKey("equipment.id", ondelete="CASCADE"), index=True),
        sa.Column("connection_type", postgresql.ENUM(name="connection_type_enum", create_type=False), nullable=False),
        sa.Column("network_type", postgresql.ENUM(name="network_type_enum", create_type=False), nullable=False),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("max_capacity", sa.Numeric(12, 3), nullable=True),
        sa.Column("current_flow", sa.Numeric(12, 3), nullable=True),
        sa.Column("capacity_unit", sa.String(), nullable=True),
        sa.Column("connection_point_source", sa.String(), nullable=True),
        sa.Column("connection_point_target", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # Equipment performance
    op.create_table(
        "equipment_performance",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("equipment_id", sa.String(), sa.ForeignKey("equipment.id", ondelete="CASCADE"), index=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), index=True),
        sa.Column("throughput", sa.Numeric(12, 3), nullable=True),
        sa.Column("efficiency", sa.Numeric(6, 3), nullable=True),
        sa.Column("availability", sa.Numeric(6, 3), nullable=True),
        sa.Column("pressure", sa.Numeric(10, 3), nullable=True),
        sa.Column("temperature", sa.Numeric(8, 2), nullable=True),
        sa.Column("flow_rate", sa.Numeric(12, 3), nullable=True),
        sa.Column("data_quality", sa.String(), nullable=True),
        sa.Column("measurement_source", sa.String(), nullable=True),
        sa.Column("throughput_unit", sa.String(), nullable=True),
        sa.Column("pressure_unit", sa.String(), nullable=True),
        sa.Column("temperature_unit", sa.String(), nullable=True),
        sa.Column("flow_unit", sa.String(), nullable=True),
    )

    # KPI thresholds
    op.create_table(
        "kpi_threshold",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("threshold_name", sa.String(), nullable=False),
        sa.Column("equipment_id", sa.String(), sa.ForeignKey("equipment.id", ondelete="CASCADE"), nullable=True, index=True),
        sa.Column("facility_id", sa.String(), sa.ForeignKey("dim_facility.id", ondelete="CASCADE"), nullable=True, index=True),
        sa.Column("well_id", sa.String(), sa.ForeignKey("dim_well.id", ondelete="CASCADE"), nullable=True, index=True),
        sa.Column("kpi_name", sa.String(), nullable=False),
        sa.Column("kpi_description", sa.String(), nullable=True),
        sa.Column("measurement_unit", sa.String(), nullable=True),
        sa.Column("upper_limit", sa.Numeric(18, 6), nullable=True),
        sa.Column("lower_limit", sa.Numeric(18, 6), nullable=True),
        sa.Column("target_value", sa.Numeric(18, 6), nullable=True),
        sa.Column("alert_severity", postgresql.ENUM(name="alert_severity_enum", create_type=False), nullable=False, server_default="warning"),
        sa.Column("hysteresis_percentage", sa.Numeric(6, 3), nullable=True),
        sa.Column("minimum_duration_minutes", sa.Integer(), nullable=True),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("effective_from", sa.DateTime(timezone=True), nullable=False),
        sa.Column("effective_to", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", sa.String(), nullable=True),
        sa.Column("approved_by", sa.String(), nullable=True),
        sa.Column("comments", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # Performance alerts
    op.create_table(
        "performance_alert",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("alert_id", sa.String(), unique=True, nullable=False),
        sa.Column("equipment_id", sa.String(), sa.ForeignKey("equipment.id", ondelete="CASCADE"), nullable=True, index=True),
        sa.Column("facility_id", sa.String(), sa.ForeignKey("dim_facility.id", ondelete="CASCADE"), nullable=True, index=True),
        sa.Column("well_id", sa.String(), sa.ForeignKey("dim_well.id", ondelete="CASCADE"), nullable=True, index=True),
        sa.Column("alert_type", postgresql.ENUM(name="alert_type_enum", create_type=False), nullable=False),
        sa.Column("severity", postgresql.ENUM(name="alert_severity_enum", create_type=False), nullable=False),
        sa.Column("priority", sa.Integer(), nullable=False, server_default="5"),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("recommendation", sa.Text(), nullable=True),
        sa.Column("status", postgresql.ENUM(name="alert_status_enum", create_type=False), nullable=False, server_default="new"),
        sa.Column("alert_timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("acknowledged_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("threshold_id", sa.Integer(), sa.ForeignKey("kpi_threshold.id"), nullable=True),
        sa.Column("measured_value", sa.Numeric(18, 6), nullable=True),
        sa.Column("threshold_value", sa.Numeric(18, 6), nullable=True),
        sa.Column("measurement_unit", sa.String(), nullable=True),
        sa.Column("production_impact_bpd", sa.Numeric(12, 3), nullable=True),
        sa.Column("estimated_downtime_hours", sa.Numeric(8, 2), nullable=True),
        sa.Column("safety_critical", sa.Boolean(), default=False),
        sa.Column("acknowledged_by", sa.String(), nullable=True),
        sa.Column("resolved_by", sa.String(), nullable=True),
        sa.Column("resolution_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # Downtime events
    op.create_table(
        "downtime_event",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("downtime_id", sa.String(), unique=True, nullable=False),
        sa.Column("equipment_id", sa.String(), sa.ForeignKey("equipment.id", ondelete="CASCADE"), index=True),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=True, index=True),
        sa.Column("duration_hours", sa.Numeric(10, 2), nullable=True),
        sa.Column("downtime_reason", postgresql.ENUM(name="downtime_reason_enum", create_type=False), nullable=False),
        sa.Column("planned", sa.Boolean(), nullable=False),
        sa.Column("safety_related", sa.Boolean(), default=False),
        sa.Column("production_loss_bpd", sa.Numeric(12, 3), nullable=True),
        sa.Column("production_loss_mscfd", sa.Numeric(12, 3), nullable=True),
        sa.Column("financial_impact_usd", sa.Numeric(15, 2), nullable=True),
        sa.Column("primary_cause", sa.String(), nullable=True),
        sa.Column("secondary_cause", sa.String(), nullable=True),
        sa.Column("root_cause_description", sa.Text(), nullable=True),
        sa.Column("contributing_factors", sa.Text(), nullable=True),
        sa.Column("detection_method", sa.String(), nullable=True),
        sa.Column("response_time_minutes", sa.Numeric(8, 2), nullable=True),
        sa.Column("repair_time_hours", sa.Numeric(10, 2), nullable=True),
        sa.Column("corrective_actions", sa.Text(), nullable=True),
        sa.Column("preventive_actions", sa.Text(), nullable=True),
        sa.Column("reported_by", sa.String(), nullable=True),
        sa.Column("investigated_by", sa.String(), nullable=True),
        sa.Column("approved_by", sa.String(), nullable=True),
        sa.Column("work_order_number", sa.String(), nullable=True),
        sa.Column("maintenance_type", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # Alert rules
    op.create_table(
        "alert_rule",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("rule_name", sa.String(), nullable=False, unique=True),
        sa.Column("rule_type", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("equipment_type", sa.String(), nullable=True),
        sa.Column("facility_type", sa.String(), nullable=True),
        sa.Column("network_type", sa.String(), nullable=True),
        sa.Column("condition_logic", sa.Text(), nullable=False),
        sa.Column("evaluation_window_minutes", sa.Integer(), nullable=False, server_default="5"),
        sa.Column("evaluation_frequency_minutes", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("alert_severity", postgresql.ENUM(name="alert_severity_enum", create_type=False), nullable=False),
        sa.Column("alert_title_template", sa.String(), nullable=False),
        sa.Column("alert_description_template", sa.Text(), nullable=False),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("priority", sa.Integer(), default=5),
        sa.Column("created_by", sa.String(), nullable=True),
        sa.Column("approved_by", sa.String(), nullable=True),
        sa.Column("effective_from", sa.DateTime(timezone=True), nullable=False),
        sa.Column("effective_to", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # Alert notifications
    op.create_table(
        "alert_notification",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("alert_id", sa.Integer(), sa.ForeignKey("performance_alert.id", ondelete="CASCADE"), index=True),
        sa.Column("notification_type", sa.String(), nullable=False),
        sa.Column("recipient", sa.String(), nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("delivery_status", sa.String(), nullable=False),
        sa.Column("subject", sa.String(), nullable=True),
        sa.Column("message_body", sa.Text(), nullable=True),
        sa.Column("delivery_attempted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("delivery_confirmed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("failure_reason", sa.String(), nullable=True),
    )

    # Alert escalations
    op.create_table(
        "alert_escalation",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("alert_id", sa.Integer(), sa.ForeignKey("performance_alert.id", ondelete="CASCADE"), index=True),
        sa.Column("escalation_level", sa.Integer(), nullable=False),
        sa.Column("escalated_to", sa.String(), nullable=False),
        sa.Column("escalated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("escalated_by", sa.String(), nullable=True),
        sa.Column("escalation_reason", sa.String(), nullable=False),
        sa.Column("time_since_alert_minutes", sa.Integer(), nullable=False),
        sa.Column("acknowledged_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("response_time_minutes", sa.Numeric(8, 2), nullable=True),
    )

    # Indexes for performance
    op.create_index("idx_equipment_facility", "equipment", ["facility_id"])
    op.create_index("idx_equipment_type", "equipment", ["equipment_type"])
    op.create_index("idx_equipment_status", "equipment", ["status"])
    op.create_index("idx_equipment_performance_timestamp", "equipment_performance", ["timestamp"])
    op.create_index("idx_performance_alert_timestamp", "performance_alert", ["alert_timestamp"])
    op.create_index("idx_performance_alert_status", "performance_alert", ["status"])
    op.create_index("idx_downtime_event_start", "downtime_event", ["start_time"])


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table("alert_escalation")
    op.drop_table("alert_notification")
    op.drop_table("alert_rule")
    op.drop_table("downtime_event")
    op.drop_table("performance_alert")
    op.drop_table("kpi_threshold")
    op.drop_table("equipment_performance")
    op.drop_table("equipment_connection")
    op.drop_table("equipment_meter")
    op.drop_table("equipment_storage_tank")
    op.drop_table("equipment_pipeline")
    op.drop_table("equipment_compressor")
    op.drop_table("equipment_pump")
    op.drop_table("equipment_separator")
    op.drop_table("equipment_manifold")
    op.drop_table("equipment_flowline")
    op.drop_table("equipment")
    
    # Drop enums
    op.execute("DROP TYPE IF EXISTS downtime_reason_enum")
    op.execute("DROP TYPE IF EXISTS alert_type_enum")
    op.execute("DROP TYPE IF EXISTS alert_status_enum")
    op.execute("DROP TYPE IF EXISTS alert_severity_enum")
    op.execute("DROP TYPE IF EXISTS network_type_enum")
    op.execute("DROP TYPE IF EXISTS connection_type_enum")
    op.execute("DROP TYPE IF EXISTS equipment_type_enum")
    op.execute("DROP TYPE IF EXISTS equipment_status_enum")