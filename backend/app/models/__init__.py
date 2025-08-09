from app.db.base import Base  # re-export

# Import models so Alembic can discover metadata
from .dimensions import Asset, Hub, Facility, Well, Tag  # noqa: F401
from .facts import DailyProduction, TerminalKpi, GapDriver  # noqa: F401
from .meta import IngestionRun  # noqa: F401 

# Import new equipment and alerting models
from .equipment import (  # noqa: F401
    BaseEquipment, Flowline, Manifold, Separator, Pump, Compressor,
    Pipeline, StorageTank, FlowMeter, EquipmentConnection, EquipmentPerformance
)
from .alerts import (  # noqa: F401
    PerformanceAlert, KPIThreshold, DowntimeEvent, AlertRule,
    AlertNotification, AlertEscalation
)