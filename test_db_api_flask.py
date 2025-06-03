import requests, json
import base64

BASE_URL = "http://10.10.15.210:5001/api"

response = requests.delete(f"{BASE_URL}/delete/1562")

print("删除结果:", response.json())
# # #####################插入普通问答对（未审核）
# response = requests.post(f"{BASE_URL}/insert", json={
#     "question": "什么是Python?",
#     "answer": "编程语言",
#     "userid": "user",
#     "status": "unreviewed" # status为unreviewed，说明还没审核状态
# })
# print("插入普通问答:", response.json())

# # #####################插入管理员问答对（自动审核）
# response = requests.post(f"{BASE_URL}/insert", json={
#     "question": "什么是Flask?",
#     "answer":"Web框架",
#     "userid": "admin",
#     "status": "reviewed" # is_admin为true，说明已经是审核状态
# })
# print("插入管理员问答:", response.json())

# # #####################搜索所有问答（包含未审核）
# response = requests.get(f"{BASE_URL}/search", params={
#     "query": "什么是Python?",
# })
# print("搜索结果:", response.json())

# # json
# # {
# #   "id": 1213
# # }




# # #####################更新问答对（假设新插入的ID是id）
# id = response.json()["id"]
# response = requests.put(f"{BASE_URL}/update/{id}", json={
#     "question": "什么是Python?",
#     "answer": "python是一种编程语言",
#     "userid": "user6",
#     "status": "reviewed"
# })
# print("更新结果:", response.json())


# # #####################删除问答对id+1
# id = 0
# response = requests.delete(f"{BASE_URL}/delete/{id+1}")
# print("删除结果:", response.json())



# # 获取所有问题（未审核）
# response = requests.get(f"{BASE_URL}/questions")


# # 10.10.15.210:5001: 
# # /api/suggestions
# ## Suggestions API, get
# json
# {
#   "suggestions": [
#     "问题密集书库的图书可以外借吗",
#     "借阅图书遗失如何处理？"
#   ]

# }

# # /api/insert
# ## Questions API, get
# json
# {
#   "questions": [
#     {
#       "id": 1,
#       "question": "问题密集书库的图书可以外借吗",
#       "answer": "问题密集书库的图书一般不允许外借，主要用于现场阅读和学习。",
#       "userid": "user1",
#       "status": "reviewed"
#     },
#     {
#       "id": 2,
#       "question": "借阅图书遗失如何处理？",
#       "answer": "如果借阅的图书遗失，请及时联系图书馆工作人员进行处理，可能需要赔偿或补办手续。",
#       "userid": "user2",
#       "status": "reviewed"
#     },
#     {
#       "id": 3,
#       "question": "借的书在哪儿还？",
#       "answer": "请将借阅的图书归还到图书馆的指定还书地点。",
#       "userid": "user3",
#       "status": "unreview"
#     }
#   ]
# }

# # /api/insert
# ## Questions insert, post, 后端需要查重然后插入
# json
# {
#   "question": "新的问题1",
#   "answer": "问题的答案1",
#   "userid": "user4",
#   "status": "reviewed"
# }

# {
#   "question": "新的问题2",
#   "answer": "问题的答案2",
#   "userid": "user5",
#   "status": "unreview"
# }

# # /api/update/{id}
# ## Questions updateAPI, post
# json
# {
#   "question": "更新后的问题",
#   "answer": "更新后的答案",
#   "userid": "user6",
#   "status": "reviewed"
# }

# # /api/delete/{id}
# ## Questions delete API, post
# json
# {
#   "status": "success"
# }

# # /api/search
# ## Questions search API, get
# ## params
# {
#   "query": "借阅图书遗失"
# }
# json
# {
#   "id": 1213
# }

# ## 前端中处理多个 params
# # try {
# # const response = await axios.get('/api/search', {
# #     params: {
# #     key: btoa(unescape(encodeURIComponent(searchOptions.query))),
# #     include_unreviewed: searchOptions.includeUnreviewed,
# #     page: searchOptions.page || 1,
# #     limit: searchOptions.limit || 10,
# #     sort: searchOptions.sort || 'created_at',
# #     order: searchOptions.order || 'desc'
# #     }
# # });
# # return response.data;
# # } catch (error) {
# # console.error('搜索失败:', error);
# # throw error;
# # }