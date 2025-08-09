from __future__ import annotations

from sqlalchemy import String, ForeignKey, Integer, Date, DateTime, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class DailyProduction(Base):
    __tablename__ = "fact_daily_production"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    well_id: Mapped[str] = mapped_column(ForeignKey("dim_well.id", ondelete="CASCADE"), index=True)
    date: Mapped[Date] = mapped_column(Date, index=True)

    oil_bbl_d: Mapped[float | None] = mapped_column(Numeric(18, 3), nullable=True)
    gas_mscf_d: Mapped[float | None] = mapped_column(Numeric(18, 3), nullable=True)
    water_bbl_d: Mapped[float | None] = mapped_column(Numeric(18, 3), nullable=True)

    bsw_pct: Mapped[float | None] = mapped_column(Numeric(6, 3), nullable=True)
    gor_scf_bbl: Mapped[float | None] = mapped_column(Numeric(12, 3), nullable=True)

    updated_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class TerminalKpi(Base):
    __tablename__ = "fact_terminal_kpi"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    terminal_id: Mapped[str] = mapped_column(ForeignKey("dim_facility.id", ondelete="CASCADE"), index=True)
    ts: Mapped[DateTime] = mapped_column(DateTime(timezone=True), index=True)

    capacity_mmbbl: Mapped[float | None] = mapped_column(Numeric(18, 3), nullable=True)
    gross_mmbbl: Mapped[float | None] = mapped_column(Numeric(18, 3), nullable=True)
    ready_kbpd: Mapped[float | None] = mapped_column(Numeric(18, 3), nullable=True)
    rate_kbpd: Mapped[float | None] = mapped_column(Numeric(18, 3), nullable=True)
    endurance_d: Mapped[float | None] = mapped_column(Numeric(18, 3), nullable=True)


class GapDriver(Base):
    __tablename__ = "fact_gap_driver"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    facility_id: Mapped[str] = mapped_column(ForeignKey("dim_facility.id", ondelete="CASCADE"), index=True)
    ts: Mapped[DateTime] = mapped_column(DateTime(timezone=True), index=True)

    stream: Mapped[str] = mapped_column(String, nullable=False)  # oil/domesticGas/exportGas/flaredGas
    lost: Mapped[float] = mapped_column(Numeric(18, 3), nullable=False)
    unit: Mapped[str] = mapped_column(String, nullable=False)  # bbl/d, mscf/d
    percent: Mapped[float | None] = mapped_column(Numeric(6, 3), nullable=True)
    priority: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str | None] = mapped_column(String, nullable=True) 