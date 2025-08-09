from fastapi import APIRouter, HTTPException, status

router = APIRouter(prefix="/production-flow", tags=["production-flow"])


@router.get("")
def get_production_flow():
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Production flow endpoint not implemented yet") 