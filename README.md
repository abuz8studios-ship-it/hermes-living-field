# Living Field

The spatial desk Ahmad built for ABUZ8 before Hermes Desktop existed, reduced to a Hermes pane.

Origin: `ABUZ8_OS_DIST/src/renderer/js/three-stage.js` — four domains (Dream, Forge, Command, Abyss), a neural field, synapses that fire from real state. That file uses a vendored Three.js module. A catalog desktop plugin may only import `@hermes/plugin-sdk` and React, so this pane draws the same field on a canvas. It does not fetch Three.js. It does not invent metrics.

## What moves

- Synapses speed up only while `host.state.busy` is true (the focused session is in a turn).
- The field dims when `host.state.gateway` is not `open`. The label shows the real socket word.
- The model line is `host.state.model`, or `no model`.
- Neuron positions are seeded. The picture is stable across opens.

## What it does not do

- No network.
- No shell.
- No second model.
- No token counts, no revenue numbers, no fake "connected".
- It does not replace Hermes Desktop. It is one pane inside it.

## Install

```bash
hermes plugins install https://github.com/abuz8studios-ship-it/hermes-living-field
```

Desktop: Capabilities → Plugins → enable Living Field → Rescan if the pane is missing.

## 90-second demo

1. Enable Living Field. Open the pane. Chip reads `field idle`. Socket line matches the real gateway state.
2. Send a message that makes Hermes work.
3. Synapses go gold and the chip reads `field live` for the duration of that turn.
4. When the turn ends, it returns to idle. That is the plugin.

## License

MIT
