"""init: projects, resources, resource_content

Revision ID: 0001_init
Revises:
Create Date: 2025-05-26
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID


revision = "0001_init"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "projects",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "resources",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column(
            "project_id",
            UUID(as_uuid=False),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("type", sa.String(16), nullable=False),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("source_path", sa.Text(), nullable=True),
        sa.Column("ingestion_status", sa.String(16), nullable=False, server_default="queued"),
        sa.Column("ingestion_error", sa.Text(), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=False, server_default=sa.text("'{}'::json")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_resources_project_id", "resources", ["project_id"])

    op.create_table(
        "resource_content",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column(
            "resource_id",
            UUID(as_uuid=False),
            sa.ForeignKey("resources.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("anchor_json", sa.JSON(), nullable=False),
        sa.Column("content_text", sa.Text(), nullable=False, server_default=""),
        sa.Column("order_index", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("ix_resource_content_resource_id", "resource_content", ["resource_id"])


def downgrade() -> None:
    op.drop_index("ix_resource_content_resource_id", table_name="resource_content")
    op.drop_table("resource_content")
    op.drop_index("ix_resources_project_id", table_name="resources")
    op.drop_table("resources")
    op.drop_table("projects")
