"""chat: settings, chats, messages, resource_tab_state

Revision ID: 0002_chat
Revises: 0001_init
Create Date: 2026-05-26
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID


revision = "0002_chat"
down_revision = "0001_init"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "settings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("openai_api_key", sa.Text(), nullable=True),
        sa.Column("anthropic_api_key", sa.Text(), nullable=True),
        sa.Column("google_api_key", sa.Text(), nullable=True),
        sa.Column("chat_provider", sa.String(16), nullable=False, server_default="google"),
        sa.Column("chat_model", sa.String(64), nullable=False, server_default="gemini-2.5-flash"),
        sa.Column("summary_provider", sa.String(16), nullable=False, server_default="google"),
        sa.Column("summary_model", sa.String(64), nullable=False, server_default="gemini-2.5-flash"),
        sa.Column("pdf_context_pages", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("ppt_context_slides", sa.Integer(), nullable=False, server_default="2"),
        sa.Column("video_context_seconds", sa.Integer(), nullable=False, server_default="90"),
        sa.Column("whisper_model", sa.String(16), nullable=False, server_default="small"),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "chats",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("project_id", UUID(as_uuid=False), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("resource_id", UUID(as_uuid=False), sa.ForeignKey("resources.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(200), nullable=False, server_default="New chat"),
        sa.Column("is_pinned", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("anchor_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_chats_resource_id", "chats", ["resource_id"])

    op.create_table(
        "messages",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("chat_id", UUID(as_uuid=False), sa.ForeignKey("chats.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.String(16), nullable=False),
        sa.Column("content_text", sa.Text(), nullable=False, server_default=""),
        sa.Column("citations_json", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")),
        sa.Column("suggested_followups_json", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_messages_chat_id", "messages", ["chat_id"])

    op.create_table(
        "resource_tab_state",
        sa.Column("resource_id", UUID(as_uuid=False), sa.ForeignKey("resources.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("open_chat_ids", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")),
        sa.Column("active_chat_id", UUID(as_uuid=False), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("resource_tab_state")
    op.drop_index("ix_messages_chat_id", table_name="messages")
    op.drop_table("messages")
    op.drop_index("ix_chats_resource_id", table_name="chats")
    op.drop_table("chats")
    op.drop_table("settings")
