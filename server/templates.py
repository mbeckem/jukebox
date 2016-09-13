import json
import os.path

from urllib.parse import urljoin
from jinja2 import Environment, FileSystemLoader
from pathlib import PurePosixPath


def render_index(config):
    return env.get_template("index.tmpl").render(config=config)


def _join_url(path, root):
    return "/".join((root.rstrip("/"), path.lstrip("/")))


local_dir = os.path.dirname(__file__)
env = Environment(loader=FileSystemLoader(local_dir), autoescape=False)
env.filters["json"] = lambda v: json.dumps(v)
env.filters["join_url"] = _join_url
