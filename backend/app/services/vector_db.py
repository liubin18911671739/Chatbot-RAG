from typing import List, Dict
import faiss
import numpy as np
import os

class VectorDatabase:
    def __init__(self, index_file: str):
        self.index_file = index_file
        self.index = self.load_index()

    def load_index(self):
        if os.path.exists(self.index_file):
            return faiss.read_index(self.index_file)
        else:
            return None

    def save_index(self):
        if self.index is not None:
            faiss.write_index(self.index, self.index_file)

    def add_vectors(self, vectors: np.ndarray, ids: List[str]):
        if self.index is None:
            dimension = vectors.shape[1]
            self.index = faiss.IndexFlatL2(dimension)
        self.index.add(vectors)
        # Optionally, you can store the ids in a separate structure if needed

    def search(self, query_vector: np.ndarray, k: int) -> Dict[str, float]:
        if self.index is None:
            raise ValueError("Index not initialized.")
        distances, indices = self.index.search(query_vector, k)
        return {str(idx): dist for idx, dist in zip(indices[0], distances[0])}

    def clear(self):
        self.index = None
        if os.path.exists(self.index_file):
            os.remove(self.index_file)