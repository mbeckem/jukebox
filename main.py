#!/usr/bin/env python
import logging
logging.basicConfig(level=logging.DEBUG,
                    format="%(asctime)s %(name)-15s %(levelname)-8s %(message)s",
                    datefmt="%Y-%m-%d %H:%M:%S")
logger = logging.getLogger(__name__)

import argparse
import os
from os.path import expanduser

from server.server import Server


parser = argparse.ArgumentParser(description="Run the jukebox server.")
parser.add_argument("-d", "--base-dir", type=str, default=expanduser("~"), metavar="DIR",
                    help="Base dir for serving static music files. Defaults to the user's home directory.")
parser.add_argument("-u", "--base-url", type=str, default="/", metavar="URL",
                    help="Root url at which the application can be reached. Defaults to \"/\".")
parser.add_argument("-b", "--bind", type=str, default="0.0.0.0", metavar="IP",
                    help="Listen on the given ip address. Defaults to 0.0.0.0.")
parser.add_argument("-p", "--port", type=int, default=8080,
                    help="Listen on the given port. Defaults to 8080.")
parser.add_argument("--dev", action="store_true",
                    help="Enable development mode.")


def main():
    if ("VIRTUAL_ENV" not in os.environ):
        logger.warning("not running in a virtual environment")

    args = parser.parse_args()
    srv = Server(base_dir=args.base_dir, base_url=args.base_url,
                 listen_addr=args.bind, listen_port=args.port,
                 dev=args.dev)
    srv.run()
    logging.shutdown()

if __name__ == "__main__":
    main()
