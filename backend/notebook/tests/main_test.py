from fastapi.testclient import TestClient
from notebook.main import create_app

app = create_app()
client = TestClient(app)

# test การสร้างสูตรอาหาร (ไม่มี user)
def test_create_memo():
    response_create = client.post("/memos/create")
    assert response_create.status_code == 401

# test การเข้าอ่านสูตรอาหารแบบเจาะจง (ยังไม่มีสูตรอาหาร)
def test_read_memos_ID():
    response_id = client.get("/1")
    assert response_id.status_code == 404