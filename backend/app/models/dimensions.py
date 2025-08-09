from __future__ import annotations

from sqlalchemy import String, ForeignKey, Enum, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Asset(Base):
    __tablename__ = "dim_asset"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)

    hubs: Mapped[list["Hub"]] = relationship(back_populates="asset")


class Hub(Base):
    __tablename__ = "dim_hub"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    asset_id: Mapped[str] = mapped_column(ForeignKey("dim_asset.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)

    asset: Mapped[Asset] = relationship(back_populates="hubs")
    facilities: Mapped[list["Facility"]] = relationship(back_populates="hub")


FacilityType = Enum(
    "flowstation",
    "compressor_station",
    "gas_plant",
    "terminal",
    name="facility_type_enum",
)


class Facility(Base):
    __tablename__ = "dim_facility"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    hub_id: Mapped[str] = mapped_column(ForeignKey("dim_hub.id", ondelete="CASCADE"), index=True)
    type: Mapped[str] = mapped_column(FacilityType, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)

    hub: Mapped[Hub] = relationship(back_populates="facilities")
    wells: Mapped[list["Well"]] = relationship(back_populates="facility")


WellStatus = Enum(
    "Active",
    "Shut-In",
    "Maintenance",
    "Unknown",
    name="well_status_enum",
)


class Well(Base):
    __tablename__ = "dim_well"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    facility_id: Mapped[str] = mapped_column(ForeignKey("dim_facility.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(WellStatus, nullable=False, default="Unknown")
    priority: Mapped[int | None] = mapped_column(Integer, nullable=True)

    facility: Mapped[Facility] = relationship(back_populates="wells")


class Tag(Base):
    __tablename__ = "dim_tag"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source: Mapped[str] = mapped_column(String, nullable=False)
    path: Mapped[str] = mapped_column(String, nullable=False)
    unit: Mapped[str | None] = mapped_column(String, nullable=True) 