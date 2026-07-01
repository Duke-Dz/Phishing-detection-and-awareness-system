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
      },
    },
    {
      name: "pdas-scan-worker",
      script: "worker.js",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
