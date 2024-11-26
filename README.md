วิธีรันฝั่งblackend
1. cd backend
2. poetry shell
3. .\scripts\run-api

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

{
  "email": "6410110238@psu.ac.th",
  "username": "admin1",
  "first_name": "admin",
  "last_name": "Pea",
  "password": "Th-238238"
}

superadmin = DBUser(
  username="superadmin",
  email="superadmin@localhost",
  first_name="Super",
  last_name="Admin",
  password="superadminpassword",
  roles=["superadmin"],
)