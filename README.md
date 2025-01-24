วิธีรันฝั่งblackend
1. cd backend
2. poetry shell
3. .\scripts\run-api
http://172.27.128.1:8000/docs (FastAPI)

http://localhost:8000 เป็น URL ของ Backend API
http://localhost:3000 เป็น URL ของ Frontend


วิธีรันฝั่งfrontend
1. cd frontend
2. npm start

วิธี clone
1. git clone
ในbackend
1. cd backend
2. pip install poetry
3. poetry install
4. poetry shell
5. docker run -d --name D2-server -e POSTGRES_PASSWORD=123456 -p 5432:5432 postgres:16
6. docker run --name D2-PGadmin -p 5050:80 -e PGADMIN_DEFAULT_EMAIL=6410110238@psu.ac.th -e PGADMIN_DEFAULT_PASSWORD=147896325 -d dpage/pgadmin4
7. .\scripts\run-api  

target_user_id คือ บัญชีที่เราจะไปกระทำ
user_id คือ บัญชีเราที่ Login

{
  "username": "admin",
  "first_name": "Firstname",
  "last_name": "Lastname",
  "password": "password"
}
{
  "username": "adminTheeravee",
  "first_name": "Admin",
  "last_name": "PeaKub",
  "password": "238238"
}



superadmin = DBUser(
  username="superadmin",
  first_name="Super",
  last_name="Admin",
  password="superadminpassword",
  roles=["superadmin"],
)
superadmin = DBUser(
  username="superadmin2",
  first_name="Super2",
  last_name="Admin2",
  password="superadminpassword2",
  roles=["superadmin"],
)