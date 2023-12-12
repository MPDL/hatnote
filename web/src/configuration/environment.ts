export const environmentVariables: EnvironmentVariables = {
    version: process.env.VERSION ?? '0',
    server_url: process.env.SERVER_URL ?? ''
}

interface EnvironmentVariables {
    version: string,
    server_url: string
}