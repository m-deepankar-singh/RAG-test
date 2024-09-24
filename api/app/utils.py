
from supabase import create_client
from langchain.embeddings import OpenAIEmbeddings
from langchain.document_loaders import PyPDFLoader, CSVLoader, Docx2txtLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.messages import AIMessage, HumanMessage
from langchain_openai import ChatOpenAI
from langchain.chains import create_history_aware_retriever, create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from pinecone import Pinecone
import os
from dotenv import load_dotenv

load_dotenv()
# Initialize Supabase client

supabase_url = os.getenv("SUPABASE_url")
supabase_key = os.getenv("SUPABASE_KEY")
supabase=create_client(supabase_url, supabase_key)

vector_store=None


# Function to process individual files based on their extension
def process_file(file_path):
    file_extension = os.path.splitext(file_path)[-1].lower()
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    if file_extension == ".pdf":
        loader = PyPDFLoader(file_path)
    elif file_extension == ".csv":
        loader = CSVLoader(file_path=file_path, encoding="utf-8")  # You might adjust the encoding based on your files
    elif file_extension == ".docx":
        loader = Docx2txtLoader(file_path)
    elif file_extension == ".txt":
        loader = TextLoader(file_path=file_path)
    else:
        return []  # Return empty list for unsupported file types
    return loader.load_and_split(text_splitter=text_splitter)

# Global chat history and vector store; adjust as necessary for your application's flow
chat_history = [AIMessage(content="Hello, I am a bot. How can I help you?")]

# Initialize Pinecone client
def init_pinecone():
    pinecone_api_key = os.getenv("PINECONE_API_KEY")
    return Pinecone(pinecone_api_key)

# Creating context retriever chain for chat functionality
def get_context_retriever_chain(vector_store):
    llm = ChatOpenAI(model="gpt-4o-mini")  # Assuming this is properly set up in your LangChain configuration
    retriever = vector_store.as_retriever() if vector_store else None
    prompt = ChatPromptTemplate.from_messages([
        MessagesPlaceholder(variable_name="chat_history"),
        ("user", "{input}"),
        ("user", "Given the above conversation, generate a search query to look up in order to get information relevant to the conversation"),
    ])
    return create_history_aware_retriever(llm, retriever, prompt) if retriever else None

# Creating conversational chain for chat responses
def get_conversational_rag_chain(retriever_chain):

    llm = ChatOpenAI(model="gpt-4o-mini")  # Assuming this is properly set up in your LangChain configuration
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Answer the user's questions based on the below context:\n\n{context}"),
        MessagesPlaceholder(variable_name="chat_history"),
        ("user", "{input}"),
    ])
    stuff_documents_chain = create_stuff_documents_chain(llm, prompt) if retriever_chain else None
    return create_retrieval_chain(retriever_chain, stuff_documents_chain) if stuff_documents_chain else None
