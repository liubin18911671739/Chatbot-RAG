import requests, json
import base64

BASE_URL = "http://10.10.15.210:5001/api"

# #####################插入普通问答对（未审核）
response = requests.post(f"{BASE_URL}/insert", json={
    "key": base64.b64encode("什么是Python?".encode()).decode(),
    "value": base64.b64encode("编程语言".encode()).decode(),
    "upload_userid": "user",
    "is_admin": False # is_admin为false，说明还没审核状态
})
print("插入普通问答:", response.json())

# #####################插入管理员问答对（自动审核）
response = requests.post(f"{BASE_URL}/insert", json={
    "key": base64.b64encode("什么是Flask?".encode()).decode(),
    "value": base64.b64encode("Web框架".encode()).decode(),
    "upload_userid": "admin",
    "is_admin": True # is_admin为true，说明已经是审核状态
})
print("插入管理员问答:", response.json())

# #####################搜索所有问答（包含未审核）
serache_response = requests.get(f"{BASE_URL}/search", params={
    "key": base64.b64encode("什么是Python?".encode()).decode(),
    "include_unreviewed": "true" # include_unreviewed为true,说明搜索所有问答（包含未审核），为false,说明仅搜索已经审核的
})
print("搜索结果:")
print(json.dumps(
    [{
        **item,
        "key": base64.b64decode(item["key"]).decode("utf-8"),
        "value": base64.b64decode(item["value"]).decode("utf-8")
    } for item in serache_response.json()["results"]],
    indent=2,
    ensure_ascii=False  # 正确显示中文
))




# #####################获取所有问题
response = requests.get(f"{BASE_URL}/questions")
print("所有问题:")
print(json.dumps(
    [{
        **item,
        "key": base64.b64decode(item["key"]).decode("utf-8"),
    } for item in response.json()["questions"]],
    indent=2,
    ensure_ascii=False  # 正确显示中文
))



# #####################更新问答对（假设新插入的ID是id）
item = serache_response.json()["results"][0]
id = item["id"]
response = requests.put(f"{BASE_URL}/update/{id}", json={
    "new_key": base64.b64encode("Python是什么?".encode()).decode(),
    "new_value": base64.b64encode("我是一种编程语言".encode()).decode(),
    "upload_userid":"admin_008",
})
print("更新结果:", response.json())


# #####################删除问答对id+1
id = 0
response = requests.delete(f"{BASE_URL}/delete/{id+1}")
print("删除结果:", response.json())