# ใช้ Python เวอร์ชัน 3.12 ที่เป็น Slim (ขนาดเล็ก ประหยัดทรัพยากร)
FROM python:3.12-slim

# ตั้งค่าให้ใช้ /app เป็น directory หลัก
WORKDIR /app

# คัดลอกไฟล์ทั้งหมดเข้าไปใน container
COPY . .

# ติดตั้ง Poetry สำหรับจัดการ dependencies
RUN pip install --no-cache-dir --upgrade poetry
RUN poetry install --no-root

# กำหนดคำสั่งเริ่มต้นเมื่อ container รัน
CMD ["poetry", "run", "uvicorn", "notebook.main:create_app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
