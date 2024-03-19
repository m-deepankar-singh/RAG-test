from fastapi import APIRouter, UploadFile
from .ingest import upload_file
from .process import process_files, delete_index, chat
from .models import ChatRequest

router = APIRouter()

@router.post("/api/uploadFile")
async def upload_file_route(files: list[UploadFile]):
    return await upload_file(files)

@router.get("/api/process")
async def process_files_route():
    return await process_files()

@router.delete("/api/delete")
async def delete_index_route():
    return await delete_index()

@router.post("/api/chat")
async def chat_route(request: ChatRequest):
    return await chat(request)
