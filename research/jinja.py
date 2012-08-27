
import time
from jinja2 import Template, Environment, FileSystemLoader

# env = Environment(loader=FileSystemLoader('.'))
# src = open('index.html').read()

# print env._generate(env._parse(src, 'poop', 'hello.html'),
#                     'poop',
#                     'hello.html')

env = Environment(loader=FileSystemLoader('.'))
times = []

for i in range(100):
    env = Environment(loader=FileSystemLoader('.'))
    t1 = time.time()
    tmpl = env.get_template('index.html')
    tmpl.render({'username': 'james',
                 'arr': [5]*1000})
    t2 = time.time()

    times.append(t2-t1)

print reduce(lambda x, y: x+y, times) / len(times)
