# Google Drive Integration Guide

This guide explains how to integrate Google Drive with Stack AI, including authentication, resource management, and knowledge base creation.

## Prerequisites
- Python environment with `requests` library
- Stack AI account credentials

## 1. Authentication Setup

First, set up authentication to access the Stack AI API:

```python
import requests

def get_auth_headers(email: str, password: str) -> dict[str, str]:
    supabase_auth_url = "https://sb.stack-ai.com"
    anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZic3VhZGZxaGtseG9rbWxodHNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzM0NTg5ODAsImV4cCI6MTk4OTAzNDk4MH0.Xjry9m7oc42_MsLRc1bZhTTzip3srDjJ6fJMkwhXQ9s"

    request_url = f"{supabase_auth_url}/auth/v1/token?grant_type=password"
    response = requests.post(
        request_url,
        json={
            "email": email,
            "password": password,
            "gotrue_meta_security": {},
        },
        headers={
            "Content-Type": "application/json",
            "Apikey": anon_key,
        },
        timeout=10,
    )
    response.raise_for_status()
    return {"Authorization": f"Bearer {response.json()['access_token']}"}
```

Initialize a session with your credentials:

```python
session = requests.Session()
auth_headers = get_auth_headers("your_email@example.com", "your_password")
session.headers.update(auth_headers)

backend_url = "https://api.stack-ai.com"
org_id = session.get(f"{backend_url}/organizations/me/current").json()["org_id"]
```

## 2. Connection Management

### 2.1 List Google Drive Connections

Get all Google Drive connections:

```python
connection_list_url = f"{backend_url}/connections?connection_provider=gdrive&limit=1"
connection = session.get(connection_list_url).json()[0]

print(f"Connection ID: {connection['connection_id']}")
print(f"Connection name: {connection['name']}")
```

### 2.2 List Resources

List root resources in your Google Drive:

```python
connection_id = connection["connection_id"]
children_resources_url = f"{backend_url}/connections/{connection_id}/resources/children"
root_resources = session.get(children_resources_url).json()

for resource in root_resources:
    emoji = "📁" if resource["inode_type"] == "directory" else "📄"
    print(f"{emoji} {resource['inode_path']['path']:30} (resource_id: {resource['resource_id']})")
```

List resources in a specific directory:

```python
from urllib.parse import urlencode

data = {"resource_id": "YOUR_FOLDER_ID"}
encoded_query_params = urlencode(data)
url = f"{children_resources_url}?{encoded_query_params}"

resources = session.get(url).json()
```

## 3. Knowledge Base Management

### 3.1 Create a Knowledge Base

```python
create_kb_url = f"{backend_url}/knowledge_bases"

data = {
    "connection_id": connection_id,
    "connection_source_ids": [
        "FOLDER_ID_1",  # Example folder
        "FILE_ID_1",    # Example file
    ],
    "name": "Test Knowledge Base",
    "description": "This is a test knowledge base",
    "indexing_params": {
        "ocr": False,
        "unstructured": True,
        "embedding_params": {
            "embedding_model": "text-embedding-ada-002",
            "api_key": None
        },
        "chunker_params": {
            "chunk_size": 1500,
            "chunk_overlap": 500,
            "chunker": "sentence"
        }
    }
}

kb_response = session.post(create_kb_url, json=data)
knowledge_base_id = kb_response.json()["knowledge_base_id"]
```

### 3.2 Sync Knowledge Base

Trigger synchronization:

```python
kb_sync_url = f"{backend_url}/knowledge_bases/sync/trigger/{knowledge_base_id}/{org_id}"
sync_response = session.get(kb_sync_url)
```

### 3.3 Resource Management

List files in knowledge base:

```python
kb_children_resources_url = f"{backend_url}/knowledge_bases/{knowledge_base_id}/resources/children"
data = {"resource_path": "/"}
encoded_query_params = urlencode(data)
url = f"{kb_children_resources_url}?{encoded_query_params}"
kb_resources = session.get(url).json()
```

Delete a file:

```python
kb_resources_url = f"{backend_url}/knowledge_bases/{knowledge_base_id}/resources"
data = {"resource_path": "path/to/file.pdf"}
encoded_query_params = urlencode(data)
response = session.delete(f"{kb_resources_url}?{encoded_query_params}")
```

Create a new file:

```python
create_request_metadata = {
    "resource_type": "file",
    "resource_path": "path/to/new/file.txt",
}
file_content = b"file content"
files = {
    "file": ("file.txt", file_content, "text/plain"),
}

response = session.post(
    f"{backend_url}/knowledge_bases/{knowledge_base_id}/resources",
    files=files,
    data=create_request_metadata
)
```

## Best Practices

1. Always handle API responses with proper error checking
2. Use appropriate timeouts for requests
3. When indexing resources, avoid selecting both a parent folder and its children
4. Wait for sync operations to complete before performing additional operations
5. Use proper path formatting when creating or managing resources 