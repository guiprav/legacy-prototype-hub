let { produce } = require('immer');

module.exports = class PrototypeHub {
  constructor(config) {
    Object.assign(this, config);
  }

  async subscribe(cb) {
    if (this.ws) {
      throw new Error('Already subscribed');
    }

    let ws = new WebSocket(this.subscriptionUrl);

    await new Promise((resolve, reject) => {
      let onError = err => {
        clear();
        reject(err);
      };

      let onOpen = () => {
        clear();
        resolve();
      };

      let clear = () => {
        ws.removeEventListener('error', onError);
        ws.removeEventListener('open', onOpen);
      };

      ws.addEventListener('error', onError);
      ws.addEventListener('open', onOpen);
    });

    let onClose = () => {
      this.ws = null;
    };

    let onError = err => {
      ws.removeEventListener('close', onClose);
      ws.removeEventListener('error', onError);
      ws.removeEventListener('message', onMessage);

      this.ws = null;

      cb(err);
    };

    let onMessage = ev => cb(null, this.state = JSON.parse(ev.data));

    ws.addEventListener('close', onClose);
    ws.addEventListener('error', onError);
    ws.addEventListener('message', onMessage);

    return this.ws = ws;
  }

  async patch(cb) {
    let patches;

    produce(
      this.state,
      state => { cb(state); },
      xs => patches = xs,
    );

    let res = await fetch(this.patchUrl, {
      method: 'PATCH',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify(patches),
    });

    if (!res.ok) {
      throw new Error(`${res.status} (${res.statusText})`);
    }

    return this.state = await res.json();
  }
};
