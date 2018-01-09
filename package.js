Package.describe({
	name: "perak:joins",
	summary: "Generic collection joins for Meteor",
	version: "1.1.9",
	git: "https://github.com/perak/meteor-joins.git"
});

Package.onUse(function (api) {
//	api.use(["mongo", "underscore"]);

	if(api.versionsFrom) {
		api.versionsFrom('METEOR@0.9.0');
	}


	api.add_files('lib/joins.js', ["client", "server"]);
});
