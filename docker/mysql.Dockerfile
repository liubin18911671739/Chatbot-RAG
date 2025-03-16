FROM mysql:5.7

ENV MYSQL_ROOT_PASSWORD=root_password
ENV MYSQL_DATABASE=rag_qa_db
ENV MYSQL_USER=rag_user
ENV MYSQL_PASSWORD=user_password

COPY ./data/uploaded_docs /docker-entrypoint-initdb.d/uploaded_docs
COPY ./data/embeddings /docker-entrypoint-initdb.d/embeddings

EXPOSE 3306