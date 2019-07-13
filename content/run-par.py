import docker
import json
import os
N = 4

# From https://stackoverflow.com/questions/2130016/splitting-a-list-into-n-parts-of-approximately-equal-length
def split_list(seq, num):
    avg = len(seq) / float(num)
    out = []
    last = 0.0

    while last < len(seq):
        out.append(seq[int(last):int(last + avg)])
        last += avg

    return out


# https://docker-py.readthedocs.io/en/stable/containers.html
client = docker.from_env()

os.rename("Dockerfile-plan", "Dockerfile")
client.images.build(path=".", tag="plan")
os.rename("Dockerfile", "Dockerfile-plan")
os.rename("Dockerfile-mutate", "Dockerfile")
client.images.build(path=".", tag="mutate")
os.rename("Dockerfile", "Dockerfile-mutate")

client.containers.run(
    "plan",
    name="planner",
    volumes={'/content/plans': {'bind': '/app/plans', 'mode': 'rw'}}
)

with open("./plans/plans.json") as fp:
    plans = json.load(fp)
    plans = split_list(plans, N)

for ind, plan_slice in enumerate(plans):
    path = "./plans/plans-%d" % ind
    dir = "plans-%d" % ind
    os.mkdir(path)
    with open("%s/%s" % (path, "plans.json"), "w+") as out:
        json.dump(plan_slice, out)
    host_in = '/content/plans/%s' % dir
    host_out = '/content/logs'
    client.containers.run(
        "mutate",
        name="mutator-%d" % ind,
        detach=True,
        volumes={host_in: {'bind': '/app/plans', 'mode': 'rw'},
        host_out: {'bind': '/app/logs', 'mode': 'rw'}}
    )

