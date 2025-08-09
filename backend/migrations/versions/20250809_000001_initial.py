from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20250809_000001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enums (create once, safely)
    well_status_enum = sa.Enum("Active", "Shut-In", "Maintenance", "Unknown", name="well_status_enum")
    facility_type_enum = sa.Enum("flowstation", "compressor_station", "gas_plant", "terminal", name="facility_type_enum")
    well_status_enum.create(op.get_bind(), checkfirst=True)
    facility_type_enum.create(op.get_bind(), checkfirst=True)

    # Dimensions
    op.create_table(
        "dim_asset",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
    )

    op.create_table(
        "dim_hub",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("asset_id", sa.String(), sa.ForeignKey("dim_asset.id", ondelete="CASCADE"), index=True),
        sa.Column("name", sa.String(), nullable=False),
    )

    op.create_table(
        "dim_facility",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("hub_id", sa.String(), sa.ForeignKey("dim_hub.id", ondelete="CASCADE"), index=True),
        sa.Column(
            "type",
            postgresql.ENUM(
                "flowstation",
                "compressor_station",
                "gas_plant",
                "terminal",
                name="facility_type_enum",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column("name", sa.String(), nullable=False),
    )

    op.create_table(
        "dim_well",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("facility_id", sa.String(), sa.ForeignKey("dim_facility.id", ondelete="CASCADE"), index=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column(
            "status",
            postgresql.ENUM(
                "Active",
                "Shut-In",
                "Maintenance",
                "Unknown",
                name="well_status_enum",
                create_type=False,
            ),
            nullable=False,
            server_default="Unknown",
        ),
        sa.Column("priority", sa.Integer(), nullable=True),
    )

    op.create_table(
        "dim_tag",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("source", sa.String(), nullable=False),
        sa.Column("path", sa.String(), nullable=False),
        sa.Column("unit", sa.String(), nullable=True),
    )

    # Facts
    op.create_table(
        "fact_daily_production",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("well_id", sa.String(), sa.ForeignKey("dim_well.id", ondelete="CASCADE"), index=True),
        sa.Column("date", sa.Date(), index=True),
        sa.Column("oil_bbl_d", sa.Numeric(18, 3), nullable=True),
        sa.Column("gas_mscf_d", sa.Numeric(18, 3), nullable=True),
        sa.Column("water_bbl_d", sa.Numeric(18, 3), nullable=True),
        sa.Column("bsw_pct", sa.Numeric(6, 3), nullable=True),
        sa.Column("gor_scf_bbl", sa.Numeric(12, 3), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "fact_terminal_kpi",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("terminal_id", sa.String(), sa.ForeignKey("dim_facility.id", ondelete="CASCADE"), index=True),
        sa.Column("ts", sa.DateTime(timezone=True), index=True),
        sa.Column("capacity_mmbbl", sa.Numeric(18, 3), nullable=True),
        sa.Column("gross_mmbbl", sa.Numeric(18, 3), nullable=True),
        sa.Column("ready_kbpd", sa.Numeric(18, 3), nullable=True),
        sa.Column("rate_kbpd", sa.Numeric(18, 3), nullable=True),
        sa.Column("endurance_d", sa.Numeric(18, 3), nullable=True),
    )

    op.create_table(
        "fact_gap_driver",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("facility_id", sa.String(), sa.ForeignKey("dim_facility.id", ondelete="CASCADE"), index=True),
        sa.Column("ts", sa.DateTime(timezone=True), index=True),
        sa.Column("stream", sa.String(), nullable=False),
        sa.Column("lost", sa.Numeric(18, 3), nullable=False),
        sa.Column("unit", sa.String(), nullable=False),
        sa.Column("percent", sa.Numeric(6, 3), nullable=True),
        sa.Column("priority", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
    )

    # Meta
    op.create_table(
        "meta_ingestion_run",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("source", sa.String(), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("watermark", sa.String(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("meta_ingestion_run")
    op.drop_table("fact_gap_driver")
    op.drop_table("fact_terminal_kpi")
    op.drop_table("fact_daily_production")
    op.drop_table("dim_tag")
    op.drop_table("dim_well")
    op.drop_table("dim_facility")
    op.drop_table("dim_hub")
    op.drop_table("dim_asset")

    op.execute("DROP TYPE IF EXISTS well_status_enum")
    op.execute("DROP TYPE IF EXISTS facility_type_enum") 