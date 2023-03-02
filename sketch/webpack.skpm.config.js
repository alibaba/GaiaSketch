const webpack = require("webpack");

module.exports = function (config, entry) {
    config.node = entry.isPluginCommand
        ? false
        : {
              setImmediate: false,
          };
    config.plugins.push(new webpack.EnvironmentPlugin(["BUILD_MODE"]));
    config.mode = process.env.BUILD_MODE === "production" ? "production" : "development";
    config.module.rules.push({
        test: /\.(html)$/,
        use: [
            {
                loader: "@skpm/extract-loader",
            },
            {
                loader: "html-loader",
                options: {
                    attrs: ["img:src", "link:href"],
                    interpolate: true,
                },
            },
        ],
    });
    config.module.rules.push({
        test: /\.(css)$/,
        use: [
            {
                loader: "@skpm/extract-loader",
            },
            {
                loader: "css-loader",
            },
        ],
    });
};
