# homebridge-hunterdouglas

Control your Hunter Douglas blinds with [homebridge](https://github.com/nfarina/homebridge).

![](http://i.giphy.com/26gsoGRBXatXJdPAQ.gif)

## Installation

1. Install homebridge using `npm install -g homebridge`
2. Install this plugin using `npm install -g homebridge-hunterdouglas`
3. Update your homebridge configuration file (see example below).

## Configuration

Add this plugin to your homebridge configuration as a platform.

```json
"platforms": [
    {
      "platform": "HunterDouglas",
      "name": "Hunter Douglas",
      "ip_address": "192.168.0.xx"
    }   
]
```

The `ip_address` field represents the IP address of your base station, you can find it by using the PowerView app and navigating to settings.

You can also specify `port` if somehow you've changed the port of the base station.

## License

MIT

---

- [exphat.com](http://exphat.com)
- GitHub [@exphat](https://github.com/exphat)
- Twitter [@exphat](https://twitter.com/exphat)
