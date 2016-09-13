import logging
logger = logging.getLogger(__name__)

import asyncio
import os.path
import taglib

from aiohttp import web
from urllib.parse import unquote
from pathlib import PurePosixPath

from .templates import render_index

MEDIA_EXTENSIONS = {".mp3", ".ogg", ".m4a"}


def file_path(base_dir, path):
    path = os.path.normpath("/" + path).lstrip("/")
    return os.path.join(base_dir, path)


def valid_extension(filename):
    ext = os.path.splitext(filename)[1]
    return ext.lower() in MEDIA_EXTENSIONS


class LimitError(Exception):
    pass


class Server:

    def __init__(self, base_dir, base_url, listen_addr, listen_port, dev=False):
        self.dev = dev
        self.base_dir = base_dir
        self.base_url = base_url
        self.listen_addr = listen_addr
        self.listen_port = listen_port
        self.running = False

        self.loop = asyncio.get_event_loop()
        self.app = web.Application(loop=self.loop)
        self.app.router.add_route("GET", "/", self.handle_index)
        self.app.router.add_route(
            "GET", "/api/list-directory", self.handle_list)
        self.app.router.add_route(
            "GET", "/api/metadata", self.handle_metadata)
        self.app.router.add_route(
            "POST", "/api/metadata-bulk", self.handle_metadata_bulk)

        if dev:
            self.app.router.add_route(
                "GET", "/files/{path:.+}", self.handle_download)
            self.app.router.add_static("/static/", "assets")

        config = {"base_url": base_url}
        if dev:
            self.load_index = lambda: render_index(config)
        else:
            cached = render_index(config)
            self.load_index = lambda: cached

    def run(self):
        assert not self.running

        if self.dev:
            logger.warning("running in development mode")

        self.running = True
        try:
            handler = self.app.make_handler()
            created = self.loop.create_server(
                handler, self.listen_addr, self.listen_port)
            server = self.loop.run_until_complete(created)

            logger.info("listening on %s:%s",
                        self.listen_addr, self.listen_port)
            try:
                self.loop.run_forever()
            except KeyboardInterrupt:
                logger.info("keyboard interrupt")
                pass
            finally:
                server.close()
                self.loop.run_until_complete(server.wait_closed())
                self.loop.run_until_complete(self.app.shutdown())
                self.loop.run_until_complete(handler.finish_connections(1.0))
                self.loop.run_until_complete(self.app.cleanup())
                logger.info("server closed")

        finally:
            self.running = False

    def valid_path(self, request_path):
        if any(part.startswith(".")
               for part in PurePosixPath(request_path).parts):
            raise web.HTTPForbidden

        local_path = file_path(self.base_dir, request_path)
        if not os.path.exists(local_path):
            raise web.HTTPNotFound
        return local_path

    def valid_dir_path(self, request_path):
        local_path = self.valid_path(request_path)
        if not os.path.isdir(local_path):
            raise web.HTTPNotFound
        return local_path

    def valid_file_path(self, request_path):
        local_path = self.valid_path(request_path)
        if not os.path.isfile(local_path):
            raise web.HTTPNotFound

        directory, filename = os.path.split(local_path)
        if not valid_extension(filename):
            raise web.HTTPNotFound
        return local_path

    async def handle_index(self, request):
        return web.Response(content_type="text/html", text=self.load_index())

    async def handle_list(self, request):
        local_path = self.valid_dir_path(request.GET["path"])
        recursive = ("recursive" in request.GET
                     and request.GET["recursive"] != "0")

        if recursive:
            child_count = 0
            CHILD_LIMIT = 512

            def check_file_limit():
                nonlocal child_count
                if child_count >= CHILD_LIMIT:
                    raise LimitError
                child_count += 1
        else:
            def check_file_limit(): pass

        def file_generator(local_path):
            for file in os.scandir(local_path):
                visit_file = file.is_dir() or (file.is_file() and valid_extension(file.name))
                if file.name.startswith(".") or not visit_file:
                    continue

                check_file_limit()
                if file.is_dir():
                    dir = {
                        "name": file.name,
                        "type": "directory"
                    }
                    if recursive:
                        dir["files"] = list(file_generator(file.path))
                    yield dir
                else:
                    yield {
                        "name": file.name,
                        "type": "file",
                        "size": file.stat().st_size,
                    }
        try:
            files = list(file_generator(local_path))
            return web.json_response(files)
        except LimitError:
            return web.json_response({
                "type": "limit_error",
                "message": "Too many files."
            }, status=400)

    def get_tag(self, file, name):
        tags = file.tags.get(name, None)
        if tags is None:
            return None
        return tags[0] if len(tags) != 0 else None

    def fetch_metadata(self, request_path):
        local_path = self.valid_file_path(request_path)
        file = taglib.File(local_path)
        return {
            "title": self.get_tag(file, "TITLE"),
            "artist": self.get_tag(file, "ARTIST"),
            "album": self.get_tag(file, "ALBUM"),
            "duration": file.length,
        }

    async def handle_metadata(self, request):
        data = await self.loop.run_in_executor(None, self.fetch_metadata, request.get["path"])
        return web.json_response(data)

    async def handle_metadata_bulk(self, request):
        def worker(paths):
            return [self.fetch_metadata(p) for p in paths]

        # TODO Limit
        paths = await request.json()
        if len(paths) > 512:
            return web.json_response({
                "type": "limit_error",
                "message": "Too many files.",
            }, status=400)

        data = await self.loop.run_in_executor(None, worker, paths)
        return web.json_response(data)

    async def handle_download(self, request):
        local_path = self.valid_file_path(request.match_info["path"])

        with open(local_path, "rb") as f:
            return web.Response(body=f.read())
