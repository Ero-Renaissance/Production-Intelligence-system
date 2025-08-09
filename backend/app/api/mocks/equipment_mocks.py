from datetime import datetime, timedelta
from typing import Dict, List
import random

# Mock equipment data representing a realistic production network
MOCK_EQUIPMENT = {
    # Flowstation equipment
    "EQ_FS001_SEP01": {
        "id": "EQ_FS001_SEP01",
        "facility_id": "FS001",
        "type": "separator",
        "name": "Primary Separator",
        "tag_number": "SEP-001",
        "status": "online",
        "is_critical": True,
        "design_capacity": 15000.0,
        "current_throughput": 12500.0,
        "efficiency": 95.2,
        "capacity_unit": "bpd",
        "location_description": "Process Area A",
        "commissioned_date": "2020-03-15T00:00:00Z"
    },
    "EQ_FS001_PUMP01": {
        "id": "EQ_FS001_PUMP01",
        "facility_id": "FS001",
        "type": "pump",
        "name": "Export Pump A",
        "tag_number": "P-001A",
        "status": "online",
        "is_critical": True,
        "design_capacity": 20000.0,
        "current_throughput": 12500.0,
        "efficiency": 88.5,
        "capacity_unit": "bpd",
        "location_description": "Pump House A",
        "commissioned_date": "2020-03-15T00:00:00Z"
    },
    "EQ_FS001_COMP01": {
        "id": "EQ_FS001_COMP01",
        "facility_id": "FS001",
        "type": "compressor",
        "name": "Gas Compressor A",
        "tag_number": "C-001A",
        "status": "online",
        "is_critical": True,
        "design_capacity": 50000.0,
        "current_throughput": 35000.0,
        "efficiency": 82.1,
        "capacity_unit": "mscfd",
        "location_description": "Compressor Building",
        "commissioned_date": "2020-03-15T00:00:00Z"
    },
    
    # Terminal equipment
    "EQ_TERM01_TANK01": {
        "id": "EQ_TERM01_TANK01",
        "facility_id": "TERM01",
        "type": "storage_tank",
        "name": "Storage Tank 001",
        "tag_number": "TK-001",
        "status": "online",
        "is_critical": True,
        "design_capacity": 500000.0,
        "current_throughput": 350000.0,
        "efficiency": 95.0,
        "capacity_unit": "bbl",
        "location_description": "Tank Farm A",
        "commissioned_date": "2019-06-20T00:00:00Z"
    },
    "EQ_TERM01_METER01": {
        "id": "EQ_TERM01_METER01",
        "facility_id": "TERM01",
        "type": "meter",
        "name": "Custody Transfer Meter A",
        "tag_number": "FT-001",
        "status": "online",
        "is_critical": True,
        "design_capacity": 50000.0,
        "current_throughput": 25000.0,
        "efficiency": 99.8,
        "capacity_unit": "bpd",
        "location_description": "Metering Station A",
        "commissioned_date": "2019-06-20T00:00:00Z"
    },
    
    # Well equipment (flowlines)
    "EQ_FL_W001_MAN01": {
        "id": "EQ_FL_W001_MAN01",
        "facility_id": "FS001",
        "type": "flowline",
        "name": "Well W001 Flowline",
        "tag_number": "FL-W001",
        "status": "online",
        "is_critical": False,
        "design_capacity": 5000.0,
        "current_throughput": 3200.0,
        "efficiency": 92.0,
        "capacity_unit": "bpd",
        "location_description": "Well W001 to Manifold M001",
        "commissioned_date": "2021-01-10T00:00:00Z"
    },
    "EQ_FS001_MAN01": {
        "id": "EQ_FS001_MAN01",
        "facility_id": "FS001",
        "type": "manifold",
        "name": "Production Manifold M001",
        "tag_number": "MAN-001",
        "status": "online",
        "is_critical": True,
        "design_capacity": 20000.0,
        "current_throughput": 12500.0,
        "efficiency": 96.5,
        "capacity_unit": "bpd",
        "location_description": "Manifold Area A",
        "commissioned_date": "2020-03-15T00:00:00Z"
    }
}

# Mock equipment connections representing flow network
MOCK_CONNECTIONS = [
    {
        "id": 1,
        "source_equipment_id": "EQ_FL_W001_MAN01",
        "target_equipment_id": "EQ_FS001_MAN01",
        "connection_type": "physical",
        "network_type": "oil",
        "is_active": True,
        "max_capacity": 5000.0,
        "current_flow": 3200.0,
        "capacity_unit": "bpd"
    },
    {
        "id": 2,
        "source_equipment_id": "EQ_FS001_MAN01",
        "target_equipment_id": "EQ_FS001_SEP01",
        "connection_type": "physical",
        "network_type": "oil",
        "is_active": True,
        "max_capacity": 20000.0,
        "current_flow": 12500.0,
        "capacity_unit": "bpd"
    },
    {
        "id": 3,
        "source_equipment_id": "EQ_FS001_SEP01",
        "target_equipment_id": "EQ_FS001_PUMP01",
        "connection_type": "physical",
        "network_type": "oil",
        "is_active": True,
        "max_capacity": 15000.0,
        "current_flow": 12500.0,
        "capacity_unit": "bpd"
    },
    {
        "id": 4,
        "source_equipment_id": "EQ_FS001_PUMP01",
        "target_equipment_id": "EQ_TERM01_TANK01",
        "connection_type": "physical",
        "network_type": "oil",
        "is_active": True,
        "max_capacity": 20000.0,
        "current_flow": 12500.0,
        "capacity_unit": "bpd"
    }
]

# Mock performance alerts
MOCK_ALERTS = [
    {
        "id": 1,
        "alert_id": "ALT-2025-001",
        "equipment_id": "EQ_FS001_PUMP01",
        "facility_id": "FS001",
        "alert_type": "threshold_breach",
        "severity": "warning",
        "priority": 7,
        "title": "Export Pump A Efficiency Below Target",
        "description": "Pump efficiency has dropped to 85.2%, below target of 90%",
        "recommendation": "Inspect pump impeller and check for cavitation",
        "status": "new",
        "alert_timestamp": datetime.utcnow() - timedelta(hours=2),
        "measured_value": 85.2,
        "threshold_value": 90.0,
        "measurement_unit": "%",
        "production_impact_bpd": 500.0,
        "estimated_downtime_hours": 0.0,
        "safety_critical": False
    },
    {
        "id": 2,
        "alert_id": "ALT-2025-002",
        "equipment_id": "EQ_FS001_SEP01",
        "facility_id": "FS001",
        "alert_type": "equipment_failure",
        "severity": "critical",
        "priority": 9,
        "title": "Primary Separator High Liquid Level",
        "description": "Liquid level in separator has reached 85%, approaching trip point",
        "recommendation": "Increase liquid export rate or reduce feed rate",
        "status": "acknowledged",
        "alert_timestamp": datetime.utcnow() - timedelta(minutes=30),
        "acknowledged_at": datetime.utcnow() - timedelta(minutes=25),
        "acknowledged_by": "operator1",
        "measured_value": 85.0,
        "threshold_value": 80.0,
        "measurement_unit": "%",
        "production_impact_bpd": 2000.0,
        "estimated_downtime_hours": 4.0,
        "safety_critical": True
    },
    {
        "id": 3,
        "alert_id": "ALT-2025-003",
        "equipment_id": "EQ_TERM01_METER01",
        "facility_id": "TERM01",
        "alert_type": "status_change",
        "severity": "info",
        "priority": 3,
        "title": "Custody Transfer Meter Calibration Due",
        "description": "Meter calibration is due within 7 days",
        "recommendation": "Schedule calibration with metering contractor",
        "status": "new",
        "alert_timestamp": datetime.utcnow() - timedelta(hours=6),
        "safety_critical": False
    }
]

# Mock downtime events
MOCK_DOWNTIME = [
    {
        "id": 1,
        "downtime_id": "DT-2025-001",
        "equipment_id": "EQ_FS001_COMP01",
        "start_time": datetime.utcnow() - timedelta(days=2),
        "end_time": datetime.utcnow() - timedelta(days=2, hours=-6),
        "duration_hours": 6.0,
        "downtime_reason": "planned_maintenance",
        "planned": True,
        "safety_related": False,
        "production_loss_bpd": 0.0,
        "production_loss_mscfd": 10000.0,
        "financial_impact_usd": 25000.0,
        "primary_cause": "Scheduled overhaul",
        "detection_method": "planned",
        "work_order_number": "WO-2025-0056"
    },
    {
        "id": 2,
        "downtime_id": "DT-2025-002",
        "equipment_id": "EQ_FS001_PUMP01",
        "start_time": datetime.utcnow() - timedelta(days=1),
        "end_time": datetime.utcnow() - timedelta(days=1, hours=-2),
        "duration_hours": 2.0,
        "downtime_reason": "unplanned_trip",
        "planned": False,
        "safety_related": False,
        "production_loss_bpd": 12500.0,
        "financial_impact_usd": 15000.0,
        "primary_cause": "Motor overheating",
        "secondary_cause": "Cooling fan failure",
        "detection_method": "alarm",
        "response_time_minutes": 15.0,
        "repair_time_hours": 1.5,
        "corrective_actions": "Replaced cooling fan motor"
    }
]

# Mock KPI thresholds
MOCK_THRESHOLDS = [
    {
        "id": 1,
        "threshold_name": "Pump Efficiency Minimum",
        "equipment_id": "EQ_FS001_PUMP01",
        "kpi_name": "efficiency",
        "kpi_description": "Pump hydraulic efficiency",
        "measurement_unit": "%",
        "lower_limit": 90.0,
        "target_value": 95.0,
        "alert_severity": "warning",
        "is_active": True,
        "effective_from": datetime.utcnow() - timedelta(days=30),
        "created_by": "engineer1",
        "approved_by": "supervisor1"
    },
    {
        "id": 2,
        "threshold_name": "Separator Liquid Level High",
        "equipment_id": "EQ_FS001_SEP01",
        "kpi_name": "liquid_level",
        "kpi_description": "Separator liquid level percentage",
        "measurement_unit": "%",
        "upper_limit": 80.0,
        "target_value": 50.0,
        "alert_severity": "critical",
        "is_active": True,
        "effective_from": datetime.utcnow() - timedelta(days=60),
        "created_by": "engineer1",
        "approved_by": "supervisor1"
    },
    {
        "id": 3,
        "threshold_name": "Tank Level Maximum",
        "equipment_id": "EQ_TERM01_TANK01",
        "kpi_name": "current_volume",
        "kpi_description": "Tank volume percentage",
        "measurement_unit": "%",
        "upper_limit": 95.0,
        "target_value": 80.0,
        "alert_severity": "warning",
        "is_active": True,
        "effective_from": datetime.utcnow() - timedelta(days=90),
        "created_by": "operator1",
        "approved_by": "supervisor1"
    }
]

def get_equipment_performance_data(equipment_id: str, hours_back: int = 24) -> List[Dict]:
    """Generate mock performance data for equipment"""
    data_points = []
    base_time = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    
    for i in range(hours_back):
        timestamp = base_time - timedelta(hours=i)
        
        # Generate realistic performance data based on equipment type
        if equipment_id in MOCK_EQUIPMENT:
            equipment = MOCK_EQUIPMENT[equipment_id]
            base_throughput = equipment.get("current_throughput", 100.0)
            base_efficiency = equipment.get("efficiency", 90.0)
            
            # Add some realistic variation
            throughput_variation = random.uniform(-5, 5)  # ±5% variation
            efficiency_variation = random.uniform(-2, 2)  # ±2% variation
            
            data_points.append({
                "timestamp": timestamp,
                "throughput": base_throughput * (1 + throughput_variation/100),
                "efficiency": base_efficiency + efficiency_variation,
                "availability": random.uniform(95, 100),
                "pressure": random.uniform(100, 150),
                "temperature": random.uniform(80, 120),
                "flow_rate": base_throughput * (1 + throughput_variation/100),
                "data_quality": "good"
            })
    
    return sorted(data_points, key=lambda x: x["timestamp"], reverse=True)