import glob
import os
import shutil
import tempfile
from fastapi import HTTPException
from .utils import (
    supabase,
    process_file,
    vector_store,
    chat_history,
    HumanMessage,
    AIMessage,
    get_context_retriever_chain,
    get_conversational_rag_chain,
)
from .models import (ChatRequest)
from .config import (SUPABASE_BUCKET, PINECONE_API_KEY)
from pinecone import Pinecone, PodSpec
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_pinecone import Pinecone

vector_store = None  # This should be initialized properly elsewhere in your code
index_name="documents"
embeddings=OpenAIEmbeddings

def process_files_from_supabase():
    global vector_store
    temp_dir = tempfile.mkdtemp()

    res = supabase.storage.from_(SUPABASE_BUCKET).list()
    for file_metadata in res:
        filename = file_metadata["name"]
        download_file_path = os.path.join(temp_dir, filename)
        with open(download_file_path, "wb") as f:
            res = supabase.storage.from_(SUPABASE_BUCKET).download(filename)
            f.write(res)

    all_files = glob.glob(f"{temp_dir}/*")
    if not all_files:
        return None, {"error": "No files found in the documents directory"}


    all_pages = []
    for file_path in all_files:
        pages = process_file(file_path)
        all_pages.extend(pages)

    embeddings = OpenAIEmbeddings(model='text-embedding-3-small')
    vector_store=Pinecone.from_documents(all_pages, embedding=embeddings, index_name=index_name)

    shutil.rmtree(temp_dir)

    return {"message": "Files processed successfully"}

async def delete_index():
    global chat_history
    pc = Pinecone(pinecone_api_key=PINECONE_API_KEY,index_name=index_name,embedding=embeddings)
    pc.delete_index("documents")
    pc.create_index(name="documents", dimension=1536, metric="cosine", spec=PodSpec(environment="gcp-starter"))
    chat_history = [AIMessage(content="Hello, I am a bot. How can I help you?")]
    res = supabase.storage.from_(SUPABASE_BUCKET).list()
    for file_metadata in res:
        filename = file_metadata["name"]
        supabase.storage.from_(SUPABASE_BUCKET).remove(filename)
    return {"message": "Pinecone index, chat history, and files deleted successfully"}

async def process_files():
    result = process_files_from_supabase()
    if 'error' in result:
        raise HTTPException(status_code=500, detail=result['error'])
    return result

async def chat(request: ChatRequest):
    global chat_history, vector_store
    if vector_store is None:
        raise HTTPException(status_code=404, detail="Vector store not found")
    try:
        user_message = HumanMessage(content=request.message)
        retriever_chain = get_context_retriever_chain(vector_store)
        conversation_rag_chain = get_conversational_rag_chain(retriever_chain)
        response = conversation_rag_chain.invoke({"chat_history": chat_history, "input": user_message})
        chat_history.append(user_message)
        ai_message = AIMessage(content=response["answer"])
        chat_history.append(ai_message)
        return response["answer"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
