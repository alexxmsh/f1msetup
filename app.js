if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then((registration) => {
      console.log('Service Worker registrato con successo:', registration.scope);
    }).catch((error) => {
      console.log('Registrazione del Service Worker fallita:', error);
    });
  });
}
