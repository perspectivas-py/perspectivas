const analytics = {
  track: (eventName, payload = {}) => {
    window.dispatchEvent(new CustomEvent("analytics", { detail: { event: eventName, ...payload } }));
    // Aquí podrías agregar integración con otros sistemas de tracking si es necesario
  }
};

export default analytics;
