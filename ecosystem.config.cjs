module.exports = {
  apps: [{
    name: 'ufb-server',
    script: 'npm',
    args: 'start',
    out_file: '/home/ubuntu/logs/ufb-server-out.log',
    error_file: '/home/ubuntu/logs/ufb-server-err.log',
    // Optional: log_file: '/custom/path/my-app-combined.log' for merged logs
    merge_logs: true  // Avoid PID suffixes on filenames
  }]
};
