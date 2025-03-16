# generate_embeddings.py

import os
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import normalize
from backend.app.services.vector_db import VectorDB

def load_documents(documents_path):
    documents = []
    for filename in os.listdir(documents_path):
        if filename.endswith('.txt'):
            with open(os.path.join(documents_path, filename), 'r', encoding='utf-8') as file:
                documents.append(file.read())
    return documents

def generate_embeddings(documents):
    vectorizer = TfidfVectorizer()
    embeddings = vectorizer.fit_transform(documents)
    normalized_embeddings = normalize(embeddings)
    return normalized_embeddings

def save_embeddings(embeddings, output_path):
    np.save(output_path, embeddings.toarray())

def main():
    documents_path = '../data/uploaded_docs'
    output_path = '../data/embeddings/embeddings.npy'
    
    documents = load_documents(documents_path)
    embeddings = generate_embeddings(documents)
    save_embeddings(embeddings, output_path)
    
    vector_db = VectorDB()
    vector_db.store_embeddings(output_path)

if __name__ == '__main__':
    main()