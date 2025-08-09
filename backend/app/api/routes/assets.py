from fastapi import APIRouter, HTTPException, status

router = APIRouter(prefix="/assets", tags=["assets"])


@router.get("")
def get_assets():
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Assets endpoint not implemented yet") 