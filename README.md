Generic collection joins for Meteor
===================================

With this package included, you can define joins between collections. `Collection.find` and `Collection.findOne` will return data expanded with docs from joined collections. You can also create "generic join" - join one collection with multiple others using the same foreign key.

This package is used by [Meteor Kitchen](http://www.meteorkitchen.com) - code generator for Meteor.

Example 1 - simple join
-----------------------

We have two collections: Companies & Employees

```
var Companies = new Mongo.Collection("companies");
var Employees = new Mongo.Collection("employees");
```

Example **company** document:

```
{
	_id: "CQKDzmqmQXGhsC6PG",
	name: "Acme"
}
```

Example **employee** document:

```
{
	_id: "dySSKA25pCtKjo5uA",
	name: "Jimi Hendrix",
	companyId: "CQKDzmqmQXGhsC6PG"
}
```

Let's **define join** (in both server & client scope)

```
Employees.join(Companies, "companyId", "company", ["name"]);
```

*Or you can pass collection name:*

```
Employees.join("Companies", "companyId", "company", ["name"]);
```

Now, if you do:

```
Employees.find();
```

You'l get:

```
{
	_id: "dySSKA25pCtKjo5uA",
	name: "Jimi Hendrix",
	companyId: "CQKDzmqmQXGhsC6PG",
	company: {
		name: "Acme"
	}
}
```

Example 2 - generic join
------------------------

Let's say we have four collections:

```
var Companies = new Mongo.Collection("companies");
var Employees = new Mongo.Collection("employees");
var Tags = new Mongo.Collection("tags");
var TaggedDocuments = new Mongo.Collection("tagged_documents");
```

in "Tags" collection we have list of possible tags:

```
{
	_id: "wrWrXDqWwPrXCWsgu",
	name: "Awesome!"
}
```

We can tag documents from both "Companies" and "Employees". When document is tagged we are storing three values into "TaggedDocuments" collection:

```
{
	tagId: "wrWrXDqWwPrXCWsgu",
	collectionName: "Employees",
	docId: "dySSKA25pCtKjo5uA"
},
{
	tagId: "wrWrXDqWwPrXCWsgu",
	collectionName: "Companies",
	docId: "CQKDzmqmQXGhsC6PG"
}
```

- `tagId` stores tag _id from "Tags" collection
- `collectionName` stores name of collection where tagged document belongs to
- `docId` stores _id of tagged document

**collectionName** can be any existing collection.

Let's define generic join:

```
TaggedDocuments.genericJoin("collectionName", "docId", "document");
```

Now, if you do:

```
TaggedDocuments.find({ tagId: "wrWrXDqWwPrXCWsgu" });
```

You'l get something like this:

```
{
	tagId: "wrWrXDqWwPrXCWsgu",
	collectionName: "Employees",
	docId: "dySSKA25pCtKjo5uA",
	document: {
		name: "Jimi Hendrix",
		companyId: "CQKDzmqmQXGhsC6PG"
	}
},
{
	tagId: "wrWrXDqWwPrXCWsgu",
	collectionName: "Companies",
	docId: "CQKDzmqmQXGhsC6PG",
	document: {
		name: "Acme"
	}
}
```

Also, you can define simple join to "Tags" collection too:

```
TaggedDocuments.join(Tags, "tagId", "tag", []);
TaggedDocuments.genericJoin("collectionName", "docId", "document");
```

And now if you do:

```
TaggedDocuments.find({ tagId: "wrWrXDqWwPrXCWsgu" });
```

You'l get:

```
{
	tagId: "wrWrXDqWwPrXCWsgu",
	tag: {
		name: "Awesome!"
	},
	collectionName: "Employees",
	docId: "dySSKA25pCtKjo5uA",
	document: {
		name: "Jimi Hendrix",
		companyId: "CQKDzmqmQXGhsC6PG"
	}
},
{
	tagId: "wrWrXDqWwPrXCWsgu",
	tag: {
		name: "Awesome!"
	},
	collectionName: "Companies",
	docId: "CQKDzmqmQXGhsC6PG",
	document: {
		name: "Acme"
	}
}
```

voilà - we have generic N:M join!


Function reference
==================

Collection.join
---------------

`Collection.join(collection, foreignKey, containerField, fieldList)`

### Arguments:

- `collection` Mongo.Collection object (or collection name) to join
- `foreignKey` field name where foreign document _id is stored (in our example: `"companyId"`)
- `containerField` field name where to store foreign document (in our example: `"company"`)
- `fieldList` array of field names we want to get from foreign collection (in our example array with one field `["name"]`)

Use this function in scope visible both to client and server.


Collection.genericJoin
----------------------

`Collection.genericJoin(collectionNameField, foreignKey, containerField)`

- `collectionNameField` field name (from this collection) in which foreign collection name is stored
- `foreignKey` field name where foreign document _id is stored
- `containerField` field name where to store joined foreign document


Collection.publishJoinedCursors
-------------------------------

For use server side in publications: instead of simply returning result from collection, we want to return cursors with data from joined collections too.
This function will query joined collections and will return array of cursors.

`Collection.publishJoinedCursors(cursor)`

### Arguments

- `cursor` cursor that you normally return from publish function

Example **publish** function:

```
Meteor.publish("employees", function() {

	var cursor = Employees.find(); // do what you normally do here

	return Employees.publishJoinedCursors(cursor); // instead of simply returning resulting cursor
});
```
With queried employees, cursor with companies filtered by employee.companyId will be returned too.


Version history
===============

1.0.8
-----

- Foreign key name now can be in "dot" notation: `a.b.c`

1.0.7
-----

- Fixed error: "Publish function returned multiple cursors" when collection joins with the another collection multiple times

1.0.6
-----

- Updated this README.md


1.0.5
-----

- Now you can pass collection name as first argument to `join` function.

- Added generic joins.


Credits
=======

Thanks to [Robert Moggach](https://github.com/robmoggach).


---

That's it :)
