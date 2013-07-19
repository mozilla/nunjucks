
import time
from jinja2 import Template, Environment, FileSystemLoader

env = Environment(loader=FileSystemLoader('.'))
print env.get_template('index.html').render()

# src = open('index.html').read()

# print(env._generate(env._parse(src, 'poop', 'hello.html'),
#                     'poop',
#                     'hello.html'))

# print([x for x in env._tokenize(src, 'poop', 'hello.html')])

# env = Environment(loader=FileSystemLoader('.'))
# times = []
# arr = [5]*1000

# for i in range(100):
#     env = Environment(loader=FileSystemLoader('.'))
#     t1 = time.time()
#     tmpl = env.get_template('index.html')
#     tmpl.render({'username': 'james',
#                  'arr': arr})
#     t2 = time.time()

#     times.append(t2-t1)

# print( reduce(lambda x, y: x+y, times) / len(times))
