import httpx
from fastapi import HTTPException
import os

class GraphClient:
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.base_url = "https://graph.microsoft.com/v1.0"

    async def _headers(self):
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }

    async def _handle_response(self, response: httpx.Response):
        if response.status_code >= 400:
            try:
                error_data = response.json()
                msg = error_data.get("error", {}).get("message", "Microsoft Graph API Error")
            except Exception:
                msg = response.text or "Unknown error occurred"
            raise HTTPException(status_code=response.status_code, detail=f"Graph Error: {msg}")
        
        if response.status_code == 204:
            return {"status": "success"}
        return response.json()

    # --- CALENDAR CRUD OPERATIONS ---
    async def get_events(self):
        async with httpx.AsyncClient() as client:
            res = await client.get(f"{self.base_url}/me/events", headers=await self._headers())
            return await self._handle_response(res)

    async def create_event(self, event_data: dict):
        async with httpx.AsyncClient() as client:
            res = await client.post(f"{self.base_url}/me/events", headers=await self._headers(), json=event_data)
            return await self._handle_response(res)

    async def update_event(self, event_id: str, event_data: dict):
        async with httpx.AsyncClient() as client:
            res = await client.patch(f"{self.base_url}/me/events/{event_id}", headers=await self._headers(), json=event_data)
            return await self._handle_response(res)

    async def delete_event(self, event_id: str):
        async with httpx.AsyncClient() as client:
            res = await client.delete(f"{self.base_url}/me/events/{event_id}", headers=await self._headers())
            return await self._handle_response(res)

    # --- TO-DO / TASKS CRUD OPERATIONS ---
    async def get_task_lists(self):
        async with httpx.AsyncClient() as client:
            res = await client.get(f"{self.base_url}/me/todo/lists", headers=await self._headers())
            return await self._handle_response(res)

    async def create_task(self, list_id: str, task_data: dict):
        async with httpx.AsyncClient() as client:
            res = await client.post(f"{self.base_url}/me/todo/lists/{list_id}/tasks", headers=await self._headers(), json=task_data)
            return await self._handle_response(res)

    async def update_task(self, list_id: str, task_id: str, task_data: dict):
        async with httpx.AsyncClient() as client:
            res = await client.patch(f"{self.base_url}/me/todo/lists/{list_id}/tasks/{task_id}", headers=await self._headers(), json=task_data)
            return await self._handle_response(res)

    async def delete_task(self, list_id: str, task_id: str):
        async with httpx.AsyncClient() as client:
            res = await client.delete(f"{self.base_url}/me/todo/lists/{list_id}/tasks/{task_id}", headers=await self._headers())
            return await self._handle_response(res)


# --- COMPATIBILITY HELPER FUNCTION FOR EXISTING ROUTERS ---
async def graph_request(method: str, endpoint: str, access_token: str, json_data: dict = None):
    """Fallback helper function required by existing routers (emails.py, etc.)"""
    url = f"https://graph.microsoft.com/v1.0{endpoint}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    async with httpx.AsyncClient() as client:
        if method.upper() == "GET":
            res = await client.get(url, headers=headers)
        elif method.upper() == "POST":
            res = await client.post(url, headers=headers, json=json_data)
        elif method.upper() == "PATCH":
            res = await client.patch(url, headers=headers, json=json_data)
        elif method.upper() == "DELETE":
            res = await client.delete(url, headers=headers)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported HTTP method: {method}")

        if res.status_code >= 400:
            try:
                err_msg = res.json().get("error", {}).get("message", "Graph API Error")
            except Exception:
                err_msg = res.text or "Unknown error"
            raise HTTPException(status_code=res.status_code, detail=f"Graph Error: {err_msg}")
        
        if res.status_code == 204:
            return {"status": "success"}
        return res.json()