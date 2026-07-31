"""
Agent State Definition
======================
Defines the TypedDict schema for JARVIS's LangGraph state graph.
"""

from typing import TypedDict, Annotated, Sequence
import operator
from langchain_core.messages import BaseMessage


class AgentState(TypedDict):
    """
    Schema representing the execution state of the JARVIS agent.
    
    Attributes:
        messages: Conversation message history with additive reducer.
        user_email: Authenticated user's primary email address.
        user_timezone: User's IANA timezone string (e.g., 'Asia/Karachi').
    """
    messages: Annotated[Sequence[BaseMessage], operator.add]
    user_email: str
    user_timezone: str