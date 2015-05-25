Package.describe({
	summary: "Collection joins for Meteor",
	version: "1.0.0",
	git: "https://github.com/perak/meteor-joins.git"
});

Package.onUse(function (api) {
//	api.use(["mongo", "underscore"]);

	if(api.versionsFrom) {
		api.versionsFrom('METEOR@0.9.0');
	}


	api.add_files('joins.js', ["client", "server"]);
});