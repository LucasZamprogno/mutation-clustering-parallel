FROM python
RUN curl -sSL https://get.docker.com/ | sh
COPY content/ content/

WORKDIR /content
RUN mv Dockerfile-plan Dockerfile
RUN docker build -t plan .
RUN mv Dockerfile Dockerfile-plan
RUN mv Dockerfile-mutate Dockerfile
RUN docker build -t mutate .

CMD python ./run-par.py
