
from jinja2 import Template, Environment

env = Environment()
src = open('base.html').read()

print env._generate(env._parse(src, 'poop', 'hello.html'),
                    'poop',
                    'hello.html')
