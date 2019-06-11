import json
import re
import os
from glob import glob
import ipdb
svgs = glob('./*.svg')
output = { }

for svg in svgs:
    name = os.path.basename(svg)
    name = name.split('.')[0]
    with open(svg) as f:
        data = f.read()
    reobj = re.compile(r'\<\?xml .* \?\>')
    data = reobj.sub('', data)
    reobj = re.compile(r'(\<svg[^>]* )height="[^"]*" ')
    data = reobj.sub(r'\1height="${height}" ', data)
    reobj = re.compile(r'(\<svg[^>]* )width="[^"]*" ')
    data = reobj.sub(r'\1width="${width}" ', data)
    output[name] = data

with open('icons.json','w') as f:
    f.write(json.dumps(output))
