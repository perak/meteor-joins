Collection joins
================

With this package included, you can define joins. `Collection.find` and `Collection.findOne` will return documents expanded with docs from joined collections. 

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

Collection.join
---------------

`Collection.join(collection, foreignKey, containerField, fieldList)`

### Arguments:

`collection` Mongo.Collection object to join
`foreignKey` field name where foreign document _id is stored (in our example: `"companyId"`)
`containerField` field name where to store foreign document (in our example: `"company"`)
`fieldList` array of field names we want to get from foreign collection (in our example array with one field `["name"]`)


That's it :)
