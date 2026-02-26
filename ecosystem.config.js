module.exports = {
    apps: [
        {
            name: 'air-publisher',
            script: 'npm',
            args: 'run dev',
            env: {
                PORT: 8000,
                NODE_ENV: 'development'
            }
        }
    ]
};
