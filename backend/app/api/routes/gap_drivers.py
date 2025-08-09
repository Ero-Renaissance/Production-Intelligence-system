from fastapi import APIRouter, HTTPException, status

router = APIRouter(prefix="/gap-drivers", tags=["gap-drivers"])


@router.get("")
def get_gap_drivers(assetId: str | None = None, facilityIds: str | None = None, window: str = "7d"):
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Gap drivers endpoint not implemented yet") 