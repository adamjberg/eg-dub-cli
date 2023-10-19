# eg-dub

To pack for installation:

```bash
npm pack
```

To install:

```bash
npm i -g eg-dub-cli-0.0.1.tgz
```

To run:

```bash
eg deploy
```

The last deploy time is stored in a `.engram` file.  If switching between machines, for now you'd have to delete this file to ensure any mismatched changes get overwritten.
