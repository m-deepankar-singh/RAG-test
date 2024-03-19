import os
import tempfile
from fastapi import UploadFile
from .utils import supabase
from .config import SUPABASE_BUCKET

async def upload_files_to_supabase(uploaded_files):
    filenames = []
    for file in uploaded_files:
        filename = file.filename
        temp_file_path = os.path.join(tempfile.gettempdir(), filename)
        with open(temp_file_path, "wb") as f:
            f.write(file.file.read())
        with open(temp_file_path, "rb") as f:
            res = supabase.storage.from_(SUPABASE_BUCKET).upload(filename, f)
            if res.status_code != 200:
                print(f"Error uploading {filename}: {res.body}")
            else:
                filenames.append(filename)
        os.remove(temp_file_path)
    return filenames

async def upload_file(files: list[UploadFile]):
    try:
        filenames = await upload_files_to_supabase(files)
        return filenames
    except Exception as e:
        return {"error": f"An error occurred: {str(e)}"}
