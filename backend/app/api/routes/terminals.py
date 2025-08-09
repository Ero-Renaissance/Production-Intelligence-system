from fastapi import APIRouter, HTTPException, status

router = APIRouter(prefix="/terminal", tags=["terminal"])


@router.get("/{terminal_id}/operations")
def get_terminal_operations(terminal_id: str):
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Terminal operations endpoint not implemented yet") 