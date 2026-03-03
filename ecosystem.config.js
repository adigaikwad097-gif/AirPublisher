module.exports = {
    apps: [
        {
            name: 'air-publisher',
            script: 'npm',
            args: 'run preview -- --port 3003 --host 0.0.0.0',
            cwd: '/opt/apps/air-publisher',
            env: {
                PORT: 3003,
                NODE_ENV: 'production',
                VITE_BASE_PATH: '/publisher/'
            }
        }
    ]
};
