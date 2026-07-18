export function nextServerArguments(config, command, additionalArguments = []) {
  return [command, "--hostname", config.server.host, "--port", String(config.server.port), ...additionalArguments];
}
