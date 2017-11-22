# Jukebox

A web based music player that accesses files on the server's local file system,
programmed in Python and Javascript.

This is still a work in progress.

## Dependencies

At Development time:
* Python 3.5 (see `requirements.txt`)
* NodeJS (see `package.json`)
* Taglib (Debian/Ubuntu: `apt-get install libtag1-dev`)
* The Sass compiler (Debian/Ubuntu `apt-get install ruby-sass`)

Python and Node dependencies can by installed by simply executing `make deps`.

At runtime, only Python 3.5 and the libraries listed in `requirements.txt` are needed.

## Compiling

Use `make` to build the production variant of the application. `make debug` produces
the development version which includes, for example, unoptimized Javascript.

After the successful termination of `make`, the application can be found inside the
`build/dist` directory.

## Running

Inside the `dist` directory, execute `main.py`. See `--help` for supported options.

## LICENSE

MIT. See `LICENSE` file.
