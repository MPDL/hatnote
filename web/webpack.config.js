const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Dotenv = require('dotenv-webpack');

module.exports = (env) => {
    return [
        Object.assign({}, common(env), frontend(env)),
        Object.assign({}, common(env), backend)
    ];
}

const common = (env) => {
    return {
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/,
                },
            ]
        },
        plugins: [
            new Dotenv({
                defaults: './.env.defaults',
                path: './.env.' + env.HATNOTE_ENV
            }),
        ],
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
        },
    }
};


const backend = {
    entry: [
        './src/server.ts'
    ],
    output: {
        filename: 'server.js',
        path: path.resolve(__dirname, 'dist'),
    },
    target: 'node',
}

const frontend = (env) => {
    return {
        entry: './src/main.ts',
        devtool: 'inline-source-map',
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/,
                },
                {
                    test: /\.css$/i,
                    use: ['style-loader', 'css-loader'],
                },
                {
                    test: /\.(woff|woff2|eot|ttf|otf)$/i,
                    type: 'asset/resource',
                    generator: {
                        filename: '[path][name][ext]'
                    }
                },
                {
                    test: /\.(png|svg|jpg|jpeg|gif)$/i,
                    type: 'asset/resource',
                    generator: {
                        filename: '[path][name][ext]'
                    }
                },
                {
                    test: /\.(ogg|mp3|wav)$/i,
                    type: 'asset/resource',
                    generator: {
                        filename: '[path][name][ext]'
                    }
                },
            ],
        },
        plugins: [
            new HtmlWebpackPlugin({
                title: "MPDL Hatnote Visualisation",
                favicon: "./assets/images/favicon.ico",
                template: "index.html",
                meta: {
                    title: "MPDL Hatnote Visualisation",
                    description: "Audiovisualisation of MPDL services.",
                    keywords: "hatnote, audio, service events, visualisation",
                    author: "Originally: Stephen LaPorte and Mahmoud Hashemi, Recreated by: Felix Riehm",
                    'theme-color': "#1c2733"
                },
                minify: false
            }),
            new Dotenv({
                defaults: './.env.defaults',
                path: './.env.' + env.HATNOTE_ENV
            }),
        ],
        output: {
            filename: 'bundle.js',
            publicPath: getBasePath(env),
            path: path.resolve(__dirname, 'dist'),
        },
    }
}

const getBasePath = (env) => {
    switch (env.HATNOTE_ENV) {
        case 'production':
        case 'development.local':
            return '/'
        case 'staging':
            return '/staging/'
        default:
            return '/'
    }
}