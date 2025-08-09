from fastapi import APIRouter, HTTPException, status

router = APIRouter(prefix="/summary", tags=["summary"])


@router.get("")
def get_summary():
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Summary endpoint not implemented yet") 