import json
import re
import os
from glob import glob
import ipdb
svgs = glob('./*.svg')
output = { }
reobj = re.compile(r'.*(?P<delete>\<\?xml .* ?\>).*(?P<height>height=".*")\s.*(?P<width>width=".*")\s.*')

for svg in svgs:
    name = os.path.basename(svg)
    name = name.split('.')[0]
    with open(svg) as f:
        data = f.read()
    reobj = re.compile(r'\<\?xml .* \?\>')
    data = reobj.sub('', data)
    reobj = re.compile(r' height="[^"]*" ')
    data = reobj.sub(' height="${height}" ', data)
    reobj = re.compile(r' width="[^"]*" ')
    data = reobj.sub(' width="${width}" ', data)
    output[name] = data

with open('icons.json','w') as f:
    f.write(json.dumps(output))
