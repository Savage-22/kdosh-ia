from app.modules.usage.infrastructure import usage_model


async def get_usage_summary():
    return {"success": True, "data": await usage_model.usage_summary()}
