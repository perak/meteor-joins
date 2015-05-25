Package.describe({
	summary: "Collection joins for Meteor",
	version: "1.0.0",
	git: "https://github.com/perak/meteor-joins.git"
});

Package.onUse(function (api) {
	if(api.versionsFrom) {
		api.versionsFrom('METEOR@0.9.0');
	}

	api.use(["mongo", "underscore"]);

	api.add_files('joins.js', ["client", "server"]);
});
