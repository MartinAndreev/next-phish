import {
  initializeContainer,
  registerAuth,
  Container as BackendContainer,
} from "@next-phish/backend";

initializeContainer();

const Container = BackendContainer;

export { Container };

// Register auth-dependent services after container is initialized
// This breaks the circular dependency: container.ts → auth.ts → container.ts
import("./auth").then(({ auth }) => {
  registerAuth(auth);
});
