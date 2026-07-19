# backend/app/db/crud/__init__.py

from .user import create_user, get_user_by_id, get_user_by_email, update_user_profile
from .session import (
    create_session,
    get_session_by_id,
    update_session_status,
    end_session,
)
from .cv_profile import create_cv_profile, get_cv_profile_by_session, get_cv_profiles_by_user, get_cv_profile_by_id, update_cv_profile, delete_cv_profile
from .message import add_message, get_messages_by_session, get_message_count
from .report import create_report, get_report_by_session

__all__ = [
    # user
    "create_user",
    "get_user_by_id",
    "get_user_by_email",
    "update_user_profile",
    # session
    "create_session",
    "get_session_by_id",
    "update_session_status",
    "end_session",
    # cv_profile
    "create_cv_profile",
    "get_cv_profile_by_session",
    "get_cv_profiles_by_user",
    "get_cv_profile_by_id",
    "update_cv_profile",
    "delete_cv_profile",
    # message
    "add_message",
    "get_messages_by_session",
    "get_message_count",
    # report
    "create_report",
    "get_report_by_session",
]
