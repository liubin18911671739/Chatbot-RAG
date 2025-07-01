(base) user@local:~$ curl -X POST http://10.10.15.210:5000/api/chat   -H "Content-Type: application/json"   -d '{
    "student_id": "20231001",
    "prompt": "65778591是哪个部门的电话？",
    "card_pinyin": "db_sizheng"
  }'