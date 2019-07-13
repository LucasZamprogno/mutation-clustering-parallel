FROM python
RUN curl -sSL https://get.docker.com/ | sh
COPY content/ content/

WORKDIR /content
RUN pip install docker

CMD python ./run-par.py
