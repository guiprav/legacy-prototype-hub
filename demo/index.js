window.PrototypeHub = require('../client');

window.hub = new PrototypeHub({
  subscriptionUrl: `ws://${location.hostname}:${location.port}`,
  patchUrl: location.origin,
});

addEventListener('DOMContentLoaded', () => {
  window.statePre = document.querySelector('pre');

  hub.subscribe((err, state) => {
    if (err) {
      console.error(err);
      return;
    }

    statePre.textContent = JSON.stringify(state, null, 2);
  });

  document.querySelector('a').addEventListener('click', async () => {
    await hub.patch(st => st.abc = 123);
  });
});
