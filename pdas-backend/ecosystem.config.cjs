module.exports = {
  apps: [
    {
      name: "pdas-backend",
      script: "server.js",
      instances: process.env.WEB_CONCURRENCY || 2,
      exec_mode: "cluster",
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        SCAN_WORKER_ENABLED: "false",
      },
    },
    {
      name: "pdas-scan-worker",
      script: "server.js",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        SCAN_WORKER_ENABLED: "true",
        WORKER_ONLY: "true",
      },
    },
  ],
};
