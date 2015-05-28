Collection joins
================

With this package included, you can define joins between collections. `Collection.find` and `Collection.findOne` will return data expanded with docs from joined collections.
This package is used by [Meteor Kitchen](http://www.meteorkitchen.com) - code generator for Meteor.

Example
-------

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

Functions
=========

Collection.join(collection, foreignKey, containerField, fieldList)
------------------------------------------------------------------

`Collection.join(collection, foreignKey, containerField, fieldList)`

### Arguments:

`collection` Mongo.Collection object to join
`foreignKey` field name where foreign document _id is stored (in our example: `"companyId"`)
`containerField` field name where to store foreign document (in our example: `"company"`)
`fieldList` array of field names we want to get from foreign collection (in our example array with one field `["name"]`)

Use this function in scope visible both to client and server.


Collection.publishJoinedCursors(cursor)
---------------------------------------

For use server side in publications: instead of simply returning result from collection, we want to return cursors with data from joined collections too.
This function will query joined collections and will return array of cursors.

`Collection.publishJoinedCursors(cursor)`

### Arguments

`cursor` cursor that you normally return from publish function

Example **publish** function:

```
Meteor.publish("employees", function() {

	var cursor = Employees.find(); // do what you normally do here

	return Employees.publishJoinedCursors(cursor); // instead of simply returning resulting cursor
});
```
With queried employees, cursor with companies filtered by employee.companyId will be returned too.


That's it :)
