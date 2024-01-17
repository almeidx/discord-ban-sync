exports.apps = [
	{
		name: "discord-ban-sync",
		script: "dist/index.js",
		node_args: "--enable-source-maps --env-file=.env",
	},
];
