// Module Federation hosts must defer their real entry so the webpack share
// scope is initialised before any shared singleton (React) is consumed.
import('./bootstrap');
