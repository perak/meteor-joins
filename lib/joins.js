var Mongo = Package.mongo.Mongo;

var __original = {
  find: Mongo.Collection.prototype.find,
  findOne: Mongo.Collection.prototype.findOne
};

Mongo.Collection.prototype._joins = [];

Mongo.Collection.prototype.join = function(collection, foreignKey, containerField, fieldList) {
	this._joins.push({
		collection: collection,
		foreignKey: foreignKey,
		containerField: containerField,
		fieldList: fieldList
	});
};

Mongo.Collection.prototype.findOne = function(selector, options) {
	var self = this;
	var selector = selector || {};
	var options = options || {};
	var originalTransform = options.transform || null;

	options.transform = function(doc) {
		_.each(self._joins, function(join) {
			var opt = {};
			var removeId = true;
			if(join.fieldList && join.fieldList.length) {
				opt.fields = {};
				_.each(join.fieldList, function(field) {
					opt.fields[field] = 1;
					if(field == "_id") removeId = false;
				});
			}
			var data = __original.findOne.call(join.collection, { _id: doc[join.foreignKey] }, opt);
			if(data && removeId) delete data._id;
			doc[join.containerField] = data;
		});
		if(originalTransform) 
			return originalTransform(doc);
		else
			return doc;
	};

	return __original.findOne.call(this, selector, options);
};

Mongo.Collection.prototype.find = function(selector, options) {
	var self = this;
	var selector = selector || {};
	var options = options || {};
	var originalTransform = options.transform || null;

	options.transform = function(doc) {
		_.each(self._joins, function(join) {
			var opt = {};
			var removeId = true;
			if(join.fieldList && join.fieldList.length) {
				opt.fields = {};
				_.each(join.fieldList, function(field) {
					opt.fields[field] = 1;
					if(field == "_id") removeId = false;
				});
			}
			var data = __original.findOne.call(join.collection, { _id: doc[join.foreignKey] }, opt);
			if(data && removeId) delete data._id;
			doc[join.containerField] = data;
		});
		if(originalTransform) 
			return originalTransform(doc);
		else
			return doc;
	};

	return __original.find.call(this, selector, options);
};


Mongo.Collection.prototype.publishJoinedCursors = function(cursor) {
	var cursors = [];
	cursors.push(cursor);

	_.each(this._joins, function(join) {
		var ids = cursor.map(function(doc) { return doc[join.foreignKey]; });
		var cur = join.collection.find({ _id: { $in: ids }});
		cursors.push(cur);
	});

	return cursors;	
};
