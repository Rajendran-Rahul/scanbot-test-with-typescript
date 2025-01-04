module.exports = {
    entry: './src/index.ts',  // Your TypeScript entry file
    output: {
      filename: 'bundle.js',
      path: __dirname + '/dist',
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',  // Transpile TypeScript to JavaScript
          exclude: /node_modules/,
        },
      ],
    },
  };
  