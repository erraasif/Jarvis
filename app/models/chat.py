from pydantic import BaseModel, EmailStr

class ChatRequest(BaseModel):
    user_email: EmailStr
    message: str

class ChatResponse(BaseModel):
    reply: str