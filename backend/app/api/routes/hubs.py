from fastapi import APIRouter, HTTPException, status

router = APIRouter(prefix="/hubs", tags=["hubs"])


@router.get("/{hub_id}/performance")
def get_hub_performance(hub_id: str, window: str = "7d"):
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Hub performance endpoint not implemented yet") 