function isNodeBuiltin(packageName) {
  const builtins = [
    "assert", "async_hooks", "buffer", "child_process", "cluster", "console",
    "constants", "crypto", "dgram", "dns", "domain", "events", "fs", "http",
    "http2", "https", "inspector", "module", "net", "os", "path", "perf_hooks",
    "process", "punycode", "querystring", "readline", "repl", "stream",
    "string_decoder", "sys", "timers", "tls", "trace_events", "tty", "url",
    "util", "v8", "vm", "worker_threads", "zlib"
  ];
  return builtins.includes(packageName) || packageName.startsWith("node:");
}

module.exports = { isNodeBuiltin }; 