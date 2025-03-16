import unittest
from app.services.rag_service import RagService
from app.models.chat import Chat
from app.models.document import Document

class TestRagService(unittest.TestCase):

    def setUp(self):
        self.rag_service = RagService()
        self.test_chat = Chat(user_id=1, content="Test question")
        self.test_document = Document(title="Test Document", content="This is a test document.")

    def test_generate_answer(self):
        answer = self.rag_service.generate_answer(self.test_chat)
        self.assertIsNotNone(answer)
        self.assertIn("Test", answer)  # Assuming the answer should contain part of the question

    def test_add_document(self):
        result = self.rag_service.add_document(self.test_document)
        self.assertTrue(result)
        # Verify that the document is added correctly
        self.assertIn(self.test_document, self.rag_service.documents)

    def test_get_documents(self):
        self.rag_service.add_document(self.test_document)
        documents = self.rag_service.get_documents()
        self.assertGreater(len(documents), 0)
        self.assertIn(self.test_document, documents)

if __name__ == '__main__':
    unittest.main()