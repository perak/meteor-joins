var Mongo = Package.mongo.Mongo;
var Random = Package.random.Random;

var globalContext = this;

var accessPropertyViaDotNotation = function(propertyName, obj) {
	var props = propertyName.split(".");
	var res = obj;
	for(var i = 0; i < props.length; i++) {
		res = res[props[i]];
		if(typeof res == "undefined") {
			return res;
		}
	}
	return res;
};

var __original = {
	find: Mongo.Collection.prototype.find,
	findOne: Mongo.Collection.prototype.findOne
};

//----

this._ReactiveJoins = new Mongo.Collection("reactive_joins");

if(Meteor.isServer) {
	Meteor.publish({
		reactive_joins: function() {
			return _ReactiveJoins.find();
		}
	});
} else {
	__original.subscribe = Meteor.subscribe;

	Meteor.subscribe = function() {
		var args = [];
		for(var i = 0; i < arguments.length; i++) {
			args.push(arguments[i]);
		}

		if(args.length) {
			var update = _ReactiveJoins.findOne({ name: args[0] });
			if(update) {
				args.push(update.updateId);
			}
		}
		return __original.subscribe.apply(null, args);
	};


	Meteor.startup(function() {
		Meteor.subscribe("reactive_joins");
	});
}


Mongo.Collection.prototype.doJoin = function(collectionObject, collectionName, collectionNameField, foreignKey, containerField, fieldList) {
	this._joins = this._joins || [];

	this._joins.push({
		collectionObject: collectionObject,
		collectionName: collectionName,
		collectionNameField: collectionNameField,
		foreignKey: foreignKey,
		containerField: containerField,
		fieldList: fieldList
	});

	this.transformFind = function(originalFind, selector, options) {
		var self = this;
		selector = selector || {};
		options = options || {};

		var originalTransform = options.transform || null;

		options.transform = function (doc) {
			_.each(self._joins, function (join) {
				var opt = {};
				if (join.fieldList && join.fieldList.length) {
					opt.fields = {};
					_.each(join.fieldList, function (field) {
						opt.fields[field] = 1;
					});
				}

				var coll = null;
				if (join.collectionObject)
					coll = join.collectionObject;
				else if (join.collectionName)
					coll = globalContext[join.collectionName];
				else if (join.collectionNameField)
					coll = globalContext[doc[join.collectionNameField]];

				if (coll) {
					var container = join.containerField || coll._name + "_joined";
					doc[container] = __original.findOne.call(coll, {_id: accessPropertyViaDotNotation(join.foreignKey, doc)}, opt) || {};
				}
			});
			if (originalTransform)
				return originalTransform(doc);
			else
				return doc;
		};
		return originalFind.call(this, selector, options);
	};

	this.findOne = function (selector, options) {
		return this.transformFind(__original.findOne, selector, options);
	};

	this.find = function (selector, options) {
		return this.transformFind(__original.find, selector, options);
	};

};

// collection argument can be collection object or collection name
Mongo.Collection.prototype.join = function(collection, foreignKey, containerField, fieldList) {
	var collectionObject = null;
	var collectionName = "";

	if(_.isString(collection)) {
		collectionName = collection;
	} else {
		collectionObject = collection;
	}

	this.doJoin(collectionObject, collectionName, "", foreignKey, containerField, fieldList);
};

Mongo.Collection.prototype.genericJoin = function(collectionNameField, foreignKey, containerField) {
	this.doJoin(null, "", collectionNameField, foreignKey, containerField, []);
};

Mongo.Collection.prototype.publishJoinedCursors = function(cursor, options, publication) {

	var self = this;
	var filters = {};

	_.each(this._joins, function(join) {

		if(join.collectionObject || join.collectionName) {
			var coll = null;

			if(join.collectionObject) {
				coll = join.collectionObject;
			} else {
				coll = globalContext[join.collectionName];
			}

			if(coll) {
				var ids = cursor.map(function(doc) { return accessPropertyViaDotNotation(join.foreignKey, doc); });
				if(!filters[coll._name]) {
					filters[coll._name] = {
						collection: coll,
						filter: { _id: { $in: ids } },
						foreignKeys: [join.foreignKey]
					};
				} else {
					filters[coll._name].filter._id["$in"] = _.union(filters[coll._name].filter._id["$in"], ids);
					filters[coll._name].foreignKeys.push(join.foreignKey);
				}

				var options = filters[coll._name].options || {};
				if(join.fieldList && join.fieldList.length) {
					if(!options.fields) {
						options.fields = {};
					}
					_.each(join.fieldList, function(field) {
						options.fields[field] = 1;
					});
				}
				filters[coll._name].options = options;
			}

		} else if(join.collectionNameField) {
			var data = cursor.map(function(doc) {
				var res = {};
				res[join.collectionNameField] = doc[join.collectionNameField];
				res[join.foreignKey] = accessPropertyViaDotNotation(join.foreignKey, doc);
				return res;
			});

			var collectionNames = _.uniq(_.map(data, function(doc) { return doc[join.collectionNameField]; }));
			_.each(collectionNames, function(collectionName) {
				var coll = globalContext[collectionName];
				if(coll) {
					var ids = _.map(_.filter(data, function(doc) { return doc[join.collectionNameField] === collectionName; }), function(el) { return accessPropertyViaDotNotation(join.foreignKey, el); });
					if(!filters[coll._name]) {
						filters[coll._name] = {
							collection: coll,
						    filter: { _id: { $in: ids } },
							foreignKeys: [join.foreignKey]
						};
					} else {
						filters[coll._name].filter._id["$in"] = _.union(filters[coll._name].filter._id["$in"], ids);
						filters[coll._name].foreignKeys.push(join.foreignKey);
					}

					var options = filters[coll._name].options || {};
					if(join.fieldList && join.fieldList.length) {
						if(!options.fields) {
							options.fields = {};
						}
						_.each(join.fieldList, function(field) {
							options.fields[field] = 1;
						});
					}
					filters[coll._name].options = options;
				}
			});
		}
	});		

	var observers = [];

	if(options && options.reactive && publication) {
		var observer = cursor.observe({
			added: function(newDocument) {
				if(publication._ready) {
					_ReactiveJoins.upsert({ name: publication._name }, { $set: { name: publication._name, updateId: Random.id() }});
				}
			},
			changed: function(newDocument, oldDocument) {
				if(publication._ready) {
					var needUpdate = false;
					for(var key in filters) {
						var filter = filters[key];
						if(filter && filter.foreignKeys) {
							filter.foreignKeys.map(function(foreignKey) {
								if(oldDocument[foreignKey] != newDocument[foreignKey]) {
									needUpdate = true;
								}
							});							
						}
					}

					if(needUpdate) {
						_ReactiveJoins.upsert({ name: publication._name }, { $set: { name: publication._name, updateId: Random.id() }});
					}
				}
			}
		});

		observers.push(observer);
	}

	var cursors = [];
	cursors.push(cursor);

	for(var key in filters) {
		var filter = filters[key];
		if(filter && filter.collection && filter.filter) {
			var cur = filter.collection.find(filter.filter, filter.options);

			if(options && options.reactive && publication) {
				var observer = cur.observe({
					changed: function (newDocument, oldDocument) {
						if(publication._ready) {
							_ReactiveJoins.upsert({ name: publication._name }, { $set: { name: publication._name, updateId: Random.id() }});
						}
					}
				});

				observers.push(observer);
			}
			cursors.push(cur);
		}
	}

	if(publication) {
		publication.onStop(function() {
			observers.map(function(observer) {
				observer.stop();
			})
		});
	}

	return cursors;	
};
