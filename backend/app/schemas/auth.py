from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class AdminUserResponse(BaseModel):
    id: int
    email: str
    full_name: str | None
    is_active: bool

    model_config = {"from_attributes": True}
