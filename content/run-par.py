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
client.containers.run(
    "plan",
    name="planner",
    volumes={'D:\\Documents\\UBC\\Masters\\Research\\mutation-clustering-parallel\\plans': {'bind': '/app/plans', 'mode': 'rw'}}
)

with open("./plans/plans.json") as fp:
    plans = json.load(fp)
    plans = split_list(plans, N)

for ind, plan_slice in enumerate(plans):
    path = "./plans/plans-%d" % ind
    path_no_cwd = "plans/plans-%d" % ind
    os.mkdir(path)
    with open("%s/%s" % (path, "plans.json"), "w+") as out:
        json.dump(plan_slice, out)
    host_in = 'D:\\Documents\\UBC\\Masters\\Research\\mutation-clustering-parallel\\%s' % path_no_cwd
    host_out = 'D:\\Documents\\UBC\\Masters\\Research\\mutation-clustering-parallel\\logs'
    client.containers.run(
        "mutate",
        name="mutator-%d" % ind,
        detach=True,
        volumes={host_in: {'bind': '/app/plans', 'mode': 'rw'},
        host_out: {'bind': '/app/logs', 'mode': 'rw'}}
    )

