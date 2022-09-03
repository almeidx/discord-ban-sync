exports.apps = [
	{
		env: { NODE_ENV: "production" },
		name: "discord-ban-sync",
		node_args: "--enable-source-maps",
		script: "./dist/index.js",
	},
];
